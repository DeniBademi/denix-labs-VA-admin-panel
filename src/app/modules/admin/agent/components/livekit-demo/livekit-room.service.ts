import { Injectable, NgZone } from '@angular/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { Room, RoomEvent, Track } from 'livekit-client';
import type { AppConfig, ConnectionDetails, EmbedErrorDetails } from './types';

@Injectable({ providedIn: 'root' })
export class LivekitRoomService {
	private readonly _room: Room;
	private readonly _micEnabled$ = new BehaviorSubject<boolean>(false);
	private readonly _micPending$ = new BehaviorSubject<boolean>(false);
	private readonly _error$ = new Subject<EmbedErrorDetails>();
	private readonly _remoteAudioTracks = new Set<MediaStreamTrack>();

	public readonly micEnabled$ = this._micEnabled$.asObservable();
	public readonly micPending$ = this._micPending$.asObservable();
	public readonly error$ = this._error$.asObservable();

	constructor(private readonly zone: NgZone) {
		this._room = new Room();
		this.registerRoomHandlers();
	}

	get room(): Room {
		return this._room;
	}

	async connect(details: ConnectionDetails, appConfig?: AppConfig): Promise<void> {
		try {
			await this._room.connect(details.serverUrl, details.participantToken);
			this._micPending$.next(true);
			await this._room.localParticipant.setMicrophoneEnabled(true, undefined, {
				preConnectBuffer: appConfig?.isPreConnectBufferEnabled ?? false,
			});
			this._micEnabled$.next(true);
		} catch (e) {
			const err = e as Error;
			this._error$.next({
				title: 'There was an error connecting to the agent',
				description: `${err.name}: ${err.message}`,
			});
			console.error(e);
			throw e;
		} finally {
			this._micPending$.next(false);
		}
	}

	disconnect(): void {
		this._room.disconnect();
		this._micEnabled$.next(false);
	}

	async toggleMicrophone(): Promise<void> {
		try {
			this._micPending$.next(true);
			const enabled = this._room.localParticipant.isMicrophoneEnabled;
			await this._room.localParticipant.setMicrophoneEnabled(!enabled);
			this._micEnabled$.next(!enabled);
		} finally {
			this._micPending$.next(false);
		}
	}

	async switchAudioInput(deviceId: string): Promise<void> {
		await this._room.switchActiveDevice('audioinput', deviceId);
	}

	async startAudio(): Promise<boolean> {
		try {
			await this._room.startAudio();
			return true;
		} catch (e) {
			console.warn('startAudio failed', e);
			return false;
		}
	}

	attachRemoteAudio(onAttach: (element: HTMLAudioElement) => void, onDetach?: (element: HTMLAudioElement) => void): () => void {
		const handleSubscribed = (track: any, publication: any) => {
			if (publication?.kind === Track.Kind.Audio && track?.attach) {
				const el: HTMLAudioElement = track.attach() as HTMLAudioElement;
				el.autoplay = true;
				// @ts-ignore: playsInline is a valid property on HTMLAudioElement in browsers
				el.playsInline = true;
				this._remoteAudioTracks.add(track.mediaStreamTrack);
				console.debug('[LivekitRoomService] Remote audio track subscribed and attached.', { trackSid: publication?.trackSid });
				onAttach(el);
			}
		};
		const handleUnsubscribed = (track: any, publication: any) => {
			if (publication?.kind === Track.Kind.Audio && track?.detach) {
				const elements = track.detach();
				elements.forEach((el: Element) => {
					if (onDetach && el instanceof HTMLAudioElement) {
						onDetach(el);
					}
					el.remove();
				});
				this._remoteAudioTracks.delete(track.mediaStreamTrack);
			}
		};

		this._room.on(RoomEvent.TrackSubscribed, handleSubscribed);
		this._room.on(RoomEvent.TrackUnsubscribed, handleUnsubscribed);

		// Ensure newly published audio tracks get subscribed
		const handleTrackPublished = (publication: any) => {
			try {
				if (publication?.kind === Track.Kind.Audio && publication?.isSubscribed === false && typeof publication.setSubscribed === 'function') {
					publication.setSubscribed(true).catch(() => {});
				}
			} catch {}
		};
		this._room.on(RoomEvent.TrackPublished, handleTrackPublished);

		// Attach any already-subscribed remote audio tracks in case subscription
		// happened before this handler was registered (e.g., after connect).
		for (const participant of this._room.remoteParticipants.values()) {
			// @ts-ignore: tracks is a valid property on RemoteParticipant in browsers
			participant.tracks.forEach((pub: any) => {
				try {
					if (pub?.kind === Track.Kind.Audio) {
						if (pub?.isSubscribed === false && typeof pub.setSubscribed === 'function') {
							console.debug('[LivekitRoomService] Forcing subscribe to existing remote audio publication.', { trackSid: pub?.trackSid });
							pub.setSubscribed(true).catch(() => {});
						}
						if (pub?.track?.attach) {
							const el: HTMLAudioElement = pub.track.attach() as HTMLAudioElement;
							el.autoplay = true;
							// @ts-ignore: playsInline is a valid property on HTMLAudioElement in browsers
							el.playsInline = true;
							this._remoteAudioTracks.add(pub.track.mediaStreamTrack);
							console.debug('[LivekitRoomService] Attached existing remote audio track.', { trackSid: pub?.trackSid });
							onAttach(el);
						}
					}
				} catch (err) {
					console.warn('Failed to attach existing remote audio track', err);
				}
			});
		}

		return () => {
			this._room.off(RoomEvent.TrackSubscribed, handleSubscribed);
			this._room.off(RoomEvent.TrackUnsubscribed, handleUnsubscribed);
			this._room.off(RoomEvent.TrackPublished, handleTrackPublished);
		};
	}

	private registerRoomHandlers(): void {
		this._room.on(RoomEvent.MediaDevicesError, (error: Error) => {
			this.zone.run(() => {
				this._error$.next({
					title: 'Encountered an error with your media devices',
					description: `${error.name}: ${error.message}`,
				});
			});
		});
	}
}


