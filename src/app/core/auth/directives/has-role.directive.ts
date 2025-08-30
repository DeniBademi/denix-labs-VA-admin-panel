import { Directive, Input, OnDestroy, OnInit, TemplateRef, ViewContainerRef } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';
import { UserService } from 'app/core/user/user.service';

@Directive({
    selector: '[hasRole]',
    standalone: true
})
export class HasRoleDirective implements OnInit, OnDestroy {
    @Input('hasRole') role: string;
    @Input('hasRoleElse') elseTemplateRef: TemplateRef<any>;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _templateRef: TemplateRef<any>,
        private _viewContainer: ViewContainerRef,
        private _userService: UserService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to user changes
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(user => {
                // Clear the view container
                this._viewContainer.clear();

                // If user has the role...
                if (user?.role === this.role) {
                    // Create an embedded view from the template
                    this._viewContainer.createEmbeddedView(this._templateRef);
                }
                // Otherwise...
                else {
                    // If an else template is specified...
                    if (this.elseTemplateRef) {
                        // Create an embedded view from the else template
                        this._viewContainer.createEmbeddedView(this.elseTemplateRef);
                    }
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
