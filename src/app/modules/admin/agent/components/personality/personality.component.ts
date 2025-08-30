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
    selector: 'app-personality',
    templateUrl: './personality.component.html',
    styleUrls: ['./personality.component.scss'],
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
export class PersonalityComponent {
    @Input() parentForm: FormGroup;
    separatorKeysCodes: number[] = [ENTER, COMMA];

    addTrait(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();

        if (value) {
            const currentTraits = this.parentForm.get('personality.traits').value || [];
            this.parentForm.get('personality.traits').setValue([...currentTraits, value]);
        }

        event.chipInput!.clear();
    }

    removeTrait(trait: string): void {
        const currentTraits = this.parentForm.get('personality.traits').value || [];
        const index = currentTraits.indexOf(trait);

        if (index >= 0) {
            const updatedTraits = [...currentTraits];
            updatedTraits.splice(index, 1);
            this.parentForm.get('personality.traits').setValue(updatedTraits);
        }
    }
}