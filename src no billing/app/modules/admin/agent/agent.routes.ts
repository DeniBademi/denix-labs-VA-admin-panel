import { Routes } from '@angular/router';
import { AgentComponent } from './agent.component';

export default [
    {
        path: '',
        component: AgentComponent,
        // agent_id comes from parent route param
    },
] as Routes;
