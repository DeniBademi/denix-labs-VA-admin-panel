import { Injectable } from '@angular/core';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { dashboard as dashboardData } from 'app/mock-api/common/dashboard/data';
import { cloneDeep } from 'lodash-es';

@Injectable({providedIn: 'root'})
export class DashboardMockApi {
    private _dashboard: any = dashboardData;

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
        // @ Dashboard - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/common/dashboard')
            .reply(() => [200, cloneDeep(this._dashboard)]);
    }
}
