import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LivekitRoomService } from '../livekit-room.service';
import { ConnectionDetailsService } from '../connection-details.service';
import type { AppConfig, EmbedErrorDetails } from '../types';
import { WelcomeViewComponent } from '../welcome-view.component';
import { RoomAudioRendererComponent } from './room-audio-renderer.component';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
	selector: 'va-agent-client',
	standalone: true,
	imports: [CommonModule, WelcomeViewComponent, RoomAudioRendererComponent],
	templateUrl: './agent-client.component.html',
	styleUrls: ['./agent-client.component.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentClientComponent {
	@Input() appConfig!: AppConfig;
	@Input() connectionDetailsEndpoint?: string;
	sessionStarted = false;
	isLoading = false;
	isInCall = false;
	volumeLevel = 0;
	currentError: EmbedErrorDetails | null = null;
	currentStatus: 'Loading' | 'in-call' | 'Disconnected' | '' = '';
	needsAudioStart = false;

	constructor(
		private readonly roomSvc: LivekitRoomService,
		private readonly detailsSvc: ConnectionDetailsService,
		private readonly _snackBar: MatSnackBar,
		private readonly cdr: ChangeDetectorRef
	) {
	}

	async onStartAudioClick(): Promise<void> {
		try {
			const started = await this.roomSvc.startAudio();
			if (started) {
				this.needsAudioStart = false;
				this.cdr.detectChanges();
			}
		} catch {
			// no-op
		}
	}

	async startSession(): Promise<void> {
		if (this.isLoading) {
			return;
		}
		this.sessionStarted = true;
		this.isLoading = true;
		this.currentError = null;
		this.currentStatus = 'Loading';
		this.cdr.detectChanges();


		//simluate loading time
		await new Promise(resolve => setTimeout(resolve, 2000));
		console.log('loading time');
		// keep loading true until connection finishes
		this.cdr.detectChanges();


		try {
			await this.detailsSvc.refresh(this.connectionDetailsEndpoint);
			const details = this.detailsSvc.current;
			if (!details) {
				throw new Error('Missing connection details');
			}
			await this.roomSvc.connect(details, this.appConfig);
			const started = await this.roomSvc.startAudio();
			this.needsAudioStart = !started;
			this.isInCall = true;
			this.sessionStarted = true;
			this.currentError = null;
			this.isLoading = false;
			this.currentStatus = 'in-call';
			this.cdr.detectChanges();
		} catch (e) {
			const err = e as Error;
			this._snackBar.open('There was an error connecting to the agent', 'Close');
			this.currentError = {
				title: 'There was an error connecting to the agent',
				description: `${err.name}: ${err.message}`,
			};
			this.isLoading = false;
			this.isInCall = false;
			this.currentStatus = '';
			this.cdr.detectChanges();
		}
	}

	stopSession(): void {
		this.roomSvc.disconnect();
		this.isInCall = false;
		this.sessionStarted = false;
		this.currentError = null;
		this.isLoading = false;
		this.currentStatus = 'Disconnected';
		this.cdr.detectChanges();
	}
}


