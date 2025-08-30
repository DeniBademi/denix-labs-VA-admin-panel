import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { catchError, from, Observable, of, switchMap, throwError } from 'rxjs';
import { SupabaseService } from '../supabase/supabase.service';
import { WorkspaceService } from '../workspace/workspace.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _supabaseService = inject(SupabaseService);
    private _workspaceService = inject(WorkspaceService);

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post('api/auth/forgot-password', email);
    }

    /**
     * Reset password
     *
     * @param password
     */
    resetPassword(password: string): Observable<any> {
        return this._httpClient.post('api/auth/reset-password', password);
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any> {
        // Throw error, if the user is already logged in
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }

        return from(this._supabaseService.getSupabase.auth.signInWithPassword(credentials)).pipe(
            switchMap(async ({ data, error }) => {
                if (error) {
                    throw error;
                }

                // Store the access token in the local storage
                this.accessToken = data.session.access_token;

                // Set the authenticated flag to true
                this._authenticated = true;

                // Preload and cache workspace id for fast access by data services
                await this._workspaceService.initForCurrentUser();

                // Fetch role and permissions from users_view
                const supabase = this._supabaseService.getSupabase;
                const { data: accessRow } = await supabase
                    .from('users_view')
                    .select('role, permissions')
                    .eq('id', data.user.id)
                    .maybeSingle();

                const role = accessRow?.role ?? 'user';
                const permissions = Array.isArray(accessRow?.permissions) ? accessRow.permissions : [];

                // Store the user on the user service
                this._userService.user = {
                    id: data.user.id,
                    name: data.user.user_metadata?.name ?? data.user.user_metadata?.full_name ?? '',
                    email: data.user.email,
                    avatar: data.user.user_metadata?.avatar_url ?? '',
                    role,
                    permissions,
                };

                return data;
            })
        );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any> {
            return from(this._supabaseService.getSupabase.auth.refreshSession()).pipe(
                switchMap(async ({ data, error }) => {
                    if (error) {
                        throw error;
                    }
                    this.accessToken = data.session.access_token;
                    this._authenticated = true;

                    // Ensure workspace is cached
                    await this._workspaceService.initForCurrentUser();

                    // Fetch role and permissions
                    const supabase = this._supabaseService.getSupabase;
                    const { data: accessRow } = await supabase
                        .from('users_view')
                        .select('role, permissions')
                        .eq('id', data.user.id)
                        .maybeSingle();

                    const role = accessRow?.role ?? 'user';
                    const permissions = Array.isArray(accessRow?.permissions) ? accessRow.permissions : [];

                    this._userService.user = {
                        id: data.user.id,
                        name: data.user.user_metadata?.name ?? data.user.user_metadata?.full_name ?? '',
                        email: data.user.email,
                        avatar: data.user.user_metadata?.avatar_url ?? '',
                        role,
                        permissions,
                    };

                    return true;
                })
            );
        // Renew token
        // return this._httpClient
        //     .post('api/auth/sign-in-with-token', {
        //         accessToken: this.accessToken,
        //     })
        //     .pipe(
        //         catchError(() =>
        //             // Return false
        //             of(false)
        //         ),
        //         switchMap((response: any) => {
        //             // Replace the access token with the new one if it's available on
        //             // the response object.
        //             //
        //             // This is an added optional step for better security. Once you sign
        //             // in using the token, you should generate a new one on the server
        //             // side and attach it to the response object. Then the following
        //             // piece of code can replace the token with the refreshed one.
        //             if (response.accessToken) {
        //                 this.accessToken = response.accessToken;
        //             }

        //             // Set the authenticated flag to true
        //             this._authenticated = true;

        //             // Store the user on the user service
        //             this._userService.user = response.user;

        //             // Return true
        //             return of(true);
        //         })
        //     );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        // Remove the access token from the local storage
        localStorage.removeItem('accessToken');

        // Set the authenticated flag to false
        this._authenticated = false;

        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: {
        name: string;
        email: string;
        password: string;
        company: string;
    }): Observable<any> {
        // Call Supabase signUp with email and password
        return from(
            this._supabaseService.getSupabase.auth.signUp({
                email: user.email,
                password: user.password,
                options: {
                    data: {
                        name: user.name,
                        company: user.company
                    }
                }
            })
        );
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: {
        email: string;
        password: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Check if the user is logged in
        if (this._authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.accessToken) {
            return of(false);
        }

        // Check the access token expire date
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            return of(false);
        }

        // If the access token exists, and it didn't expire, sign in using it
        return this.signInUsingToken();
    }
}
