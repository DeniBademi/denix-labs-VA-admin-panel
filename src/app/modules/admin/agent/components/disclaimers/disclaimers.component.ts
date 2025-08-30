import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatTooltipModule } from '@angular/material/tooltip';

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
        MatTooltipModule
    ]
})
export class DisclaimersComponent {
    @Input() parentForm: FormGroup;

    constructor(private _formBuilder: FormBuilder) {}

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
}