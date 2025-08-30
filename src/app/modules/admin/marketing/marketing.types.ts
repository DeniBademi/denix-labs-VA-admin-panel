/**
 * Campaign status
 */
export type CampaignStatus = 'draft' | 'scheduled' | 'active' | 'paused' | 'completed';

/**
 * Campaign interface
 */
export interface Campaign {
    id: string;
    name: string;
    bannerUrl: string;
    forwardUrl: string;
    status: CampaignStatus;
    startDate: string;
    endDate: string;
    targetCategories?: string[];  // Product category paths
    targetProducts?: string[];    // Product IDs
}

/**
 * Campaign list response interface
 */
export interface CampaignsResponse {
    campaigns: Campaign[];
    total: number;
    page: number;
    limit: number;
}

/**
 * Campaign filter interface
 */
export interface CampaignFilter {
    search?: string;
    status?: CampaignStatus[];
    startDate?: string;
    endDate?: string;
    category?: string;
    sortBy?: 'name' | 'status' | 'startDate' | 'endDate';
    sortDirection?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}