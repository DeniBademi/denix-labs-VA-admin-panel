import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';
import { BaseAgentComponent } from './base-agent-component';

/**
 * Base component for chip input functionality
 * Provides common chip management operations
 */
@Component({
    template: ''
})
export abstract class BaseChipInputComponent extends BaseAgentComponent {
    separatorKeysCodes: number[] = [ENTER, COMMA];

    constructor(
        protected override _route: ActivatedRoute,
        protected override _snackBar?: MatSnackBar
    ) {
        super(_route, _snackBar);
    }

    /**
     * Add a chip to the specified form control
     */
    protected addChip(event: MatChipInputEvent, controlPath: string): void {
        const value = (event.value || '').trim();

        if (value) {
            this.updateArrayFormValue(controlPath, (current) => [...current, value]);
        }

        event.chipInput!.clear();
    }

    /**
     * Remove a chip from the specified form control
     */
    protected removeChip(item: string, controlPath: string): void {
        this.updateArrayFormValue(controlPath, (current) => {
            const index = current.indexOf(item);
            if (index >= 0) {
                const updated = [...current];
                updated.splice(index, 1);
                return updated;
            }
            return current;
        });
    }

    /**
     * Default implementation - components can override if needed
     */
    protected onAgentComponentInit(): void {
        // Default: no additional initialization needed
    }

    /**
     * Default implementation - components can override if needed
     */
    protected onAgentIdChanged(agentId: string | null): void {
        // Default: no action needed on agent ID change
    }
}
