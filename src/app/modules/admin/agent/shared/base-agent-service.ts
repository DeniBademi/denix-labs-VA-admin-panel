import { Injectable } from '@angular/core';
import { Observable, from, BehaviorSubject } from 'rxjs';
import { SupabaseService } from 'app/core/supabase/supabase.service';

/**
 * Base service class for agent-related services
 * Provides common functionality for Supabase operations and agent ID management
 */
@Injectable()
export abstract class BaseAgentService {
    protected _agentId: string | null = null;
    protected _loading: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

    constructor(protected _supabase: SupabaseService) {}

    /**
     * Set the current agent ID
     */
    setAgentId(agentId: string | null): void {
        this._agentId = agentId;
    }

    /**
     * Get the current agent ID
     */
    getAgentId(): string | null {
        return this._agentId;
    }

    /**
     * Get loading state observable
     */
    get loading$(): Observable<boolean> {
        return this._loading.asObservable();
    }

    /**
     * Validate UUID format
     */
    protected isValidUuid(value: any): value is string {
        const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
        return typeof value === 'string' && UUID_RE.test(value);
    }

    /**
     * Ensure agent ID is set and valid
     */
    protected validateAgentId(): void {
        if (!this._agentId) {
            throw new Error('Agent ID not set');
        }
        if (!this.isValidUuid(this._agentId)) {
            throw new Error('Invalid agent ID format');
        }
    }

    /**
     * Execute Supabase operation with consistent error handling
     */
    protected executeSupabaseOperation<T>(operation: () => Promise<T>): Observable<T> {
        return from((async () => {
            this._loading.next(true);
            try {
                return await operation();
            } catch (error) {
                console.error('Supabase operation failed:', error);
                throw error;
            } finally {
                this._loading.next(false);
            }
        })());
    }

    /**
     * Get authenticated user ID
     */
    protected async getAuthenticatedUserId(): Promise<string> {
        const { data: sessionData } = await this._supabase.getSupabase.auth.getSession();
        const userId = sessionData.session?.user?.id;
        if (!userId) {
            throw new Error('User must be authenticated');
        }
        return userId;
    }

    /**
     * Perform a standard Supabase select operation
     */
    protected async performSelect<T>(
        table: string,
        select: string = '*',
        filters?: { column: string; value: any }[]
    ): Promise<T[]> {
        const supabase = this._supabase.getSupabase;
        let query = supabase.from(table).select(select);

        if (filters) {
            filters.forEach(filter => {
                query = query.eq(filter.column, filter.value);
            });
        }

        const { data, error } = await query;
        if (error) throw error;
        if (!data) return [];
        // Ensure the returned value is of type T[]
        return Array.isArray(data) ? data as T[] : [];
    }

    /**
     * Perform a standard Supabase insert operation
     */
    protected async performInsert<T>(table: string, data: any): Promise<T> {
        const supabase = this._supabase.getSupabase;
        const { data: result, error } = await supabase
            .from(table)
            .insert(data)
            .select('*')
            .single();
        if (error) throw error;
        return result;
    }

    /**
     * Perform a standard Supabase update operation
     */
    protected async performUpdate<T>(
        table: string,
        data: any,
        filters: { column: string; value: any }[]
    ): Promise<T> {
        const supabase = this._supabase.getSupabase;
        let query = supabase.from(table).update(data);

        filters.forEach(filter => {
            query = query.eq(filter.column, filter.value);
        });

        const { data: result, error } = await query.select('*').single();
        if (error) throw error;
        return result;
    }

    /**
     * Perform a standard Supabase upsert operation
     */
    protected async performUpsert<T>(
        table: string,
        data: any,
        conflictColumn: string
    ): Promise<T> {
        const supabase = this._supabase.getSupabase;
        const { data: result, error } = await supabase
            .from(table)
            .upsert(data, { onConflict: conflictColumn })
            .select('*')
            .single();
        if (error) throw error;
        return result;
    }

    /**
     * Perform a standard Supabase delete operation
     */
    protected async performDelete(
        table: string,
        filters: { column: string; value: any }[]
    ): Promise<void> {
        const supabase = this._supabase.getSupabase;
        let query = supabase.from(table).delete();

        filters.forEach(filter => {
            query = query.eq(filter.column, filter.value);
        });

        const { error } = await query;
        if (error) throw error;
    }
}
