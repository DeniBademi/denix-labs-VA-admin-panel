/* eslint-disable */
import { AgentConfig } from 'app/modules/admin/agent/agent.service';

export const agentConfig: AgentConfig = {
    disclaimers: [
        {
            text: 'This is an AI assistant. All recommendations are suggestions only.',
            requirePermission: true
        },
        {
            text: 'Your conversation may be recorded for quality and training purposes.',
            requirePermission: false
        }
    ],
    personality: "",
    environment: "",
    tone: "",
    goals: "",
    guardrails: "",
};
