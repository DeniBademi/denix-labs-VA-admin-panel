import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { SupabaseService } from 'app/core/supabase/supabase.service';

export const callDetailResolver: ResolveFn<{ call: any | null; turns: any[] }> = async (
  route: ActivatedRouteSnapshot,
  _state: RouterStateSnapshot
) => {
  const supabase = inject(SupabaseService).getSupabase;
  const id = route.paramMap.get('id') as string;
  try {
    const [callRes, turnsRes] = await Promise.all([
      supabase.from('calls').select('*').eq('id', id).single(),
      supabase.from('call_turns').select('*').eq('call_id', id).order('turn_index', { ascending: true })
    ]);
    return { call: callRes.data ?? null, turns: turnsRes.data ?? [] };
  } catch {
    return { call: null, turns: [] };
  }
};


