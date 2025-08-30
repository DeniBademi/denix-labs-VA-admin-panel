import { Injectable } from '@angular/core';
import { FuseMockApiService, FuseMockApiUtils } from '@fuse/lib/mock-api';
import { knowledgeBase as knowledgeBaseData } from './data';
import { cloneDeep } from 'lodash-es';

@Injectable({providedIn: 'root'})
export class KnowledgeBaseMockApi
{
    private _knowledgeBase = knowledgeBaseData;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService)
    {
        // Register Mock API handlers
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void
    {
        // -----------------------------------------------------------------------------------------------------
        // @ Knowledge base - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/common/knowledge-base')
            .reply(() => {

                // Clone the knowledge base
                const knowledgeBase = cloneDeep(this._knowledgeBase);

                // Return the response
                return [200, knowledgeBase];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Knowledge base - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/common/knowledge-base')
            .reply(({request}) => {

                // Get the file
                const newFile = request.body;

                // Generate a new GUID
                const guid = FuseMockApiUtils.guid();

                // Add the file
                this._knowledgeBase.files.unshift({
                    ...newFile,
                    url: `https://storage.cloud.example.com/${guid}-${newFile.name}`
                });

                // Return the response
                return [200, cloneDeep(this._knowledgeBase)];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Knowledge base - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/common/knowledge-base')
            .reply(({request}) => {

                // Get the id
                const url = request.params.get('url');

                // Find the file and delete it
                const index = this._knowledgeBase.files.findIndex(item => item.url === url);
                this._knowledgeBase.files.splice(index, 1);

                // Return the response
                return [200, cloneDeep(this._knowledgeBase)];
            });
    }
}