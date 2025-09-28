import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AgentService, AgentType } from 'app/modules/admin/agent/agent.service';
import { Observable, of } from 'rxjs';
import { map, switchMap, take } from 'rxjs/operators';

/**
 * Guard routes by workspace agent type.
 * Usage in route data: { agentTypes: ['sales','custom'] }
 */
export const AgentTypeGuard: CanActivateFn = (route): Observable<boolean | ReturnType<Router['parseUrl']>> => {
    const router = inject(Router);
    const agentService = inject(AgentService);
    const allowedAgentTypes = (route.data?.['agentTypes'] as AgentType[] | undefined) ?? [];

    // If no restriction specified, allow
    if (!allowedAgentTypes.length) {
        return of(true);
    }

    const agentId = route.paramMap.get('agent_id') ?? '';
    if (!agentId) {
        return of(router.parseUrl('/dashboard'));
    }

    // Load config for the specific agent id
    return agentService.getConfigForAgent(agentId).pipe(
        map((cfg) => {
            const currentType: AgentType = (cfg?.agentType ?? 'receptionist') as AgentType;

            // // Custom agent type has access to all routes
            // if (currentType === 'custom') {
            //     return true;
            // }

            // Allow if current type is listed
            if (allowedAgentTypes.includes(currentType)) {
                return true;
            }

            // Redirect to dashboard if not allowed
            return router.parseUrl('/dashboard');
        })
    );
};


