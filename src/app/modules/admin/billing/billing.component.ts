import { Component, inject, signal } from '@angular/core';
import { NgIf } from '@angular/common';
import { BillingService } from './billing.service';
import { Router } from '@angular/router';

@Component({
    selector: 'admin-billing',
    standalone: true,
    imports: [NgIf],
    templateUrl: './billing.component.html',
    styleUrls: ['./billing.component.scss']
})
export class BillingComponent {
    private _billing = inject(BillingService);
    private _router = inject(Router);

    loading = signal<boolean>(true);
    status = signal<any>(null);
    error = signal<string | null>(null);

    async ngOnInit() {
        try {
            const data = await this._billing.getCurrentStatus();
            this.status.set(data);
        } catch (e: any) {
            this.error.set(e?.message ?? 'Failed to load billing status');
        } finally {
            this.loading.set(false);
        }
    }

    async changePlan(priceId: string) {
        try {
            const success = window.location.origin + '/billing';
            const cancel = window.location.href;
            const url = await this._billing.startCheckout(priceId, success, cancel);
            window.location.href = url;
        } catch (e: any) {
            this.error.set(e?.message ?? 'Failed to start checkout');
        }
    }

    async openPortal() {
        try {
            const url = await this._billing.openPortal(window.location.origin + '/billing');
            window.location.href = url;
        } catch (e: any) {
            this.error.set(e?.message ?? 'Failed to open portal');
        }
    }
}


