import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { FormGroup } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { MatSnackBar } from '@angular/material/snack-bar';

/**
 * Base component for agent configuration components
 * Provides common functionality for agent ID handling, form management, and lifecycle
 */
@Component({
    template: ''
})
export abstract class BaseAgentComponent implements OnInit, OnDestroy {
    @Input() parentForm: FormGroup;

    protected _unsubscribeAll: Subject<any> = new Subject<any>();
    protected _agentId: string | null = null;

    constructor(
        protected _route: ActivatedRoute,
        protected _snackBar?: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.subscribeToAgentId();
        this.onAgentComponentInit();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    /**
     * Subscribe to agent ID changes from route params
     */
    private subscribeToAgentId(): void {
        this._route.paramMap
            .pipe(
                map((pm) => pm.get('agent_id')),
                distinctUntilChanged(),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe((agentId) => {
                this._agentId = agentId;
                this.onAgentIdChanged(agentId);
            });
    }

    /**
     * Get current agent ID
     */
    protected getAgentId(): string | null {
        return this._agentId;
    }

    /**
     * Show error message using snackbar
     */
    protected showError(message: string, duration: number = 3000): void {
        if (this._snackBar) {
            this._snackBar.open(message, 'Close', {
                duration,
                horizontalPosition: 'end'
            });
        }
    }

    /**
     * Show success message using snackbar
     */
    protected showSuccess(message: string, duration: number = 3000): void {
        if (this._snackBar) {
            this._snackBar.open(message, 'Close', {
                duration,
                horizontalPosition: 'end'
            });
        }
    }

    /**
     * Get form control value safely
     */
    protected getFormValue(controlPath: string): any {
        return this.parentForm?.get(controlPath)?.value;
    }

    /**
     * Set form control value safely
     */
    protected setFormValue(controlPath: string, value: any): void {
        this.parentForm?.get(controlPath)?.setValue(value);
    }

    /**
     * Update form control value with array operations
     */
    protected updateArrayFormValue(controlPath: string, updater: (current: any[]) => any[]): void {
        const current = this.getFormValue(controlPath) || [];
        const updated = updater(current);
        this.setFormValue(controlPath, updated);
    }

    /**
     * Override this method to handle component initialization
     */
    protected abstract onAgentComponentInit(): void;

    /**
     * Override this method to handle agent ID changes
     */
    protected abstract onAgentIdChanged(agentId: string | null): void;
}
