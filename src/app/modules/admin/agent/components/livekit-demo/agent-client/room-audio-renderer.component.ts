import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { LivekitRoomService } from '../livekit-room.service';

@Component({
	selector: 'va-room-audio-renderer',
	standalone: true,
	imports: [CommonModule],
	template: `
		<div #container style="position: fixed; pointer-events: none; width: 0; height: 0; overflow: hidden;"></div>
	`,
})
export class RoomAudioRendererComponent implements OnInit, OnDestroy {
	@ViewChild('container', { static: true }) containerRef!: ElementRef<HTMLDivElement>;

	private detachHandler: (() => void) | null = null;

	constructor(private readonly roomSvc: LivekitRoomService) {}

	ngOnInit(): void {
		this.detachHandler = this.roomSvc.attachRemoteAudio(
			(audioEl) => {
				try {
					audioEl.muted = false;
					audioEl.autoplay = true;
					// @ts-ignore playsInline exists in browsers
					audioEl.playsInline = true;
					this.containerRef.nativeElement.appendChild(audioEl);
					// Attempt to resume audio context for Safari/iOS if needed
					void audioEl.play().catch(() => {});
				} catch {}
			},
			(audioEl) => {
				if (audioEl.parentElement === this.containerRef.nativeElement) {
					this.containerRef.nativeElement.removeChild(audioEl);
				}
			}
		);
	}

	ngOnDestroy(): void {
		if (this.detachHandler) {
			this.detachHandler();
			this.detachHandler = null;
		}
	}
}


