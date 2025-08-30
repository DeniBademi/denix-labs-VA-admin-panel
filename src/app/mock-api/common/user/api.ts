import { Injectable } from '@angular/core';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { roles as rolesData } from 'app/mock-api/common/user/roles.data';
import { user as userData } from 'app/mock-api/common/user/data';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({providedIn: 'root'})
export class UserMockApi {
    private _user: any = userData;
    private _roles: any = rolesData;

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
        // @ User - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/common/user')
            .reply(() => [200, cloneDeep(this._user)]);

        // -----------------------------------------------------------------------------------------------------
        // @ Users - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/users')
            .reply(() => [200, [cloneDeep(this._user)]]);

        // -----------------------------------------------------------------------------------------------------
        // @ User - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/common/user')
            .reply(({request}) => {
                // Get the user mock-api
                const user = request.body.user;

                // Update the user mock-api
                this._user = assign({}, this._user, user);

                // Return the response
                return [200, cloneDeep(this._user)];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Roles - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/roles')
            .reply(() => [200, cloneDeep(this._roles)]);

        // -----------------------------------------------------------------------------------------------------
        // @ Role - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/roles')
            .reply(({request}) => {
                // Get the role
                const newRole = request.body.role;

                // Generate a new GUID
                newRole.id = newRole.id || crypto.randomUUID();

                // Add the role
                this._roles.push(newRole);

                // Return the response
                return [200, newRole];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Role - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/roles/:id')
            .reply(({request}) => {
                // Get the id and role
                const id = request.params.get('id');
                const role = request.body.role;

                // Prepare the updated role
                let updatedRole = null;

                // Find the role and update it
                this._roles = this._roles.map((item) => {
                    if (item.id === id) {
                        // Update the role
                        updatedRole = assign({}, item, role);
                        return updatedRole;
                    }
                    return item;
                });

                // Return the response
                return [200, updatedRole];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Role - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/roles/:id')
            .reply(({request}) => {
                // Get the id
                const id = request.params.get('id');

                // Find the role and delete it
                this._roles = this._roles.filter(role => role.id !== id);

                // Return the response
                return [200, true];
            });
    }
}