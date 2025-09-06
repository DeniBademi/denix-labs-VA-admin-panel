import { Injectable } from '@angular/core';
import { SupabaseService } from 'app/core/supabase/supabase.service';

@Injectable({
    providedIn: 'root'
})
export class KnowledgeBaseProcessorService {
    constructor(private _supabase: SupabaseService) {}

    /**
     * Triggers server-side processing (text extraction, chunking, embeddings, persistence)
     * via the Supabase Edge Function 'super-responder'.
     */
    async processSource(workspaceId: string, sourceId: string, uri: string): Promise<void> {
        const supabase = this._supabase.getSupabase;
        const { error, data } = await supabase.functions.invoke('super-responder', {
            body: {
                workspace_id: workspaceId,
                source_id: sourceId,
                file_path: uri
            }
        });
        if (error) {
            throw error;
        }
        // Optionally inspect data for errors returned by the function
        if (data && (data as any).error) {
            throw new Error((data as any).error);
        }
    }
}


