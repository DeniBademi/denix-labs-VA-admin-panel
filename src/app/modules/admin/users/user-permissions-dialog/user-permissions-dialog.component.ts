import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { RoleService } from 'app/core/auth/role.service';
import { Permission } from 'app/core/user/user.types';
import { User } from 'app/core/user/user.types';

@Component({
    selector: 'app-user-permissions-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule, MatCheckboxModule],
    template: `
    <h2 mat-dialog-title>Edit User Permissions</h2>
    <div mat-dialog-content class="space-y-4">
        <div class="font-medium">User: {{ user.name }} ({{ user.email }})</div>
        <div class="text-sm text-gray-500">Base role: {{ user.role }}</div>
        <div class="space-y-3">
            <div *ngFor="let perm of allPermissions" class="flex items-center gap-3">
                <mat-checkbox [(ngModel)]="permissionState[perm]">{{ describe(perm) }}</mat-checkbox>
            </div>
        </div>
    </div>
    <div mat-dialog-actions class="flex justify-end gap-2">
        <button mat-stroked-button (click)="onCancel()">Cancel</button>
        <button mat-flat-button color="primary" (click)="onSave()">Save</button>
    </div>
    `
})
export class UserPermissionsDialogComponent {
    user: User;
    allPermissions: Permission[] = [];
    permissionState: Record<string, boolean> = {};

    constructor(
        private _dialogRef: MatDialogRef<UserPermissionsDialogComponent>,
        private _roleService: RoleService,
        @Inject(MAT_DIALOG_DATA) public data: { user: User }
    ) {
        this.user = data.user;
        this.allPermissions = this._roleService.getAllPermissions();
        for (const p of this.allPermissions) {
            this.permissionState[p] = this.user.permissions.includes(p as Permission);
        }
    }

    describe(p: Permission): string {
        return this._roleService.getPermissionDescription(p);
    }

    onCancel(): void {
        this._dialogRef.close();
    }

    onSave(): void {
        const updated: User = {
            ...this.user,
            permissions: this.allPermissions.filter(p => this.permissionState[p])
        } as User;
        this._dialogRef.close(updated);
    }
}


