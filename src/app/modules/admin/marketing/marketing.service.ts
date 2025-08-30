import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, switchMap, tap } from 'rxjs';
import { SupabaseService } from 'app/core/supabase/supabase.service';
import { WorkspaceService } from 'app/core/workspace/workspace.service';
import { Campaign, CampaignFilter, CampaignsResponse } from './marketing.types';

@Injectable({ providedIn: 'root' })
export class MarketingService {
    private _campaigns: BehaviorSubject<Campaign[]> = new BehaviorSubject<Campaign[]>([]);
    private _pagination: BehaviorSubject<{ total: number; page: number; limit: number }> = new BehaviorSubject({
        total: 0,
        page: 0,
        limit: 10
    });

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
     * Getter for campaigns
     */
    get campaigns$(): Observable<Campaign[]> {
        return this._campaigns.asObservable();
    }

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<{ total: number; page: number; limit: number }> {
        return this._pagination.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get campaigns
     */
    getCampaigns(filter?: CampaignFilter): Observable<CampaignsResponse> {
        return from(this._workspace.getWorkspaceId()).pipe(
            // eslint-disable-next-line rxjs/no-ignored-observable
            switchMap((wsId) => {
                const supabase = this._supabase.getSupabase;
                let query = supabase
                    .from('campaigns')
                    .select('*', { count: 'exact' })
                    .eq('workspace_id', wsId);

                if (filter?.search) {
                    query = query.ilike('name', `%${filter.search}%`);
                }
                if (filter?.status && filter.status.length > 0) {
                    query = query.in('status', filter.status);
                }
                if (filter?.startDate) {
                    query = query.gte('start_date', filter.startDate);
                }
                if (filter?.endDate) {
                    query = query.lte('end_date', filter.endDate);
                }
                if (filter?.category) {
                    // category filter via target_categories
                    query = query.contains('target_categories', [filter.category]);
                }

                // Sorting
                const sortBy = filter?.sortBy ?? 'startDate';
                const sortDir = (filter?.sortDirection ?? 'desc') === 'desc';
                const sortColumnMap: Record<string, string> = {
                    name: 'name',
                    status: 'status',
                    startDate: 'start_date',
                    endDate: 'end_date'
                };
                query = query.order(sortColumnMap[sortBy], { ascending: !sortDir });

                // Pagination
                const page = filter?.page ?? 0;
                const limit = filter?.limit ?? 10;
                const fromIdx = page * limit;
                const toIdx = fromIdx + limit - 1;
                query = query.range(fromIdx, toIdx);

                return from(query.then(({ data, count, error }) => {
                    if (error) throw error;
                    const campaigns = (data ?? []).map(this._mapDbToCampaign);
                    return { campaigns, total: count ?? campaigns.length, page, limit } as CampaignsResponse;
                }));
            }),
            tap((response) => {
                this._campaigns.next(response.campaigns);
                this._pagination.next({ total: response.total, page: response.page, limit: response.limit });
            })
        );
    }

    /**
     * Get campaign by id
     */
    getCampaign(id: string): Observable<Campaign> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const { data, error } = await supabase
                .from('campaigns')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return this._mapDbToCampaign(data);
        })());
    }

    /**
     * Create campaign
     */
    createCampaign(campaign: Partial<Campaign>): Observable<Campaign> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const wsId = await this._workspace.getWorkspaceId();
            const payload = this._mapCampaignToDb(campaign);

            payload.workspace_id = wsId;
            const { data, error } = await supabase
                .from('campaigns')
                .insert(payload)
                .select('*')
                .single();
            if (error) throw error;
            const created = this._mapDbToCampaign(data);
            const campaigns = this._campaigns.value;
            this._campaigns.next([...campaigns, created]);
            return created;
        })());
    }

    /**
     * Update campaign
     */
    updateCampaign(id: string, campaign: Partial<Campaign>): Observable<Campaign> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const payload = this._mapCampaignToDb(campaign);
            const { data, error } = await supabase
                .from('campaigns')
                .update(payload)
                .eq('id', id)
                .select('*')
                .single();
            if (error) throw error;
            const updated = this._mapDbToCampaign(data);
            const campaigns = this._campaigns.value;
            const index = campaigns.findIndex((item) => item.id === updated.id);
            if (index !== -1) {
                campaigns[index] = updated;
                this._campaigns.next([...campaigns]);
            }
            return updated;
        })());
    }

    /**
     * Delete campaign
     */
    deleteCampaign(id: string): Observable<void> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const { error } = await supabase
                .from('campaigns')
                .delete()
                .eq('id', id);
            if (error) throw error;
            const campaigns = this._campaigns.value;
            const index = campaigns.findIndex((item) => item.id === id);
            if (index !== -1) {
                campaigns.splice(index, 1);
                this._campaigns.next([...campaigns]);
            }
        })());
    }

    /**
     * Update campaign status
     */
    updateCampaignStatus(id: string, status: Campaign['status']): Observable<Campaign> {
        return this.updateCampaign(id, { status });
    }

    private _mapDbToCampaign = (row: any): Campaign => {
        return {
            id: row.id,
            name: row.name,
            bannerUrl: row.banner_url ?? '',
            forwardUrl: row.forward_url ?? '',
            status: row.status,
            startDate: row.start_date ?? null,
            endDate: row.end_date ?? null,
            targetCategories: row.target_categories ?? [],
            targetProducts: row.target_products ?? []
        } as Campaign;
    };

    private _mapCampaignToDb = (campaign: Partial<Campaign>): any => {
        const payload: any = {};
        if (campaign.name !== undefined) payload.name = campaign.name;
        if (campaign.bannerUrl !== undefined) payload.banner_url = campaign.bannerUrl;
        if (campaign.forwardUrl !== undefined) payload.forward_url = campaign.forwardUrl;
        if (campaign.status !== undefined) payload.status = campaign.status;
        if (campaign.startDate !== undefined) payload.start_date = campaign.startDate;
        if (campaign.endDate !== undefined) payload.end_date = campaign.endDate;
        if (campaign.targetCategories !== undefined) payload.target_categories = campaign.targetCategories;
        if (campaign.targetProducts !== undefined) payload.target_products = campaign.targetProducts as any;
        return payload;
    };


}
