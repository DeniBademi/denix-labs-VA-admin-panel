import { Injectable } from '@angular/core';
import { Observable, switchMap } from 'rxjs';
import { SupabaseService } from 'app/core/supabase/supabase.service';
import { WorkspaceService } from 'app/core/workspace/workspace.service';
import { KnowledgeBaseProcessorService } from './knowledge-base-processor.service';
import { AgentService } from '../agent.service';
import { BaseAgentService } from '../shared/base-agent-service';

export interface KnowledgeBaseFile {
    name: string;
    url: string;
    uploadedAt?: string;
    size?: number;
}

@Injectable({
    providedIn: 'root'
})
export class KnowledgeBaseService extends BaseAgentService {

    constructor(
        protected override _supabase: SupabaseService,
        private _workspace: WorkspaceService,
        private _agentService: AgentService,
        private _processor: KnowledgeBaseProcessorService
    ) {
        super(_supabase);
    }

    /**
     * List KB files for current workspace (from kb_sources)
     */
    listFiles(): Observable<KnowledgeBaseFile[]> {
        return this.executeSupabaseOperation(async () => {
            const agentId = this.getAgentId();
            if (!agentId) return [] as KnowledgeBaseFile[];

            const data = await this.performSelect<any>('kb_sources', 'title, uri, created_at', [
                { column: 'agent_id', value: agentId },
                { column: 'type', value: 'file' }
            ]);

            // Sort by created_at descending
            const sortedData = data.sort((a, b) =>
                new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            return sortedData.map(row => ({
                name: row.title,
                url: row.uri,
                uploadedAt: row.created_at
            } as KnowledgeBaseFile));
        });
    }

    /**
     * Upload a file to the knowledge base (Supabase storage + kb_sources/kb_jobs)
     */
    uploadFile(file: File): Observable<KnowledgeBaseFile> {
        return this.executeSupabaseOperation(async () => {
            this.validateAgentId();
            const agentId = this.getAgentId()!;

            // Ensure there is an authenticated Supabase session
            const userId = await this.getAuthenticatedUserId();
            const clientWsId = await this._workspace.getWorkspaceId();

            // 1) Create source row (pending)
            const source = await this.performInsert<any>('kb_sources', {
                agent_id: agentId,
                type: 'file',
                title: file.name,
                status: 'pending'
            });

            if (!this.isValidUuid(source?.id)) {
                throw new Error('Invalid source id');
            }

            // 2) Upload to storage bucket 'kb'
            const safeFileName = String(file.name ?? 'file').replace(/[\\/]/g, '_');
            const path = `${clientWsId}/${agentId}/${source.id}/${safeFileName}`;
            const supabase = this._supabase.getSupabase;
            const bucket = supabase.storage.from('kb');
            let { error: upErr } = await bucket.upload(path, file, { upsert: true, contentType: file.type });
            if (upErr && !upErr.message?.includes('The resource already exists')) {
                const isUuidCastErr = /invalid input syntax for type uuid/i.test(upErr.message ?? '');
                if (isUuidCastErr) {
                    // Fallback: Use signed upload URL to bypass owner uuid assignment quirks
                    const { data: signed, error: signErr } = await bucket.createSignedUploadUrl(path);
                    if (signErr || !signed?.token) {
                        throw upErr; // original error if we cannot get a signed URL
                    }
                    const { error: signedErr } = await bucket.uploadToSignedUrl(path, signed.token, file, { upsert: true, contentType: file.type });
                    if (signedErr) {
                        throw upErr; // keep original error context
                    }
                    upErr = null;
                } else {
                    throw upErr;
                }
            }

            // 3) Update source uri and queue ingest job
            await this.performUpdate<any>('kb_sources', { uri: path }, [
                { column: 'id', value: source.id }
            ]);

            // 4) Trigger server-side processing via Edge Function
            try {
                await this._processor.processSource(clientWsId, agentId, source.id, path);
            } catch (procErr) {
                console.error('Error processing file', procErr);
                // Mark source as failed and rethrow to surface error to UI
                await this.performUpdate<any>('kb_sources', { status: 'error' }, [
                    { column: 'id', value: source.id }
                ]);
                throw procErr;
            }


            return {
                name: file.name,
                url: path,
                uploadedAt: new Date().toISOString(),
                size: file.size
            } as KnowledgeBaseFile;
        });
    }

    /**
     * Delete a file/source
     */
    deleteFile(fileUrl: string): Observable<boolean> {
        return this.executeSupabaseOperation(async () => {
            this.validateAgentId();
            const agentId = this.getAgentId()!;

            if (!fileUrl || !fileUrl.trim()) {
                throw new Error('Invalid file URL');
            }

            console.log('Deleting file with URL:', fileUrl);

            // Resolve source by uri (path)
            const sources = await this.performSelect<any>('kb_sources', 'id, uri', [
                { column: 'agent_id', value: agentId },
                { column: 'uri', value: fileUrl }
            ]);

            if (sources.length === 0) {
                console.warn('No source found for URL:', fileUrl);
                return true; // Already deleted or doesn't exist
            }

            const src = sources[0];
            console.log('Found source:', src);

            // Delete the source row first (cascades to documents/chunks)
            await this.performDelete('kb_sources', [
                { column: 'id', value: src.id }
            ]);

            // Delete the object from storage using the actual stored URI
            const storagePathToDelete = src.uri || fileUrl;
            console.log('Attempting to delete from storage:', storagePathToDelete);

            try {
                const supabase = this._supabase.getSupabase;
                const { error: delErr } = await supabase.storage.from('kb').remove([storagePathToDelete]);
                if (delErr) {
                    console.error('Storage deletion error:', delErr, 'for path:', storagePathToDelete);
                    // Log but don't fail the operation since DB record is deleted
                }
            } catch (storageError) {
                console.error('Storage deletion exception:', storageError);
                // Continue - storage cleanup is secondary to DB cleanup
            }

            return true;
        });
    }

    /**
     * Generate a signed download URL for a file
     */
    getDownloadUrl(fileUrl: string): Observable<string> {
        return this.executeSupabaseOperation(async () => {
            const supabase = this._supabase.getSupabase;
            const { data } = await supabase.storage.from('kb').createSignedUrl(fileUrl, 600);
            return data?.signedUrl ?? fileUrl;
        });
    }
}
