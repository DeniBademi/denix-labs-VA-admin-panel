import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ActivatedRoute } from '@angular/router';
import { FuseAlertComponent } from '@fuse/components/alert';
import { BaseAgentComponent } from '../../shared/base-agent-component';

@Component({
    selector: 'app-disclaimers',
    templateUrl: './disclaimers.component.html',
    styleUrls: ['./disclaimers.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatCheckboxModule,
        MatTooltipModule,
        FuseAlertComponent // eslint-disable-line @angular-eslint/no-unused-imports
    ]
})
export class DisclaimersComponent extends BaseAgentComponent {
    @Input() parentForm: FormGroup;

    constructor(
        protected override _route: ActivatedRoute,
        private _formBuilder: FormBuilder
    ) {
        super(_route);
    }

    get disclaimers(): FormArray {
        return this.parentForm.get('disclaimers') as FormArray;
    }

    addDisclaimer(): void {
        const disclaimerForm = this._formBuilder.group({
            text: [''],
            requirePermission: [false]
        });

        this.disclaimers.push(disclaimerForm);
    }

    removeDisclaimer(index: number): void {
        this.disclaimers.removeAt(index);
    }

    trackByFn(index: number): number {
        return index;
    }

    protected onAgentComponentInit(): void {
        // No additional initialization needed
    }

    protected onAgentIdChanged(agentId: string | null): void {
        // No action needed on agent ID change
    }
}