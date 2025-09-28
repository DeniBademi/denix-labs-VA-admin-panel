import { Component, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ActivatedRoute } from '@angular/router';
import { BaseAgentComponent } from '../../../agent/shared/base-agent-component';

@Component({
    selector: 'availability-work-hours',
    templateUrl: './work-hours.component.html',
    styleUrls: ['./work-hours.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule
    ]
})
export class WorkHoursComponent extends BaseAgentComponent {
    availabilityForm: FormGroup;
    private _isSyncingFromParent = false;
    @Output() save = new EventEmitter<void>();

    readonly weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

    constructor(protected override _route: ActivatedRoute, private fb: FormBuilder) {
        super(_route);
    }

    protected override onAgentComponentInit(): void {
        const initialWorkHours = this.parentForm?.get('availability.workHours')?.value ?? null;
        this.availabilityForm = this.buildAvailabilityForm(initialWorkHours);
        // Mount into existing availability group without replacing the group reference
        const availabilityGroup = this.parentForm?.get('availability') as FormGroup | null;
        if (availabilityGroup) {
            availabilityGroup.setControl('workHours', this.availabilityForm);
        } else {
            this.parentForm?.addControl('availability', this.fb.group({ workHours: this.availabilityForm }));
        }
        // Avoid subscribing to parent valueChanges here to prevent focus loss
    }

    protected override onAgentIdChanged(agentId: string | null): void {
        // No-op for now
    }

    setTimezone(tz: string): void {
        this.availabilityForm.get('timezone')?.setValue(tz);
        this.availabilityForm.markAsDirty();
    }

    get days(): FormArray {
        return this.availabilityForm.get('days') as FormArray;
    }

    getRanges(dayIndex: number): FormArray {
        return (this.days.at(dayIndex) as FormGroup).get('ranges') as FormArray;
    }

    addRange(dayIndex: number): void {
        this.getRanges(dayIndex).push(this.buildRange());
        this.availabilityForm.markAsDirty();
    }

    removeRange(dayIndex: number, rangeIndex: number): void {
        this.getRanges(dayIndex).removeAt(rangeIndex);
        this.availabilityForm.markAsDirty();
    }

    onEnabledChange(dayIndex: number, enabled: boolean): void {
        if (enabled) {
            const ranges = this.getRanges(dayIndex);
            if (ranges.length === 0) {
                ranges.push(this.buildRange({ start: '09:00', end: '17:00' }));
            }
        }
        this.availabilityForm.updateValueAndValidity({ onlySelf: false, emitEvent: true });
        this.availabilityForm.markAsDirty();
    }

    onTimeEnter(event: KeyboardEvent): void {
        event.preventDefault();
        event.stopPropagation();
        const target = event.target as HTMLInputElement | null;
        if (target) {
            target.blur();
        }
    }

    setPermanentlyEnabled(): void {
        for (let i = 0; i < this.days.length; i++) {
            const dayGroup = this.days.at(i) as FormGroup;
            dayGroup.get('enabled')?.setValue(true);
            const ranges = this.getRanges(i);
            while (ranges.length) {
                ranges.removeAt(0);
            }
            ranges.push(this.buildRange({ start: '00:00', end: '23:59' }));
        }
        this.availabilityForm.updateValueAndValidity({ emitEvent: true });
        this.availabilityForm.markAsDirty();
    }

    setPermanentlyDisabled(): void {
        for (let i = 0; i < this.days.length; i++) {
            const dayGroup = this.days.at(i) as FormGroup;
            dayGroup.get('enabled')?.setValue(false);
            const ranges = this.getRanges(i);
            while (ranges.length) {
                ranges.removeAt(0);
            }
        }
        this.availabilityForm.updateValueAndValidity({ emitEvent: true });
        this.availabilityForm.markAsDirty();
    }

    private buildAvailabilityForm(initial?: any): FormGroup {
        const timezone = initial?.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone;
        const initialDays = initial?.days;
        const daysArray = this.fb.array(
            this.weekdays.map((_, idx) => this.buildDay(initialDays ? initialDays[idx] : null))
        );
        return this.fb.group({
            timezone: new FormControl(timezone),
            days: daysArray
        });
    }

    private patchWorkHours(value: any): void {
        // console.log('Patching work hours:', value);
        if (!value) { return; }
        if (value.timezone) {
            this.availabilityForm.get('timezone')?.setValue(value.timezone, { emitEvent: false });
        }
        const incomingDays = value.days || {};
        for (let i = 0; i < this.days.length; i++) {
            const dayData = incomingDays[i] || { enabled: false, ranges: [] };
            const dayGroup = this.days.at(i) as FormGroup;
            dayGroup.get('enabled')?.setValue(!!dayData.enabled, { emitEvent: false });
            const rangesArray = dayGroup.get('ranges') as FormArray;
            while (rangesArray.length) { rangesArray.removeAt(0, { emitEvent: false }); }
            (dayData.ranges || []).forEach((r: any) => {
                rangesArray.push(this.buildRange({ start: r.start, end: r.end }), { emitEvent: false });
            });
        }
        this.availabilityForm.updateValueAndValidity({ emitEvent: false });
    }

    /**
     * Manually set availability values into the form without relying on patchValue.
     * Accepts either the full availability object ({ workHours }) or just workHours.
     */
    public setFromAvailability(avail: any): void {
        const workHours = avail?.workHours ?? avail;
        this._isSyncingFromParent = true;
        try {
            if (!workHours) {
                // Reset to sensible defaults when missing
                this.resetToDefaults();
            } else {
                this.patchWorkHours(workHours);
            }
        } finally {
            this._isSyncingFromParent = false;
        }
    }

    private buildDay(day: any | null): FormGroup {
        const enabled = day?.enabled ?? false;
        const ranges = Array.isArray(day?.ranges) && day.ranges.length
            ? day.ranges.map((r: any) => this.buildRange(r))
            : [];
        return this.fb.group({
            enabled: new FormControl(enabled),
            ranges: this.fb.array(ranges)
        });
    }

    private buildRange(range?: any): FormGroup {
        return this.fb.group({
            start: new FormControl(range?.start ?? '09:00'),
            end: new FormControl(range?.end ?? '17:00')
        });
    }

    private resetToDefaults(): void {
        const newForm = this.buildAvailabilityForm(null);
        this.availabilityForm = newForm;
        const availabilityGroup = this.parentForm?.get('availability') as FormGroup | null;
        if (availabilityGroup) {
            availabilityGroup.setControl('workHours', newForm);
        } else {
            this.parentForm?.addControl('availability', this.fb.group({ workHours: newForm }));
        }
        this.availabilityForm.updateValueAndValidity({ emitEvent: false });
    }
}


