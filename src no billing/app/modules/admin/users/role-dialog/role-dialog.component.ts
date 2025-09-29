import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { Role } from 'app/core/user/user.service';
import { RoleService } from 'app/core/auth/role.service';
import { Permission } from 'app/core/user/user.types';

@Component({
    selector: 'role-dialog',
    templateUrl: './role-dialog.component.html',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        FormsModule,
        ReactiveFormsModule
    ]
})
export class RoleDialogComponent implements OnInit {
    roleForm: FormGroup;
    permissionGroups: Record<string, Permission[]>;
    selectedPermissions: Set<Permission> = new Set();

    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { role: Role },
        public matDialogRef: MatDialogRef<RoleDialogComponent>,
        private _formBuilder: FormBuilder,
        private _roleService: RoleService
    ) {
        // Get permission groups
        this.permissionGroups = this._roleService.getPermissionGroups();

        // Create the role form
        this.roleForm = this._formBuilder.group({
            id: ['', [Validators.required]],
            name: ['', [Validators.required]]
        });

        // Fill the form if role data is provided
        if (data.role) {
            this.roleForm.patchValue({
                id: data.role.id,
                name: data.role.name
            });
            data.role.permissions.forEach(permission => this.selectedPermissions.add(permission));
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {}

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle permission
     */
    togglePermission(permission: Permission): void {
        if (this.selectedPermissions.has(permission)) {
            this.selectedPermissions.delete(permission);
        } else {
            this.selectedPermissions.add(permission);
        }
    }

    /**
     * Check if permission is selected
     */
    isPermissionSelected(permission: Permission): boolean {
        return this.selectedPermissions.has(permission);
    }

    /**
     * Get permission description
     */
    getPermissionDescription(permission: Permission): string {
        return this._roleService.getPermissionDescription(permission);
    }

    /**
     * Save and close
     */
    saveAndClose(): void {
        if (this.roleForm.valid) {
            const role: Role = {
                ...this.roleForm.value,
                permissions: Array.from(this.selectedPermissions)
            };
            this.matDialogRef.close(role);
        }
    }
}
