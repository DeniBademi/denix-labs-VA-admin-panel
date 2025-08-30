import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import { SupabaseService } from 'app/core/supabase/supabase.service';
import { WorkspaceService } from 'app/core/workspace/workspace.service';

export interface KnowledgeBaseFile {
    name: string;
    url: string;
    uploadedAt?: string;
    size?: number;
}

@Injectable({
    providedIn: 'root'
})
export class KnowledgeBaseService {
    constructor(
        private _supabase: SupabaseService,
        private _workspace: WorkspaceService
    ) {}

    /**
     * List KB files for current workspace (from kb_sources)
     */
    listFiles(): Observable<KnowledgeBaseFile[]> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const wsId = await this._workspace.getWorkspaceId();
            if (!wsId) return [] as KnowledgeBaseFile[];

            const { data, error } = await supabase
                .from('kb_sources')
                .select('title, uri, created_at')
                .eq('workspace_id', wsId)
                .eq('type', 'file')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return (data ?? []).map(row => ({
                name: row.title,
                url: row.uri,
                uploadedAt: row.created_at
            } as KnowledgeBaseFile));
        })());
    }

    /**
     * Upload a file to the knowledge base (Supabase storage + kb_sources/kb_jobs)
     */
    uploadFile(file: File): Observable<KnowledgeBaseFile> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const wsId = await this._workspace.getWorkspaceId();
            if (!wsId) throw new Error('Workspace not set');

            // 1) Create source row (pending)
            const { data: source, error: srcErr } = await supabase
                .from('kb_sources')
                .insert({ workspace_id: wsId, type: 'file', title: file.name, status: 'pending' })
                .select('*')
                .single();
            if (srcErr) throw srcErr;

            // 2) Upload to storage bucket 'kb'
            const path = `${wsId}/${source.id}/${file.name}`;
            const { error: upErr } = await supabase.storage
                .from('kb')
                .upload(path, file, { upsert: true, contentType: file.type });
            if (upErr && !upErr.message?.includes('The resource already exists')) {
                throw upErr;
            }

            // 3) Update source uri and queue ingest job
            await supabase
                .from('kb_sources')
                .update({ uri: path })
                .eq('id', source.id);

            await supabase
                .from('kb_jobs')
                .insert({ workspace_id: wsId, source_id: source.id, kind: 'ingest', status: 'queued' });

            // Optional: call edge function to kick off ingestion
            // await supabase.functions.invoke('kb-ingest-file', { body: { workspace_id: wsId, source_id: source.id, path } });

            return {
                name: file.name,
                url: path,
                uploadedAt: new Date().toISOString(),
                size: file.size
            } as KnowledgeBaseFile;
        })());
    }

    /**
     * Delete a file/source
     */
    deleteFile(fileUrl: string): Observable<boolean> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const wsId = await this._workspace.getWorkspaceId();
            if (!wsId) throw new Error('Workspace not set');

            // Resolve source by uri (path)
            const { data: src, error } = await supabase
                .from('kb_sources')
                .select('id')
                .eq('workspace_id', wsId)
                .eq('uri', fileUrl)
                .maybeSingle();
            if (error) throw error;

            // Delete the object from storage
            const { error: delErr } = await supabase.storage.from('kb').remove([fileUrl]);
            if (delErr) throw delErr;

            // Delete the source row (cascades to documents/chunks)
            if (src?.id) {
                const { error: srcDelErr } = await supabase
                    .from('kb_sources')
                    .delete()
                    .eq('id', src.id);
                if (srcDelErr) throw srcDelErr;
            }

            return true;
        })());
    }

    /**
     * Generate a signed download URL for a file
     */
    getDownloadUrl(fileUrl: string): Observable<string> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const { data } = await supabase.storage.from('kb').createSignedUrl(fileUrl, 600);
            return data?.signedUrl ?? fileUrl;
        })());
    }
}
