import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { UserService } from 'app/core/user/user.service';
import { RoleService } from 'app/core/auth/role.service';
import { HasPermissionDirective } from 'app/core/auth/directives/has-permission.directive';
import { Subject, takeUntil } from 'rxjs';
import { User } from 'app/core/user/user.types';
import { Role } from 'app/core/user/user.service';
import { RoleDialogComponent } from './role-dialog/role-dialog.component';
import { UserPermissionsDialogComponent } from './user-permissions-dialog/user-permissions-dialog.component';
import { UserDialogComponent } from './user-dialog/user-dialog.component';
import { FuseConfirmationService } from '@fuse/services/confirmation';

@Component({
    selector: 'users',
    templateUrl: './users.component.html',
    styleUrls: ['./users.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatPaginatorModule,
        MatSortModule,
        MatDialogModule,
        MatTooltipModule,
        FormsModule,
        ReactiveFormsModule,
        HasPermissionDirective
    ]
})
export class UsersComponent implements OnInit, OnDestroy {
    users: User[] = [];
    roles: Role[] = [];
    displayedColumns: string[] = ['name', 'email', 'role', 'actions'];
    showRoleManagement = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _userService: UserService,
        private _roleService: RoleService,
        private _dialog: MatDialog,
        private _fuseConfirmationService: FuseConfirmationService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the users
        this._userService.users$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((users: User[]) => {
                this.users = users;
            });

        // Get the roles
        this._roleService.roles$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((roles: Role[]) => {
                this.roles = roles;
            });

        // Load initial data
        this._userService.getUsers().subscribe();
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get role name
     */
    getRoleName(roleId: string): string {
        return this.roles.find(role => role.id === roleId)?.name || roleId;
    }

    /**
     * Get permission description for display
     */
    getPermissionDescription(permission: any): string {
        return this._roleService.getPermissionDescription(permission as any);
    }

    /**
     * Toggle role management view
     */
    toggleRoleManagement(): void {
        this.showRoleManagement = !this.showRoleManagement;
    }

    /**
     * Open role dialog
     */
    openRoleDialog(role?: Role): void {
        const dialogRef = this._dialog.open(RoleDialogComponent, {
            data: { role }
        });

        dialogRef.afterClosed().subscribe((result: Role) => {
            if (result) {
                if (role) {
                    this._userService.updateRole(role.id, result).subscribe();
                } else {
                    this._userService.createRole(result).subscribe();
                }
            }
        });
    }


    openUserPermissionsDialog(user: User): void {
        const dialogRef = this._dialog.open(UserPermissionsDialogComponent, {
            data: { user }
        });

        dialogRef.afterClosed().subscribe((updated: User) => {
            if (updated) {
                // For now we only update client-side view; replace with API update when backend is ready
                const idx = this.users.findIndex(u => u.id === user.id);
                if (idx > -1) {
                    this.users[idx] = updated;
                    this.users = [...this.users];
                }
            }
        });
    }

    openUserDialog(user?: User): void {
        const dialogRef = this._dialog.open(UserDialogComponent, {
            data: { user }
        });

        dialogRef.afterClosed().subscribe((payload: Partial<User>) => {
            if (payload) {
                // Hook up to UserService when backend endpoints are ready.
                // For now, add/update locally.
                if (user) {
                    const idx = this.users.findIndex(u => u.id === user.id);
                    if (idx > -1) {
                        this.users[idx] = { ...this.users[idx], ...payload } as User;
                        this.users = [...this.users];
                    }
                } else {
                    const newUser: User = {
                        id: crypto.randomUUID(),
                        name: payload.name,
                        email: payload.email,
                        avatar: '',
                        role: (payload as any).role,
                        permissions: []
                    } as User;
                    this.users = [newUser, ...this.users];
                }
            }
        });
    }

    /**
     * Delete role
     */
    deleteRole(role: Role): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete Role',
            message: `Are you sure you want to delete the role "${role.name}"?`,
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this._userService.deleteRole(role.id).subscribe();
            }
        });
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}
