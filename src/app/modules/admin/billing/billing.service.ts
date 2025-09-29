import { inject, Injectable } from '@angular/core';
import { SupabaseService } from 'app/core/supabase/supabase.service';
import { WorkspaceService } from 'app/core/workspace/workspace.service';
import { environment } from '../../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BillingService {
    private _supabase = inject(SupabaseService);
    private _workspace = inject(WorkspaceService);

    async getCurrentStatus() {
        const supabase = this._supabase.getSupabase;
        const orgId = await this._workspace.getWorkspaceId();
        if (!orgId) { return null; }
        const { data, error } = await supabase.rpc('get_org_billing_status', { p_organization_id: orgId });
        if (error) throw error;
        return data;
    }

    async startCheckout(priceId: string, successUrl: string, cancelUrl: string) {
        const orgId = await this._workspace.getOrganizationId();
        if (!orgId) { throw new Error('No organization'); }
        const url = `${environment.supabaseUrl}/functions/v1/billing-functions/checkout`;
        const token = await this._supabase.getAuthToken();
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                'apikey': environment.supabaseKey,
                'x-client-info': 'voiceagent-dashboard'
            },
            body: JSON.stringify({ organization_id: orgId, price_id: priceId, success_url: successUrl, cancel_url: cancelUrl })
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        return json?.url as string;
    }

    async openPortal(returnUrl: string) {
        const orgId = await this._workspace.getWorkspaceId();
        if (!orgId) { throw new Error('No organization'); }
        const url = `${environment.supabaseUrl}/functions/v1/billing-functions/portal`;
        const token = await this._supabase.getAuthToken();
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
                'apikey': environment.supabaseKey,
                'x-client-info': 'voiceagent-dashboard'
            },
            body: JSON.stringify({ organization_id: orgId, return_url: returnUrl })
        });
        if (!res.ok) throw new Error(await res.text());
        const json = await res.json();
        return json?.url as string;
    }
}


