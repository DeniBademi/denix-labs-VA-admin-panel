import { Injectable } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WorkspaceService {
    private static readonly STORAGE_KEY = 'workspaceId';
    private _workspaceId = new BehaviorSubject<string | null>(null);
    private _isLoading = false;

    constructor(private _supabase: SupabaseService) {
        const cached = localStorage.getItem(WorkspaceService.STORAGE_KEY);
        if (cached) {
            this._workspaceId.next(cached);
        }
    }

    get workspaceId$() {
        return this._workspaceId.asObservable();
    }

    async getWorkspaceId(): Promise<string | null> {
        const current = this._workspaceId.value;
        if (current) {
            return current;
        }

        const stored = localStorage.getItem(WorkspaceService.STORAGE_KEY);
        if (stored) {
            this._workspaceId.next(stored);
            return stored;
        }

        if (this._isLoading) {
            return null;
        }

        this._isLoading = true;
        try {
            const supabase = this._supabase.getSupabase;
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData.session?.user?.id;
            if (!userId) {
                this.setWorkspaceId(null);
                return null;
            }
            const { data, error } = await supabase
                .from('profiles')
                .select('workspace_id')
                .eq('id', userId)
                .single();
            if (error) {
                this.setWorkspaceId(null);
                return null;
            }
            let wsId = data?.workspace_id ?? null;

            // If the user has no workspace, provision one via secure RPC (first-time registration)
            if (!wsId) {
                try {
                    const { data: rpcData, error: rpcErr } = await supabase.rpc('provision_workspace_for_current_user');
                    if (rpcErr) throw rpcErr;
                    wsId = rpcData as string;
                } catch (e) {
                    wsId = null;
                }
            }

            this.setWorkspaceId(wsId);
            return wsId;
        } finally {
            this._isLoading = false;
        }
    }


    async getOrganizationId(): Promise<string | null> {
        const supabase = this._supabase.getSupabase;
        const { data, error } = await supabase
            .from('organizations')
            .select('id')
            .single();

        if (error) {
            return null;
        }
        return data?.id ?? null;
    }

    setWorkspaceId(workspaceId: string | null): void {
        this._workspaceId.next(workspaceId);
        if (workspaceId) {
            localStorage.setItem(WorkspaceService.STORAGE_KEY, workspaceId);
        } else {
            localStorage.removeItem(WorkspaceService.STORAGE_KEY);
        }
    }

    async initForCurrentUser(): Promise<string | null> {
        return this.getWorkspaceId();
    }

    // Workspace provisioning is handled by RPC 'provision_workspace_for_current_user'
}


