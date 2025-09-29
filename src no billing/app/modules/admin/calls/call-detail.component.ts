import { DatePipe, DecimalPipe, JsonPipe, NgFor, NgIf } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { SupabaseService } from 'app/core/supabase/supabase.service';

@Component({
    selector: 'admin-call-detail',
    standalone: true,
    imports: [NgIf, NgFor, RouterLink, DatePipe, DecimalPipe, JsonPipe],
    templateUrl: './call-detail.component.html'
})
export class CallDetailComponent {
    private supabase = inject(SupabaseService);
    private route = inject(ActivatedRoute);
    call = signal<any | null>(null);
    turns = signal<any[]>([]);
    loading = signal<boolean>(true);

    async ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id') as string;
        try {
            const [{ data: call }, { data: turns }] = await Promise.all([
                this.supabase.getSupabase.from('calls').select('*').eq('id', id).single(),
                this.supabase.getSupabase.from('call_turns').select('*').eq('call_id', id).order('turn_index', { ascending: true })
            ]);
            this.call.set(call || null);
            this.turns.set(turns || []);
        } catch (e) {
            console.error('Failed to load call', e);
        } finally {
            this.loading.set(false);
        }
    }

    copyFullTranscript() {
        const c = this.call();
        if (!c?.full_transcript) return;
        try { navigator.clipboard.writeText(c.full_transcript); } catch {}
    }
}


