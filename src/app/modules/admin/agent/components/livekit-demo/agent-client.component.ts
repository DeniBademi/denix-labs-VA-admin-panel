import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LivekitRoomService } from './livekit-room.service';
import { ConnectionDetailsService } from './connection-details.service';
import type { AppConfig, EmbedErrorDetails } from './types';
import { WelcomeViewComponent } from './welcome-view.component';

@Component({
	selector: 'va-agent-client',
	standalone: true,
	imports: [CommonModule, WelcomeViewComponent],
	template: `
		<div class="bg-background relative h-16 rounded-full border px-3">
			<va-welcome-view
				[disabled]="sessionStarted"
				(onStartCall)="startSession()"
			></va-welcome-view>

			<!-- <div *ngIf="currentError" class="h-full w-full">
				<div class="flex h-full items-center justify-between gap-1 gap-4 pl-3">
					<div class="pl-3">
						<img src="/images/logo/logo.svg" alt="LiveKit Logo" class="block size-6 dark:hidden" />
						<img src="/images/logo/logo-black.svg" alt="LiveKit Logo" class="hidden size-6 dark:block" />
					</div>

					<div class="flex flex-col justify-center">
						<span class="text-sm font-medium">{{ currentError?.title }}</span>
						<span class="text-xs">{{ currentError?.description }}</span>
					</div>

					<button type="button" class="rounded-full border px-2 py-1" (click)="currentError = null">×</button>
				</div>
			</div>

			<va-room-audio-renderer />

			<va-session-view
				[appConfig]="appConfig!"
				[disabled]="!sessionStarted || !!currentError"
				[sessionStarted]="sessionStarted"
				(displayError)="onDisplayError($event)"
			></va-session-view> -->
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgentClientComponent {
	@Input() appConfig!: AppConfig;
	@Input() connectionDetailsEndpoint?: string;
	sessionStarted = false;
	currentError: EmbedErrorDetails | null = null;

	constructor(
		private readonly roomSvc: LivekitRoomService,
		private readonly detailsSvc: ConnectionDetailsService,
	) {}

	async startSession(): Promise<void> {
		this.sessionStarted = true;
		this.currentError = null;
		try {
			await this.detailsSvc.refresh(this.connectionDetailsEndpoint);
			const details = this.detailsSvc.current;
			if (!details) {
				throw new Error('Missing connection details');
			}
			await this.roomSvc.connect(details, this.appConfig);
		} catch (e) {
			const err = e as Error;
			this.currentError = {
				title: 'There was an error connecting to the agent',
				description: `${err.name}: ${err.message}`,
			};
			console.error(e);
		}
	}

	onDisplayError(e: EmbedErrorDetails): void {
		this.currentError = e;
		this.sessionStarted = false;
	}
}


