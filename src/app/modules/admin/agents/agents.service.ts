import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, tap } from 'rxjs';
import { SupabaseService } from 'app/core/supabase/supabase.service';
import { WorkspaceService } from 'app/core/workspace/workspace.service';

export type AgentType = 'receptionist' | 'sales' | 'custom';

export interface AgentListItem {
    id: string;
    name: string;
    agent_type: AgentType;
    created_at?: string;
}

@Injectable({ providedIn: 'root' })
export class AgentsService {
    private _agents$ = new BehaviorSubject<AgentListItem[]>([]);

    constructor(
        private _supabase: SupabaseService,
        private _workspace: WorkspaceService
    ) {}

    get agents$(): Observable<AgentListItem[]> {
        return this._agents$.asObservable();
    }

    getAgents(): Observable<AgentListItem[]> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const wsId = await this._workspace.getWorkspaceId();
            const query = supabase
                .from('agent')
                .select('id, name, agent_type, created_at')
                .eq('workspace_id', wsId)
                .order('created_at', { ascending: false });
            const finalQuery = query;
            const { data, error } = await finalQuery;
            if (error) throw error;
            const list: AgentListItem[] = (data ?? []).map((row: any) => ({
                id: row.id,
                name: row.name,
                agent_type: row.agent_type,
                created_at: row.created_at
            }));
            this._agents$.next(list);
            return list;
        })());
    }

    createAgent(payload: { name: string; agent_type: AgentType }): Observable<AgentListItem> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const wsId = await this._workspace.getWorkspaceId();
            if (!wsId) throw new Error('Workspace not set');
            const { data, error } = await supabase
                .from('agent')
                .insert({ workspace_id: wsId, name: payload.name, agent_type: payload.agent_type })
                .select('id, name, agent_type, created_at')
                .single();
            if (error) throw error;
            const created: AgentListItem = { id: data.id, name: data.name, agent_type: data.agent_type, created_at: data.created_at };
            const current = this._agents$.value;
            this._agents$.next([created, ...current]);
            return created;
        })());
    }

    deleteAgent(agentId: string): Observable<void> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const { error } = await supabase
                .from('agent')
                .delete()
                .eq('id', agentId);
            if (error) throw error;
            this._agents$.next(this._agents$.value.filter(a => a.id !== agentId));
        })());
    }
}


