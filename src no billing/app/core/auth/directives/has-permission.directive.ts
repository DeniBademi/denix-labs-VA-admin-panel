import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subject, combineLatest, takeUntil } from 'rxjs';
import { Permission } from 'app/core/user/user.types';
import { UserService } from 'app/core/user/user.service';
import { RoleService } from '../role.service';

@Directive({
    selector: '[hasPermission]',
    standalone: true
})
export class HasPermissionDirective implements OnInit, OnDestroy {
    @Input('hasPermission') permission: Permission;
    @Input('hasPermissionElse') elseTemplateRef: TemplateRef<any>;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _templateRef: TemplateRef<any>,
        private _viewContainer: ViewContainerRef,
        private _userService: UserService,
        private _roleService: RoleService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Combine user and roles so we respect DB-loaded roles and per-user overrides
        combineLatest([
            this._userService.user$,
            this._roleService.roles$
        ])
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(([user, roles]) => {
                // Clear the view container
                this._viewContainer.clear();

                const role = roles.find(r => r.id === user?.role);

                // Check role-based permission OR per-user overrides from DB
                const hasRolePermission = role ? this._roleService.hasPermission(role, this.permission) : false;
                const hasUserPermission = Array.isArray(user?.permissions)
                    ? (user.permissions as Permission[]).includes(this.permission)
                    : false;

                if (hasRolePermission || hasUserPermission) {
                    this._viewContainer.createEmbeddedView(this._templateRef);
                } else if (this.elseTemplateRef) {
                    this._viewContainer.createEmbeddedView(this.elseTemplateRef);
                }
            });
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }
}
