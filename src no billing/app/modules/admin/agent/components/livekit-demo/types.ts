import type { TranscriptionSegment } from 'livekit-client';

export type ThemeMode = 'dark' | 'light' | 'system';

export interface AppConfig {
	pageTitle: string;
	pageDescription: string;
	companyName: string;

	supportsChatInput: boolean;
	supportsVideoInput: boolean;
	supportsScreenShare: boolean;
	isPreConnectBufferEnabled: boolean;

	logo: string;
	startButtonText: string;
	accent?: string;
	logoDark?: string;
	accentDark?: string;
}

export interface CombinedTranscription extends TranscriptionSegment {
	role: 'assistant' | 'user';
	receivedAtMediaTimestamp: number;
	receivedAt: number;
}

export type EmbedErrorDetails = { title: string; description: string };

export interface ConnectionDetails {
	serverUrl: string;
	roomName: string;
	participantName: string;
	participantToken: string;
}


