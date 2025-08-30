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
    selector: 'app-tone',
    templateUrl: './tone.component.html',
    styleUrls: ['./tone.component.scss'],
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
export class ToneComponent {
    @Input() parentForm: FormGroup;
    separatorKeysCodes: number[] = [ENTER, COMMA];

    addPattern(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();

        if (value) {
            const currentPatterns = this.parentForm.get('tone.patterns').value || [];
            this.parentForm.get('tone.patterns').setValue([...currentPatterns, value]);
        }

        event.chipInput!.clear();
    }

    removePattern(pattern: string): void {
        const currentPatterns = this.parentForm.get('tone.patterns').value || [];
        const index = currentPatterns.indexOf(pattern);

        if (index >= 0) {
            const updatedPatterns = [...currentPatterns];
            updatedPatterns.splice(index, 1);
            this.parentForm.get('tone.patterns').setValue(updatedPatterns);
        }
    }

    addElement(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();

        if (value) {
            const currentElements = this.parentForm.get('tone.elements').value || [];
            this.parentForm.get('tone.elements').setValue([...currentElements, value]);
        }

        event.chipInput!.clear();
    }

    removeElement(element: string): void {
        const currentElements = this.parentForm.get('tone.elements').value || [];
        const index = currentElements.indexOf(element);

        if (index >= 0) {
            const updatedElements = [...currentElements];
            updatedElements.splice(index, 1);
            this.parentForm.get('tone.elements').setValue(updatedElements);
        }
    }
}