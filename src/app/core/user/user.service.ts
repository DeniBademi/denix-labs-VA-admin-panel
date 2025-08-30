import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { User, Permission } from 'app/core/user/user.types';
import { BehaviorSubject, map, Observable, ReplaySubject, tap } from 'rxjs';

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
    private _httpClient = inject(HttpClient);
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);
    private _users: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);
    private _roles: BehaviorSubject<Role[]> = new BehaviorSubject<Role[]>([]);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for user
     *
     * @param value
     */
    set user(value: User) {
        // Store the value
        this._user.next(value);
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    get users$(): Observable<User[]> {
        return this._users.asObservable();
    }

    get roles$(): Observable<Role[]> {
        return this._roles.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current signed-in user data
     */
    get(): Observable<User> {
        return this._httpClient.get<User>('api/common/user').pipe(
            tap((user) => {
                this._user.next(user);
            })
        );
    }

    /**
     * Update the user
     *
     * @param user
     */
    update(user: User): Observable<any> {
        return this._httpClient.patch<User>('api/common/user', { user }).pipe(
            map((response) => {
                this._user.next(response);
            })
        );
    }

    /**
     * Get all users
     */
    getUsers(): Observable<User[]> {
        return this._httpClient.get<User[]>('api/users').pipe(
            tap((users) => {
                this._users.next(users);
            })
        );
    }

    /**
     * Create a new user
     */
    createUser(user: Partial<User>): Observable<User> {
        return this._httpClient.post<User>('api/users', { user }).pipe(
            tap((newUser) => {
                const currentUsers = this._users.value;
                this._users.next([...currentUsers, newUser]);
            })
        );
    }

    /**
     * Update a user
     */
    updateUser(id: string, user: Partial<User>): Observable<User> {
        return this._httpClient.patch<User>(`api/users/${id}`, { user }).pipe(
            tap((updatedUser) => {
                const currentUsers = this._users.value;
                const index = currentUsers.findIndex(u => u.id === updatedUser.id);
                if (index !== -1) {
                    currentUsers[index] = updatedUser;
                    this._users.next([...currentUsers]);
                }
            })
        );
    }

    /**
     * Delete a user
     */
    deleteUser(id: string): Observable<void> {
        return this._httpClient.delete<void>(`api/users/${id}`).pipe(
            tap(() => {
                const currentUsers = this._users.value;
                this._users.next(currentUsers.filter(user => user.id !== id));
            })
        );
    }

    /**
     * Get all roles
     */
    getRoles(): Observable<Role[]> {
        return this._httpClient.get<Role[]>('api/roles').pipe(
            tap((roles) => {
                this._roles.next(roles);
            })
        );
    }

    /**
     * Create a new role
     */
    createRole(role: Partial<Role>): Observable<Role> {
        return this._httpClient.post<Role>('api/roles', { role }).pipe(
            tap((newRole) => {
                const currentRoles = this._roles.value;
                this._roles.next([...currentRoles, newRole]);
            })
        );
    }

    /**
     * Update a role
     */
    updateRole(id: string, role: Partial<Role>): Observable<Role> {
        return this._httpClient.patch<Role>(`api/roles/${id}`, { role }).pipe(
            tap((updatedRole) => {
                const currentRoles = this._roles.value;
                const index = currentRoles.findIndex(r => r.id === updatedRole.id);
                if (index !== -1) {
                    currentRoles[index] = updatedRole;
                    this._roles.next([...currentRoles]);
                }
            })
        );
    }

    /**
     * Delete a role
     */
    deleteRole(id: string): Observable<void> {
        return this._httpClient.delete<void>(`api/roles/${id}`).pipe(
            tap(() => {
                const currentRoles = this._roles.value;
                this._roles.next(currentRoles.filter(role => role.id !== id));
            })
        );
    }

    /**
     * Assign a role to a user
     */
    assignRole(userId: string, roleId: string): Observable<User> {
        return this._httpClient.post<User>(`api/users/${userId}/roles`, { roleId }).pipe(
            tap((updatedUser) => {
                const currentUsers = this._users.value;
                const index = currentUsers.findIndex(u => u.id === updatedUser.id);
                if (index !== -1) {
                    currentUsers[index] = updatedUser;
                    this._users.next([...currentUsers]);
                }
            })
        );
    }
}
