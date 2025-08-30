import { Injectable } from '@angular/core';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { agentConfig as agentConfigData } from 'app/mock-api/common/agent/data';
import { cloneDeep } from 'lodash-es';

@Injectable({providedIn: 'root'})
export class AgentMockApi {
    private _config: any = agentConfigData;

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
        // @ Agent config - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/agent/config')
            .reply(() => [200, cloneDeep(this._config)]);

        // -----------------------------------------------------------------------------------------------------
        // @ Agent config - PUT
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPut('api/agent/config')
            .reply(({request}) => {
                // Get the config
                const config = request.body;

                // Update the config
                this._config = cloneDeep(config);

                // Return the response
                return [200, cloneDeep(this._config)];
            });
    }
}
