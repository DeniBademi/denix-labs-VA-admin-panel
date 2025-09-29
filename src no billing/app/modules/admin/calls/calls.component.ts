import { DatePipe, DecimalPipe, NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { SupabaseService } from 'app/core/supabase/supabase.service';

@Component({
    selector: 'admin-calls',
    standalone: true,
    imports: [NgIf, NgFor, RouterLink, DatePipe, DecimalPipe, FormsModule],
    templateUrl: './calls.component.html',
    styleUrls: ['./calls.component.scss']
})
export class CallsComponent {
    private supabase = inject(SupabaseService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    calls = signal<any[]>([]);
    loading = signal<boolean>(true);
    agents = signal<any[]>([]);
    workspaces = signal<any[]>([]);
    from = '';
    to = '';
    agentId = '';
    workspaceId = '';
    page = 1;
    pageSize = 50;
    hasKeys(obj: any): boolean { try { return !!obj && typeof obj === 'object' && Object.keys(obj).length > 0; } catch { return false; } }
    errorMsg = signal<string | null>(null);
    private appliedDefaultRange = false;

    private toIsoWithBuffer(dateStr: string): string {
        // Adds 23h50m buffer to include calls that ended throughout the selected 'to' day
        const d = new Date(dateStr);
        d.setHours(23, 59, 59, 999);
        return d.toISOString();
    }

    private fromIsoStartOfDay(dateStr: string): string {
        const d = new Date(dateStr);
        d.setHours(0, 0, 0, 0);
        return d.toISOString();
    }

    async ngOnInit() {
        try {
            const qp = this.route.snapshot.queryParamMap;
            this.from = qp.get('from') ?? '';
            this.to = qp.get('to') ?? '';
            this.agentId = qp.get('agent_id') ?? '';
            this.workspaceId = qp.get('workspace_id') ?? '';
            this.page = Math.max(1, Number(qp.get('page') ?? 1));
            this.pageSize = Math.min(200, Math.max(1, Number(qp.get('pageSize') ?? 50)));

            // Default last 7 days if no range provided
            if (!this.from && !this.to && !this.appliedDefaultRange) {
                const today = new Date();
                const start = new Date();
                start.setDate(today.getDate() - 7);
                const toStr = today.toISOString().slice(0,10);
                const fromStr = start.toISOString().slice(0,10);
                this.from = fromStr;
                this.to = toStr;
                this.appliedDefaultRange = true;
                // Persist defaults to URL without adding history
                this.router.navigate([], { relativeTo: this.route, replaceUrl: true, queryParamsHandling: 'merge', queryParams: { from: this.from, to: this.to } });
            }

            let query = this.supabase.getSupabase
                .from('calls')
                .select('id, ended_at, duration_ms, turns_count, agent:agent_id ( name ), agent_id, workspace_id, metrics_stt, metrics_llm, metrics_tts', { count: 'exact' })
                .order('ended_at', { ascending: false });

            if (this.from) {
                query = query.gte('ended_at', this.fromIsoStartOfDay(this.from));
            }
            if (this.to) {
                query = query.lte('ended_at', this.toIsoWithBuffer(this.to));
            }
            if (this.agentId) {
                query = query.eq('agent_id', this.agentId);
            }
            if (this.workspaceId) {
                query = query.eq('workspace_id', this.workspaceId);
            }

            const fromIdx = (this.page - 1) * this.pageSize;
            const toIdx = fromIdx + this.pageSize - 1;

            const { data, error } = await query.range(fromIdx, toIdx);
            if (error) throw error;
            this.calls.set(data || []);
            await this.loadFilters();
        } catch (e) {
            console.error('Failed to load calls', e);
            this.errorMsg.set((e as any)?.message ?? 'Failed to load calls');
        } finally {
            this.loading.set(false);
        }
    }

    async loadFilters() {
        try {
            const [agents, workspaces] = await Promise.all([
                this.supabase.getSupabase.from('agent').select('id, name').order('name', { ascending: true }),
                this.supabase.getSupabase.from('workspaces').select('id, name').order('name', { ascending: true })
            ]);
            this.agents.set(agents.data || []);
            this.workspaces.set(workspaces.data || []);
        } catch (e) {
            // ignore
        }
    }

    applyFilters() {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: {
                from: this.from || null,
                to: this.to || null,
                agent_id: this.agentId || null,
                workspace_id: this.workspaceId || null,
                page: 1,
                pageSize: this.pageSize
            },
            queryParamsHandling: 'merge'
        });
        this.ngOnInit();
    }

    nextPage() {
        this.page += 1;
        this.router.navigate([], { relativeTo: this.route, queryParams: { page: this.page }, queryParamsHandling: 'merge' });
        this.ngOnInit();
    }

    prevPage() {
        if (this.page <= 1) return;
        this.page -= 1;
        this.router.navigate([], { relativeTo: this.route, queryParams: { page: this.page }, queryParamsHandling: 'merge' });
        this.ngOnInit();
    }
}


