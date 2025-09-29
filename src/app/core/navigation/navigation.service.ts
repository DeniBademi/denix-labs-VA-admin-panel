import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { Observable, ReplaySubject, from } from 'rxjs';
import { FuseNavigationItem } from '@fuse/components/navigation';
import { SupabaseService } from 'app/core/supabase/supabase.service';
import { WorkspaceService } from 'app/core/workspace/workspace.service';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _httpClient = inject(HttpClient);
    private _navigation: ReplaySubject<Navigation> =
        new ReplaySubject<Navigation>(1);
    private _lastNavigation: Navigation | null = null;
    private _supabase = inject(SupabaseService);
    private _workspace = inject(WorkspaceService);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation> {
        return this._navigation.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation> {
        return from(this._buildNavigationFromAgents());
    }

    private async _buildNavigationFromAgents(): Promise<Navigation> {
        const supabase = this._supabase.getSupabase;
        const wsId = await this._workspace.getWorkspaceId();

        // Base items not tied to a specific agent
        const baseItems: FuseNavigationItem[] = [
            { id: 'dashboard', title: 'Dashboard', type: 'basic', icon: 'heroicons_outline:chart-bar', link: '/dashboard' },
            { id: 'agents', title: 'Agents', type: 'basic', icon: 'heroicons_outline:user-group', link: '/agents' },
            { id: 'calls', title: 'Calls', type: 'basic', icon: 'heroicons_outline:phone', link: '/calls' },
            { id: 'users', title: 'User Management', type: 'basic', icon: 'heroicons_outline:users', link: '/users' },
            { id: 'billing', title: 'Billing', type: 'basic', icon: 'heroicons_outline:credit-card', link: '/billing' },
        ];

        // Fetch agents for this workspace
        const { data: agents, error } = await supabase
            .from('agent')
            .select('id, name, agent_type')
            .eq('workspace_id', wsId);


        if (error) throw error;

        const agentGroups: FuseNavigationItem[] = (agents ?? []).map((a: any) => {
            const children: FuseNavigationItem[] = [
                { id: `agent-${a.id}-config`, title: 'Configuration', type: 'basic', icon: 'heroicons_outline:cog-8-tooth', link: `/agent/${a.id}` },
                { id: `agent-${a.id}-qr`, title: 'Access', type: 'basic', icon: 'heroicons_outline:cursor-arrow-rays', link: `/access/${a.id}` },
                { id: `agent-${a.id}-availability`, title: 'Availability', type: 'basic', icon: 'heroicons_outline:clock', link: `/availability/${a.id}` },
            ];
            if (a.agent_type === 'sales') {
                children.push(
                    { id: `agent-${a.id}-products`, title: 'Products', type: 'basic', icon: 'heroicons_outline:shopping-bag', link: `/products/${a.id}` },
                    { id: `agent-${a.id}-marketing`, title: 'Marketing', type: 'basic', icon: 'heroicons_outline:megaphone', link: `/marketing/${a.id}` },
                );
            }
            return {
                id: `agent-${a.id}`,
                title: a.name || 'Agent',
                type: 'group',
                children,
            } as FuseNavigationItem;
        });

        const nav: Navigation = {
            compact: [...baseItems, ...agentGroups],
            default: [...baseItems, ...agentGroups],
            futuristic: [...baseItems, ...agentGroups],
            horizontal: [...baseItems, ...agentGroups],
        };
        this._lastNavigation = nav;
        this._navigation.next(nav);
        return nav;
    }

    /**
     * Apply agent type filter to navigation and emit updated menus
     */
    applyAgentType(agentType: 'receptionist' | 'sales' | 'custom'): void {
        // No-op with agent-grouped navigation; kept for compatibility
    }
}
