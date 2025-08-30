import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class SupabaseService {
    private supabase: SupabaseClient;
    private _isAuthenticated = new BehaviorSubject<boolean>(false);

    constructor() {
        this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
        // Check initial auth state
        this.supabase.auth.onAuthStateChange((event, session) => {
            this._isAuthenticated.next(!!session);
        });
    }

    get getSupabase() {
        return this.supabase;
    }

    get isAuthenticated$(): Observable<boolean> {
        return this._isAuthenticated.asObservable();
    }

    /**
     * Verify a JWT token using Supabase
     * @param token The JWT token to verify
     * @returns Observable<boolean> indicating if the token is valid
     */
    verifyToken(token: string): Observable<boolean> {
        return from(this.supabase.auth.getUser(token)).pipe(
            map(response => {
                const isValid = !response.error && !!response.data.user;
                this._isAuthenticated.next(isValid);
                return isValid;
            })
        );
    }

    async getAuthToken(): Promise<string | null> {
        const session = await this.supabase.auth.getSession();
        return session.data.session?.access_token ?? null;
    }
}