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
    selector: 'app-goals',
    templateUrl: './goals.component.html',
    styleUrls: ['./goals.component.scss'],
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
export class GoalsComponent {
    @Input() parentForm: FormGroup;
    separatorKeysCodes: number[] = [ENTER, COMMA];

    addGoal(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();

        if (value) {
            const currentGoals = this.parentForm.get('goals').value || [];
            this.parentForm.get('goals').setValue([...currentGoals, value]);
        }

        event.chipInput!.clear();
    }

    removeGoal(goal: string): void {
        const currentGoals = this.parentForm.get('goals').value || [];
        const index = currentGoals.indexOf(goal);

        if (index >= 0) {
            const updatedGoals = [...currentGoals];
            updatedGoals.splice(index, 1);
            this.parentForm.get('goals').setValue(updatedGoals);
        }
    }
}