import { inject, Injectable } from '@angular/core';
import { User, Permission } from 'app/core/user/user.types';
import { BehaviorSubject, Observable, ReplaySubject, tap, from } from 'rxjs';
import { SupabaseService } from '../supabase/supabase.service';
import { WorkspaceService } from '../workspace/workspace.service';

export interface Role {
    id: string;
    name: string;
    permissions: Permission[];
}

@Injectable({ providedIn: 'root' })
export class UserService {
    private _user: ReplaySubject<User> = new ReplaySubject<User>(1);
    private _users: BehaviorSubject<User[]> = new BehaviorSubject<User[]>([]);
    private _roles: BehaviorSubject<Role[]> = new BehaviorSubject<Role[]>([]);
    private _supabaseService = inject(SupabaseService);
    private _workspaceService = inject(WorkspaceService);

    private _userCache: User | null = null;

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
        this._userCache = value;
    }

    get user$(): Observable<User> {
        return this._user.asObservable();
    }

    get users$(): Observable<User[]> {
        return this._users.asObservable();
    }

    get roles$(): Observable<Role[]> { return this._roles.asObservable(); }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get the current signed-in user data
     */
    get(): Observable<User> {

        if (this._userCache) {
            console.log('returning from cache');
            return from(Promise.resolve(this._userCache));
        }
        return from((async () => {
            const supabase = this._supabaseService.getSupabase;
            const { data: sessionData } = await supabase.auth.getSession();
            const userId = sessionData.session?.user?.id;
            if (!userId) {
                throw new Error('Not authenticated');
            }
            const { data, error } = await supabase
                .from('users_view')
                .select('id, name, email, avatar, role, permissions')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            const user: User = data ? {
                id: data.id,
                name: data.name ?? '',
                email: data.email ?? '',
                avatar: data.avatar ?? '',
                role: data.role ?? 'user',
                permissions: Array.isArray(data.permissions) ? data.permissions : []
            } : {
                id: userId,
                name: '',
                email: '',
                avatar: '',
                role: 'user',
                permissions: []
            };
            console.log(user);
            this._user.next(user);
            this._userCache = user;
            return user;
        })());
    }

    /**
     * Update the user
     *
     * @param user
     */
    update(user: User): Observable<any> {
        return from((async () => {
            const supabase = this._supabaseService.getSupabase;
            const updates: any = {};
            if (user.name !== undefined) updates.name = user.name;
            if (user.avatar !== undefined) updates.avatar_url = user.avatar;

            if (Object.keys(updates).length > 0) {
                const { error: updErr } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', user.id);
                if (updErr) throw updErr;
            }

            // Re-fetch
            const { data } = await supabase
                .from('users_view')
                .select('id, name, email, avatar, role, permissions')
                .eq('id', user.id)
                .maybeSingle();
            const updated: User = data ? {
                id: data.id,
                name: data.name ?? '',
                email: data.email ?? '',
                avatar: data.avatar ?? '',
                role: data.role ?? 'user',
                permissions: Array.isArray(data.permissions) ? data.permissions : []
            } : user;
            this._user.next(updated);
            return updated;
        })());
    }

    /**
     * Get all users
     */
    getUsers(): Observable<User[]> {
        return from((async () => {
            const supabase = this._supabaseService.getSupabase;
            const { data, error } = await supabase
                .from('users_view')
                .select('id, name, email, avatar, role, permissions')
                .order('name', { ascending: true });
            if (error) throw error;
            const mapped: User[] = (data ?? []).map((u: any) => ({
                id: u.id,
                name: u.name ?? '',
                email: u.email ?? '',
                avatar: u.avatar ?? '',
                role: u.role ?? 'user',
                permissions: Array.isArray(u.permissions) ? u.permissions : []
            }));
            this._users.next(mapped);
            return mapped;
        })());
    }

    /**
     * Create a new user
     */
    createUser(payload: { email: string; name?: string; role?: string; }): Observable<User> {
        return from((async () => {
            const supabase = this._supabaseService.getSupabase;
            const email = payload.email;
            const name = payload.name ?? '';
            const roleKey = payload.role ?? 'user';

            //redirect to the /reset-password page
            const redirectTo = `${window.location.origin}/reset-password`;

            // Generate a temporary strong password (user will set their own via email link)
            const tempPassword = crypto.getRandomValues(new Uint32Array(4)).join('-');

            // Try to sign up the user; if already exists, we'll send a reset link instead
            let userId: string | undefined = undefined;
            const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
                email,
                password: tempPassword,
                options: {
                    emailRedirectTo: redirectTo,
                    data: { name }
                }
            });
            if (signUpErr && (signUpErr as any).status !== 422) { // 422 often indicates already registered
                throw signUpErr;
            }
            userId = signUpData?.user?.id;

            // Always send a password reset email as an invite link
            await supabase.auth.resetPasswordForEmail(email, { redirectTo });

            // If user wasn't just created (e.g., already existed), look up id
            if (!userId) {
                const { data: existing } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', email)
                    .maybeSingle();
                userId = existing?.id;
            }
            if (!userId) throw new Error('Unable to resolve user id after invite');

            // Assign workspace and name on profile
            const workspaceId = await this._workspaceService.getWorkspaceId();
            if (workspaceId) {
                await supabase
                    .from('profiles')
                    .update({ name, workspace_id: workspaceId })
                    .eq('id', userId);

                // Assign primary role if possible
                const { data: roleRow } = await supabase
                    .from('roles')
                    .select('id')
                    .eq('key', roleKey)
                    .maybeSingle();
                if (roleRow) {
                    await supabase
                        .from('user_roles')
                        .upsert({ user_id: userId, workspace_id: workspaceId, role_id: roleRow.id, is_primary: true }, { onConflict: 'user_id,workspace_id,role_id' });
                }
            }

            // Fetch from users_view for consistent shape
            const { data: uv } = await supabase
                .from('users_view')
                .select('id, name, email, avatar, role, permissions')
                .eq('id', userId)
                .maybeSingle();

            const newUser: User = uv ? {
                id: uv.id,
                name: uv.name ?? name,
                email: uv.email ?? email,
                avatar: uv.avatar ?? '',
                role: uv.role ?? roleKey,
                permissions: Array.isArray(uv.permissions) ? uv.permissions : []
            } : {
                id: userId,
                name,
                email,
                avatar: '',
                role: roleKey,
                permissions: []
            };

            const current = this._users.value;
            this._users.next([newUser, ...current]);
            return newUser;
        })());
    }

    /**
     * Update a user
     */
    updateUser(id: string, payload: Partial<User> & { role?: string }): Observable<User> {
        return from((async () => {
            const supabase = this._supabaseService.getSupabase;
            const updates: any = {};
            if (payload.name !== undefined) updates.name = payload.name;
            if (payload.avatar !== undefined) updates.avatar_url = payload.avatar;

            if (Object.keys(updates).length > 0) {
                const { error: updErr } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', id);
                if (updErr) throw updErr;
            }

            const workspaceId = await this._workspaceService.getWorkspaceId();
            if (workspaceId && payload.role) {
                const { data: roleRow } = await supabase
                    .from('roles')
                    .select('id')
                    .eq('key', payload.role)
                    .maybeSingle();
                if (roleRow) {
                    // Clear existing primary and set new
                    await supabase
                        .from('user_roles')
                        .update({ is_primary: false })
                        .eq('user_id', id)
                        .eq('workspace_id', workspaceId)
                        .eq('is_primary', true);
                    await supabase
                        .from('user_roles')
                        .upsert({ user_id: id, workspace_id: workspaceId, role_id: roleRow.id, is_primary: true }, { onConflict: 'user_id,workspace_id,role_id' });
                }
            }

            const { data: uv, error } = await supabase
                .from('users_view')
                .select('id, name, email, avatar, role, permissions')
                .eq('id', id)
                .maybeSingle();
            if (error) throw error;
            const updated: User = {
                id: uv.id,
                name: uv.name ?? '',
                email: uv.email ?? '',
                avatar: uv.avatar ?? '',
                role: uv.role ?? 'user',
                permissions: Array.isArray(uv.permissions) ? uv.permissions : []
            };

            const current = this._users.value;
            const idx = current.findIndex(u => u.id === id);
            if (idx !== -1) {
                current[idx] = updated;
                this._users.next([...current]);
            }
            return updated;
        })());
    }

    /**
     * Delete a user
     */
    deleteUser(id: string): Observable<void> {
        return from((async () => {
            const supabase = this._supabaseService.getSupabase;
            const workspaceId = await this._workspaceService.getWorkspaceId();
            if (workspaceId) {
                await supabase
                    .from('user_roles')
                    .delete()
                    .eq('user_id', id)
                    .eq('workspace_id', workspaceId);
            }
            // Remove user from workspace (soft-delete in this workspace)
            await supabase
                .from('profiles')
                .update({ workspace_id: null })
                .eq('id', id);

            const currentUsers = this._users.value;
            this._users.next(currentUsers.filter(user => user.id !== id));
        })());
    }

    /**
     * Get all roles
     */
    getRoles(): Observable<Role[]> { return this._roles.asObservable(); }

    // Role CRUD moved to RoleService

    // Role CRUD moved to RoleService

    // Role CRUD moved to RoleService

    /**
     * Assign a role to a user
     */
    assignRole(userId: string, roleId: string): Observable<User> {
        return from((async () => {
            const supabase = this._supabaseService.getSupabase;
            const workspaceId = await this._workspaceService.getWorkspaceId();
            if (!workspaceId) throw new Error('Workspace not set');

            // Clear current primary and set new primary role for this workspace
            await supabase
                .from('user_roles')
                .update({ is_primary: false })
                .eq('user_id', userId)
                .eq('workspace_id', workspaceId)
                .eq('is_primary', true);

            await supabase
                .from('user_roles')
                .upsert({ user_id: userId, workspace_id: workspaceId, role_id: roleId, is_primary: true }, { onConflict: 'user_id,workspace_id,role_id' });

            const { data, error } = await supabase
                .from('users_view')
                .select('id, name, email, avatar, role, permissions')
                .eq('id', userId)
                .maybeSingle();
            if (error) throw error;
            const updatedUser: User = data ? {
                id: data.id,
                name: data.name ?? '',
                email: data.email ?? '',
                avatar: data.avatar ?? '',
                role: data.role ?? 'user',
                permissions: Array.isArray(data.permissions) ? data.permissions : []
            } : null;

            if (updatedUser) {
                const currentUsers = this._users.value;
                const index = currentUsers.findIndex(u => u.id === updatedUser.id);
                if (index !== -1) {
                    currentUsers[index] = updatedUser;
                    this._users.next([...currentUsers]);
                }
                return updatedUser;
            }
            throw new Error('Failed to load updated user');
        })());
    }
}
