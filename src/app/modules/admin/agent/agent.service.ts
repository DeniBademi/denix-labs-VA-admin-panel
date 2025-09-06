import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, tap } from 'rxjs';
import { SupabaseService } from 'app/core/supabase/supabase.service';
import { WorkspaceService } from 'app/core/workspace/workspace.service';

export interface AgentConfig {
    disclaimers: {
        text: string;
        requirePermission: boolean;
    }[];
    personality: string;
    environment: string;
    tone: string;
    goals: string;
    guardrails: string;
}

@Injectable({providedIn: 'root'})
export class AgentService {
    private _config: BehaviorSubject<AgentConfig> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(
        private _supabase: SupabaseService,
        private _workspace: WorkspaceService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for config
     */
    get config$(): Observable<AgentConfig> {
        return this._config.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get agent configuration
     */
    getConfig(): Observable<AgentConfig> {
        return from((async () => {
            const wsId = await this._workspace.getWorkspaceId();
            const supabase = this._supabase.getSupabase;
            const { data, error } = await supabase
                .from('agent_config')
                .select('*')
                .eq('workspace_id', wsId)
                .maybeSingle();
            if (error) throw error;
            const cfg = this._mapDbToConfig(data);
            this._config.next(cfg);
            return cfg;
        })());
    }

    /**
     * Update agent configuration
     */
    updateConfig(config: AgentConfig): Observable<AgentConfig> {
        return from((async () => {
            const wsId = await this._workspace.getWorkspaceId();
            const supabase = this._supabase.getSupabase;
            // Upsert by workspace
            const payload = this._mapConfigToDb(config);
            payload.workspace_id = wsId;
            const { data, error } = await supabase
                .from('agent_config')
                .upsert(payload, { onConflict: 'workspace_id' })
                .select('*')
                .single();
            if (error) throw error;
            const updated = this._mapDbToConfig(data);
            this._config.next(updated);
            return updated;
        })());
    }

    private _mapDbToConfig = (row: any): AgentConfig => {
        if (!row) {
            return {
                disclaimers: [],
                personality: '',
                environment: '',
                tone: '',
                goals: '',
                guardrails: ''
            };
        }
        return {
            disclaimers: row.disclaimers ?? [],
            personality: row.personality ?? '',
            environment: row.environment ?? '',
            tone: row.tone ?? '',
            goals: row.goals ?? '',
            guardrails: row.guardrails ?? ''
        } as AgentConfig;
    };

    private _mapConfigToDb = (cfg: AgentConfig): any => ({
        disclaimers: cfg.disclaimers,
        personality: cfg.personality,
        environment: cfg.environment,
        tone: cfg.tone,
        goals: cfg.goals,
        guardrails: cfg.guardrails
    });
}
