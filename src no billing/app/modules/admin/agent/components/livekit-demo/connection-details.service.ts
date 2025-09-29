import { inject, Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import type { ConnectionDetails } from './types';
import { SupabaseService } from 'app/core/supabase/supabase.service';
import { environment } from '../../../../../../../environments/environment';
import { BaseAgentService } from '../../shared';

@Injectable({ providedIn: 'root' })
export class ConnectionDetailsService extends BaseAgentService implements OnInit {
	private readonly _details$ = new BehaviorSubject<ConnectionDetails | null>(null);

	public readonly details$ = this._details$.asObservable();

	get current(): ConnectionDetails | null {
		return this._details$.value;
	}

	constructor(private readonly http: HttpClient, protected override _supabase: SupabaseService) {
		super(_supabase);
	}
	ngOnInit(): void {

	}

	async refresh(tokenIssuerUrl?: string): Promise<void> {
		this._details$.next(null);
		// Default token issuer endpoint
		const url = tokenIssuerUrl ?? environment.tokenUrl;
		const headers = new HttpHeaders({ 'Cache-Control': 'no-store', 'Content-Type': 'application/json' });

		// Get supabase token
		const supabaseToken = await this._supabase.getAuthToken();
		if (!supabaseToken) {
			throw new Error('Supabase token not found');
		}
		const agentId = this.getAgentId();
		// Fetch LiveKit participant token from token issuer API
		const tokenData = await firstValueFrom(this.http.get<{ participantToken: string }>(url, { headers, params: { agent_id: agentId } }));

		console.log('tokenData', tokenData);
		// Build connection details expected by the LiveKit client
		const serverUrl = environment.livekitUrl;
		console.log('serverUrl', serverUrl);
		const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10000)}`;
		const participantName = 'user';

		const details: ConnectionDetails = {
			serverUrl,
			roomName,
			participantName,
			participantToken: tokenData.participantToken,
		};

		this._details$.next(details);
	}
}


