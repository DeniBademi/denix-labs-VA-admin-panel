import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import type { ConnectionDetails } from './types';
import { SupabaseService } from 'app/core/supabase/supabase.service';
import { environment } from '../../../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ConnectionDetailsService {
	private readonly _details$ = new BehaviorSubject<ConnectionDetails | null>(null);

	public readonly details$ = this._details$.asObservable();

	private readonly supabase = inject(SupabaseService);
	get current(): ConnectionDetails | null {
		return this._details$.value;
	}

	constructor(private readonly http: HttpClient) {}

	async refresh(tokenIssuerUrl?: string): Promise<void> {
		this._details$.next(null);
		// Default token issuer endpoint
		const url = tokenIssuerUrl ?? 'http://localhost:8000/token';
		const headers = new HttpHeaders({ 'Cache-Control': 'no-store', 'Content-Type': 'application/json' });

		// Get supabase token
		const supabaseToken = await this.supabase.getAuthToken();

		// Fetch LiveKit participant token from token issuer API
		const tokenData = await firstValueFrom(this.http.post<{ access_token: string }>(url, { headers, body: { supabaseToken: supabaseToken } }));


		// Build connection details expected by the LiveKit client
		const serverUrl = environment.livekitUrl;
		const roomName = `voice_assistant_room_${Math.floor(Math.random() * 10000)}`;
		const participantName = 'user';

		const details: ConnectionDetails = {
			serverUrl,
			roomName,
			participantName,
			participantToken: tokenData.access_token,
		};

		this._details$.next(details);
	}
}


