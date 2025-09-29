/**
 * Usage data
 */
export interface UsageData {
    series: {
        name: string;
        data: {
            x: Date;
            y: number;
        }[];
    }[];
    timeframe: 'day' | 'week' | 'month';
}

/**
 * Campaign performance data
 */
export interface CampaignPerformanceData {
    categories: string[];
    series: {
        name: string;
        data: number[];
    }[];
}

/**
 * Frustration data
 */
export interface FrustrationData {
    series: {
        name: string;
        data: {
            x: Date;
            y: number;
        }[];
    }[];
    timeframe: 'day' | 'week' | 'month';
}

/**
 * Dashboard data
 */
export interface DashboardData {
    usage: UsageData;
    campaignPerformance: CampaignPerformanceData;
    frustration: FrustrationData;
}