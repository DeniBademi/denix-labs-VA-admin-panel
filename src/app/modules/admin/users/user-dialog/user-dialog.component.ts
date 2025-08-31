import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { User } from 'app/core/user/user.types';
import { Role } from 'app/core/user/user.service';
import { RoleService } from 'app/core/auth/role.service';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'user-dialog',
    templateUrl: './user-dialog.component.html',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        FormsModule,
        ReactiveFormsModule
    ]
})
export class UserDialogComponent implements OnInit {
    userForm: FormGroup;
    roles: Role[];

    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) public data: { user: User },
        public matDialogRef: MatDialogRef<UserDialogComponent>,
        private _formBuilder: FormBuilder,
        private _roleService: RoleService
    ) {
        // Get roles
        this.roles = this._roleService.getDefaultRoles();

        // Create the user form
        this.userForm = this._formBuilder.group({
            name: ['', [Validators.required]],
            email: ['', [Validators.required, Validators.email]],
            role: ['', [Validators.required]]
        });

        // Fill the form if user data is provided
        if (data.user) {
            this.userForm.patchValue(data.user);
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
     * Save and close
     */
    saveAndClose(): void {
        if (this.userForm.valid) {
            this.matDialogRef.close(this.userForm.value);
        }
    }
}
