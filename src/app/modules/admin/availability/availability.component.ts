import { Component, OnDestroy, AfterViewInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { WorkHoursComponent } from './components/work-hours/work-hours.component';
import { AgentService, AgentConfig } from '../agent/agent.service';
import { Subject, takeUntil } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'admin-availability-page',
    templateUrl: './availability.component.html',
    styleUrls: ['./availability.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        WorkHoursComponent,
        MatButtonModule,
        MatSnackBarModule,
        MatButtonToggleModule,
        MatIconModule
    ]
})
export class AvailabilityComponent implements AfterViewInit, OnDestroy {
    form: FormGroup;
    private _unsubscribeAll: Subject<void> = new Subject<void>();
    // View reference to call setter method
    @ViewChild('workHoursRef') workHoursRef!: WorkHoursComponent;
    private _pendingAvailability: any = null;
    private _latestConfig: AgentConfig | null = null;
    saving = false;
    selected: 'hours' | 'location' = 'hours';

    constructor(private fb: FormBuilder, private route: ActivatedRoute, private agentService: AgentService, private snackBar: MatSnackBar) {
        this.form = this.fb.group({ availability: this.fb.group({ workHours: this.fb.control(null) }) });

        this.route.paramMap
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pm) => {
                const agentId = pm.get('agent_id');
                if (!agentId) return;
                this.agentService.setAgentId(agentId);
                this.agentService.getConfig().subscribe();
            });

        this.agentService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((cfg) => {
                console.log('Config:', cfg);
                if (!cfg) return;
                this._latestConfig = cfg as AgentConfig;
                const availability = (cfg as any)?.availability ?? { workHours: null };
                this._pendingAvailability = availability;
                if (this.workHoursRef) {
                    this.workHoursRef.setFromAvailability(availability);
                    this._pendingAvailability = null;
                }
            });
    }

    ngAfterViewInit(): void {
        if (this._pendingAvailability) {
            this.workHoursRef?.setFromAvailability(this._pendingAvailability);
            this._pendingAvailability = null;
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next();
        this._unsubscribeAll.complete();
    }

    save(): void {
        if (!this._latestConfig) { return; }
        const availability = this.form.get('availability')?.value ?? { workHours: null };
        const nextConfig: AgentConfig = { ...this._latestConfig, availability };
        this.saving = true;
        this.agentService.updateConfig(nextConfig)
            .pipe(finalize(() => { this.saving = false; }))
            .subscribe({
                next: (updated) => {
                    this._latestConfig = updated;
                    this.form.markAsPristine();
                    this.snackBar.open('Availability saved', 'Close', { duration: 2000, horizontalPosition: 'end' });
                },
                error: (err) => {
                    const msg = err?.message || 'Failed to save availability';
                    this.snackBar.open(msg, 'Close', { duration: 3000, horizontalPosition: 'end' });
                }
            });
    }
}


