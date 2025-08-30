import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

@Component({
    selector: 'app-guardrails',
    templateUrl: './guardrails.component.html',
    styleUrls: ['./guardrails.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatChipsModule
    ]
})
export class GuardrailsComponent {
    @Input() parentForm: FormGroup;
    separatorKeysCodes: number[] = [ENTER, COMMA];

    addGuardrail(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();

        if (value) {
            const currentGuardrails = this.parentForm.get('guardrails').value || [];
            this.parentForm.get('guardrails').setValue([...currentGuardrails, value]);
        }

        event.chipInput!.clear();
    }

    removeGuardrail(guardrail: string): void {
        const currentGuardrails = this.parentForm.get('guardrails').value || [];
        const index = currentGuardrails.indexOf(guardrail);

        if (index >= 0) {
            const updatedGuardrails = [...currentGuardrails];
            updatedGuardrails.splice(index, 1);
            this.parentForm.get('guardrails').setValue(updatedGuardrails);
        }
    }
}