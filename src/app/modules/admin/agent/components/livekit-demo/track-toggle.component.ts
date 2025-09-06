import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Track } from 'livekit-client';
import { CommonModule } from '@angular/common';
@Component({
	selector: 'va-track-toggle',
	standalone: true,
	imports: [CommonModule],
	template: `
		<button
			type="button"
			[disabled]="disabled || pending"
			[attr.aria-label]="'Toggle ' + (source ?? '')"
			(click)="pressedChange.emit(!pressed)"
			class="peer/track group/track relative w-auto pr-3 pl-3 md:rounded-r-none md:border-r-0 md:pr-2 rounded-full border px-3 py-2 text-sm disabled:opacity-50"
		>
			<span *ngIf="pending" class="animate-spin">⏳</span>
			<span *ngIf="!pending">
				{{ iconLabel }}
			</span>
			<ng-content />
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrackToggleComponent {
	@Input() source!: Track.Source;
	@Input() pressed = false;
	@Input() pending = false;
	@Input() disabled = false;
	@Output() readonly pressedChange = new EventEmitter<boolean>();

	get iconLabel(): string {
		switch (this.source) {
			case Track.Source.Microphone:
				return this.pressed ? '🎤' : '🔇';
			case Track.Source.Camera:
				return this.pressed ? '📹' : '📷';
			case Track.Source.ScreenShare:
				return '🖥️';
			default:
				return '';
		}
	}
}


