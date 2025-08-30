import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Permission } from 'app/core/user/user.types';
import { Role } from 'app/core/user/user.service';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable({ providedIn: 'root' })
export class RoleService {
    private _roles$ = new BehaviorSubject<Role[]>([]);
    private _permissionsMap = new Map<Permission, string>();
    private _allPermissions: Permission[] = [];

    constructor(private _supabase: SupabaseService) {
        void this._loadFromDatabase();
    }

    private async _loadFromDatabase(): Promise<void> {
        const supabase = this._supabase.getSupabase;
        // Load permissions
        const { data: perms, error: permsErr } = await supabase
            .from('permissions')
            .select('key, description');
        if (!permsErr && perms) {
            this._permissionsMap.clear();
            this._allPermissions = perms.map((p: any) => p.key) as Permission[];
            for (const p of perms) this._permissionsMap.set(p.key as Permission, p.description ?? p.key);
        }

        // Load roles
        const { data: roles, error: rolesErr } = await supabase
            .from('roles')
            .select('id, key, name');

        // Load role_permissions
        const { data: rolePerms, error: rpErr } = await supabase
            .from('role_permissions')
            .select('role_id, permission_key');

        if (!rolesErr && roles && !rpErr && rolePerms) {
            const roleIdToPerms = new Map<string, Permission[]>();
            for (const rp of rolePerms) {
                const arr = roleIdToPerms.get(rp.role_id) ?? [];
                arr.push(rp.permission_key as Permission);
                roleIdToPerms.set(rp.role_id, arr);
            }

            const mapped: Role[] = roles.map((r: any) => ({
                // Expose role key as id to match UI checks (user.role holds key like 'admin')
                id: r.key,
                name: r.name,
                permissions: roleIdToPerms.get(r.id) ?? []
            }));

            this._roles$.next(mapped);
        }
    }

    /**
     * Get all available permissions
     */
    getAllPermissions(): Permission[] {
        return this._allPermissions;
    }

    /**
     * Get permissions grouped by feature
     */
    getPermissionGroups(): Record<string, Permission[]> {
        // Optional grouping: derive from known domains in permission keys
        const groups: Record<string, Permission[]> = {};
        for (const p of this._allPermissions) {
            const domain = p.includes('_') ? p.split('_')[1] : 'general';
            groups[domain] = groups[domain] ?? [];
            groups[domain].push(p);
        }
        return groups;
    }

    /**
     * Get default roles
     */
    getDefaultRoles(): Role[] {
        return this._roles$.value;
    }

    get roles$() {
        return this._roles$.asObservable();
    }

    /**
     * Check if a role has a specific permission
     */
    hasPermission(role: Role, permission: Permission): boolean {
        return role.permissions.includes(permission);
    }

    /**
     * Check if a role has all specified permissions
     */
    hasPermissions(role: Role, permissions: Permission[]): boolean {
        return permissions.every(permission => this.hasPermission(role, permission));
    }

    /**
     * Check if a role has any of the specified permissions
     */
    hasAnyPermission(role: Role, permissions: Permission[]): boolean {
        return permissions.some(permission => this.hasPermission(role, permission));
    }

    /**
     * Get permissions description
     */
    getPermissionDescription(permission: Permission): string {
        return this._permissionsMap.get(permission) || permission;
    }

    /**
     * Get feature name from permission
     */
    getFeatureFromPermission(permission: Permission): string {
        const groups = this.getPermissionGroups();
        return Object.entries(groups)
            .find(([_, permissions]) => permissions.includes(permission))?.[0] || '';
    }
}
