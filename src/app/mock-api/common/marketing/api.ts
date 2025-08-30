import { Injectable } from '@angular/core';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { campaigns as campaignsData } from 'app/mock-api/common/marketing/data';
import { Campaign } from 'app/modules/admin/marketing/marketing.types';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({providedIn: 'root'})
export class MarketingMockApi {
    private _campaigns: any[] = campaignsData;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService) {
        // Register Mock API handlers
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // -----------------------------------------------------------------------------------------------------
        // @ Campaigns - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/marketing/campaigns')
            .reply(({request}) => {
                // Get the filter parameters
                const search = request.params.get('search')?.toLowerCase();
                const status = request.params.getAll('status[]');
                const category = request.params.get('category');
                const startDate = request.params.get('startDate');
                const endDate = request.params.get('endDate');
                const sortBy = request.params.get('sortBy') || 'name';
                const sortDirection = request.params.get('sortDirection') || 'asc';
                const page = parseInt(request.params.get('page') || '0', 10);
                const limit = parseInt(request.params.get('limit') || '10', 10);

                // Clone the campaigns
                let campaigns = cloneDeep(this._campaigns);

                // Filter by search term
                if (search) {
                    campaigns = campaigns.filter(campaign =>
                        campaign.name.toLowerCase().includes(search)
                    );
                }

                // Filter by status
                if (status?.length) {
                    campaigns = campaigns.filter(campaign => status.includes(campaign.status));
                }

                // Filter by category
                if (category) {
                    campaigns = campaigns.filter(campaign =>
                        campaign.targetCategories?.includes(category)
                    );
                }

                // Filter by date range
                if (startDate) {
                    campaigns = campaigns.filter(campaign =>
                        new Date(campaign.endDate) >= new Date(startDate)
                    );
                }
                if (endDate) {
                    campaigns = campaigns.filter(campaign =>
                        new Date(campaign.startDate) <= new Date(endDate)
                    );
                }

                // Sort campaigns
                campaigns.sort((a, b) => {
                    let compareResult = 0;
                    switch (sortBy) {
                        case 'status':
                            compareResult = a.status.localeCompare(b.status);
                            break;
                        case 'startDate':
                            compareResult = new Date(a.startDate).getTime() - new Date(b.startDate).getTime();
                            break;
                        case 'endDate':
                            compareResult = new Date(a.endDate).getTime() - new Date(b.endDate).getTime();
                            break;
                        default:
                            compareResult = a.name.localeCompare(b.name);
                    }
                    return sortDirection === 'asc' ? compareResult : -compareResult;
                });

                // Paginate campaigns
                const start = page * limit;
                const paginatedCampaigns = campaigns.slice(start, start + limit);

                return [200, {
                    campaigns: paginatedCampaigns,
                    total: campaigns.length,
                    page,
                    limit
                }];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Campaign - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/marketing/campaigns/:id')
            .reply(({request}) => {
                const id = request.params.get('id');
                const campaign = this._campaigns.find(item => item.id === id);

                return [200, cloneDeep(campaign)];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Campaign - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/marketing/campaigns')
            .reply(({request}) => {
                const campaign = request.body.campaign;

                campaign.id = this._generateId();
                this._campaigns.push(campaign);

                return [200, cloneDeep(campaign)];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Campaign - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/marketing/campaigns/:id')
            .reply(({request}) => {
                const id = request.params.get('id');
                const campaign = request.body.campaign;

                const index = this._campaigns.findIndex(item => item.id === id);
                this._campaigns[index] = assign({}, this._campaigns[index], campaign);

                return [200, cloneDeep(this._campaigns[index])];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Campaign - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/marketing/campaigns/:id')
            .reply(({request}) => {
                const id = request.params.get('id');

                const index = this._campaigns.findIndex(item => item.id === id);
                this._campaigns.splice(index, 1);

                return [200, true];
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Generate a new ID
     */
    private _generateId(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';

        for (let i = 0; i < 8; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return id;
    }
}