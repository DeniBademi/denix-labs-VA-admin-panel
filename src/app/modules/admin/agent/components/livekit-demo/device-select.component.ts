import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LivekitRoomService } from './livekit-room.service';

@Component({
	selector: 'va-device-select',
	standalone: true,
	imports: [CommonModule, FormsModule],
	template: `
		<select
			[class]="size === 'sm' ? 'w-auto' : 'w-[180px]'"
			class="rounded-full px-3 py-2 text-sm cursor-pointer"
			[ngModel]="activeDeviceId"
			(ngModelChange)="onChange($event)"
		>
			<option *ngFor="let d of devices" [value]="d.deviceId">{{ d.label }}</option>
		</select>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DeviceSelectComponent implements OnInit, OnDestroy {
	@Input() kind: MediaDeviceKind = 'audioinput';
	@Input() size: 'default' | 'sm' = 'default';
	@Output() readonly activeDeviceChange = new EventEmitter<string>();

	devices: MediaDeviceInfo[] = [];
	activeDeviceId: string | undefined;

	private deviceChangeHandler = async () => {
		await this.loadDevices();
	};

	constructor(private readonly roomSvc: LivekitRoomService) {}

	async ngOnInit(): Promise<void> {
		await this.loadDevices();
		navigator.mediaDevices.addEventListener('devicechange', this.deviceChangeHandler);
	}

	ngOnDestroy(): void {
		navigator.mediaDevices.removeEventListener('devicechange', this.deviceChangeHandler);
	}

	async loadDevices(): Promise<void> {
		const all = await navigator.mediaDevices.enumerateDevices();
		this.devices = all.filter((d) => d.kind === this.kind);
		// Try to infer current device from room constraints when possible
		this.activeDeviceId = this.devices[0]?.deviceId;
	}

	async onChange(deviceId: string): Promise<void> {
		this.activeDeviceId = deviceId;
		if (this.kind === 'audioinput') {
			await this.roomSvc.switchAudioInput(deviceId);
		}
		this.activeDeviceChange.emit(deviceId);
	}
}


