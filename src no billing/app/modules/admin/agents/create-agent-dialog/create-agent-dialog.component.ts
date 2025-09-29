import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { AgentsService, AgentListItem } from '../agents.service';

@Component({
    selector: 'create-agent-dialog',
    templateUrl: './create-agent-dialog.component.html',
    styleUrls: ['./create-agent-dialog.component.scss'],
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule, MatSelectModule]
})
export class CreateAgentDialogComponent {
    form: FormGroup;

    constructor(
        private _dialogRef: MatDialogRef<CreateAgentDialogComponent>,
        private _formBuilder: FormBuilder,
        private _agents: AgentsService
    ) {
        this.form = this._formBuilder.group({
            name: ['', [Validators.required, Validators.maxLength(120)]],
            agent_type: ['receptionist', [Validators.required]]
        });
    }

    save(): void {
        if (this.form.invalid) return;
        this._agents.createAgent(this.form.value).subscribe((created: AgentListItem) => {
            this._dialogRef.close(created);
        });
    }
}


