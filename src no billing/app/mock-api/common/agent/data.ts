/* eslint-disable */
import { AgentConfig } from 'app/modules/admin/agent/agent.service';

export const agentConfig: AgentConfig = {
    agentType: "receptionist",
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
    availability: {
        workHours: {
            timezone: 'UTC',
            days: {
                0: { enabled: true, ranges: [{ start: '09:00', end: '17:00' }] },
                1: { enabled: true, ranges: [{ start: '09:00', end: '17:00' }] },
                2: { enabled: true, ranges: [{ start: '09:00', end: '17:00' }] },
                3: { enabled: true, ranges: [{ start: '09:00', end: '17:00' }] },
                4: { enabled: true, ranges: [{ start: '09:00', end: '17:00' }] },
                5: { enabled: false, ranges: [] },
                6: { enabled: false, ranges: [] }
            }
        }
    }
};
