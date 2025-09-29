import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { SupabaseService } from 'app/core/supabase/supabase.service';
import { BaseAgentService } from './shared/base-agent-service';

export type AgentType = 'receptionist' | 'sales' | 'custom';

export interface AgentConfig {
    agentType: AgentType;
    disclaimers: {
        text: string;
        requirePermission: boolean;
    }[];
    personality: string;
    environment: string;
    tone: string;
    goals: string;
    guardrails: string;
    availability?: { workHours: any } | null;
}

@Injectable({providedIn: 'root'})
export class AgentService extends BaseAgentService {
    private _config: BehaviorSubject<AgentConfig> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(
        protected override _supabase: SupabaseService
    ) {
        super(_supabase);
    }

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
        return this.executeSupabaseOperation(async () => {
            this.validateAgentId();
            const agentId = this.getAgentId()!;

            // Load agent row
            const agent = await this.performSelect<any>('agent', '*', [
                { column: 'id', value: agentId }
            ]).then(results => {
                if (results.length === 0) throw new Error('Agent not found');
                return results[0];
            });

            // Fetch config for this agent
            const cfgResults = await this.performSelect<any>('agent_config', '*', [
                { column: 'agent_id', value: agentId }
            ]);
            const cfgRow = cfgResults.length > 0 ? cfgResults[0] : null;

            const cfg = this._composeConfig(agent, cfgRow);
            this._config.next(cfg);
            return cfg;
        });
    }

    getConfigForAgent(agentId: string): Observable<AgentConfig> {
        return this.executeSupabaseOperation(async () => {
            if (!agentId) throw new Error('Agent id is required');
            if (!this.isValidUuid(agentId)) throw new Error('Invalid agent ID format');

            // Load agent row
            const agent = await this.performSelect<any>('agent', '*', [
                { column: 'id', value: agentId }
            ]).then(results => {
                if (results.length === 0) throw new Error('Agent not found');
                return results[0];
            });

            // Fetch config for this agent
            const cfgResults = await this.performSelect<any>('agent_config', '*', [
                { column: 'agent_id', value: agentId }
            ]);
            const cfgRow = cfgResults.length > 0 ? cfgResults[0] : null;

            return this._composeConfig(agent, cfgRow);
        });
    }

    /**
     * Update agent configuration
     */
    updateConfig(config: AgentConfig): Observable<AgentConfig> {
        return this.executeSupabaseOperation(async () => {
            this.validateAgentId();
            const agentId = this.getAgentId()!;

            // Load existing agent
            const existingAgent = await this.performSelect<any>('agent', '*', [
                { column: 'id', value: agentId }
            ]).then(results => {
                if (results.length === 0) throw new Error('Agent not found');
                return results[0];
            });

            let agent = existingAgent;
            // Update agent type if needed
            if (agent.agent_type !== config.agentType) {
                agent = await this.performUpdate<any>('agent',
                    { agent_type: config.agentType },
                    [{ column: 'id', value: agentId }]
                );
            }

            // Upsert agent_config by agent_id
            const payload = this._mapConfigToDb(config);
            payload.agent_id = agentId;
            const configData = await this.performUpsert<any>('agent_config', payload, 'agent_id');

            const updated = this._composeConfig(agent, configData);
            this._config.next(updated);
            return updated;
        });
    }

    private _composeConfig = (agentRow: any, cfgRow: any): AgentConfig => {
        if (!cfgRow) {
            return {
                agentType: (agentRow?.agent_type as AgentType) ?? 'receptionist',
                disclaimers: [],
                personality: '',
                environment: '',
                tone: '',
                goals: '',
                guardrails: '',
                availability: { workHours: null }
            };
        }
        // Backward compatibility: if availability exists but isn't nested, wrap it
        const rawAvailability = cfgRow.availability ?? null;
        const availability = rawAvailability && typeof rawAvailability === 'object' && 'workHours' in rawAvailability
            ? rawAvailability
            : { workHours: rawAvailability };
        return {
            agentType: (agentRow?.agent_type as AgentType) ?? 'receptionist',
            disclaimers: cfgRow.disclaimers ?? [],
            personality: cfgRow.personality ?? '',
            environment: cfgRow.environment ?? '',
            tone: cfgRow.tone ?? '',
            goals: cfgRow.goals ?? '',
            guardrails: cfgRow.guardrails ?? '',
            availability
        } as AgentConfig;
    };

    private _mapConfigToDb = (cfg: AgentConfig): any => {
        const availability = cfg?.availability && typeof cfg.availability === 'object' && 'workHours' in cfg.availability
            ? cfg.availability
            : { workHours: cfg?.availability ?? null };
        return {
            disclaimers: cfg.disclaimers,
            personality: cfg.personality,
            environment: cfg.environment,
            tone: cfg.tone,
            goals: cfg.goals,
            guardrails: cfg.guardrails,
            availability
        };
    };

    // Removed auto-create-by-workspace to support multiple agents. Creation is handled via Agents overview.
}
