import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { RouterModule } from '@angular/router';
import { AgentsService, AgentListItem } from './agents.service';
import { CreateAgentDialogComponent } from './create-agent-dialog/create-agent-dialog.component';

@Component({
    selector: 'agents-overview',
    templateUrl: './agents.component.html',
    styleUrls: ['./agents.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [CommonModule, RouterModule, MatButtonModule, MatIconModule, MatTableModule, MatDialogModule]
})
export class AgentsComponent implements OnInit {
    displayedColumns = ['name','type','id','actions'];
    agents: AgentListItem[] = [];

    constructor(
        private _agents: AgentsService,
        private _dialog: MatDialog,
        private _confirm: FuseConfirmationService
    ) {}

    ngOnInit(): void {
        this._agents.agents$.subscribe((list) => this.agents = list);
        this._agents.getAgents().subscribe();
    }

    openCreateDialog(): void {
        this._dialog.open(CreateAgentDialogComponent, { width: '520px' })
            .afterClosed()
            .subscribe(() => {});
    }

    deleteAgent(agent: AgentListItem): void {
        const confirmation = this._confirm.open({
            title: 'Delete agent',
            message: 'Are you sure you want to delete this agent? This will remove its configuration and data.',
            actions: {
                confirm: { label: 'Delete' }
            }
        });
        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this._agents.deleteAgent(agent.id).subscribe();
            }
        });
    }
}


