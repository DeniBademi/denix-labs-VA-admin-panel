import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription, debounceTime } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { EmbedCodePreviewComponent } from './components/embed-code-preview/embed-code-preview.component';

@Component({
    selector: 'app-widget-tab',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        MatButtonModule,
        MatTabsModule,
        MatSnackBarModule,
        EmbedCodePreviewComponent
    ],
    templateUrl: './website-widget-tab.component.html',
    styleUrls: ['./website-widget-tab.component.scss']
})
export class WebsiteWidgetTabComponent implements OnInit, OnDestroy {
    readonly form: FormGroup;
    private agentId: string | null = null;
    readonly EMBED_CONN_DETAILS_BASE = 'http://localhost:8000/connection-details';
    private valueChangesSub?: Subscription;

    constructor(private _fb: FormBuilder, private _snackBar: MatSnackBar, private _route: ActivatedRoute) {
        this.form = this._fb.group({
            logo: ["denixlabs-logo.svg", []],
            logoDark: ["denixlabs-logo-dark.svg", []],
            accent: ['#000000FF', [Validators.required]],
            accentDark: ['#E1BE31FF', [Validators.required]],
            theme: [undefined, []]
        });
    }

    ngOnInit(): void {
        // Resolve agent_id from current route hierarchy
        let route: ActivatedRoute | null = this._route;
        while (route) {
            const id = route.snapshot.paramMap.get('agent_id');
            if (id) { this.agentId = id; break; }
            route = route.parent as ActivatedRoute | null;
        }



        // Set initial global config so the embed reads correct values on first load
        (window as any).agentPopupConfig = this._buildEmbedConfig();

        // If wrapper exists from a previous visit, show it; otherwise inject the script once
        const existingWrapper = document.getElementById('lk-embed-wrapper');
        if (existingWrapper) {
            existingWrapper.style.display = '';
        } else if (!document.querySelector('script[data-embed-popup]')) {
            const script = document.createElement('script');
            script.src = '/js/embed-popup.js';
            script.defer = true;
            script.setAttribute('data-embed-popup', 'true');
            document.body.appendChild(script);
        }

        // When form changes, update embed via postMessage so preview reflects current styling
        this.valueChangesSub = this.form.valueChanges
            .pipe(debounceTime(150))
            .subscribe(() => {
                const config = this._buildEmbedConfig();
                try {
                    window.postMessage({ type: 'LIVEKIT_EMBED_UPDATE_CONFIG', config }, window.location.origin);
                } catch {}
            });

        // React to route param changes (agent switch via side nav)
        this._route.paramMap
            .pipe(
                map((pm) => pm.get('agent_id')),
                distinctUntilChanged()
            )
            .subscribe((id) => {
                if (!id) { return; }
                this.agentId = id;
                const cfg = this._buildEmbedConfig();
                (window as any).agentPopupConfig = cfg;
                try {
                    window.postMessage({ type: 'LIVEKIT_EMBED_UPDATE_CONFIG', config: cfg }, window.location.origin);
                } catch {}
            });
    }

    ngOnDestroy(): void {
        // Hide (don't remove) the wrapper so we can show it again on return
        const wrapper = document.getElementById('lk-embed-wrapper');
        if (wrapper) {
            (wrapper as HTMLElement).style.display = 'none';
        }
        this.valueChangesSub?.unsubscribe();
        // Do not remove the script tag to avoid re-downloading repeatedly.
        // If you prefer to remove it, uncomment below lines.
        // const script = document.querySelector('script[data-embed-popup]');
        // script?.parentElement?.removeChild(script as Node);
    }

    onColorChange(field: 'accent' | 'accentDark', rgbHex: string): void {
        const current: string = this.form.controls[field].value || '#000000FF';
        const alpha = current.length === 9 ? current.substring(7, 9) : 'FF';
        const normalized = rgbHex.length === 7 ? `${rgbHex}${alpha}` : rgbHex;
        this.form.controls[field].setValue(normalized);
    }

    get embedCode(): string {
        const cfg = this._buildEmbedConfig();
        return `<script>
  window.agentPopupConfig = ${JSON.stringify(cfg, null, 2)};
</script>
<script src="<YOUR/CUSTOM/PATH/TO/popup.js"></script>`;
    }

    private _buildEmbedConfig() {
        const v = this.form.value;
        return {
            logo: v.logo,
            logoDark: v.logoDark,
            accent: v.accent,
            accentDark: v.accentDark,
            agentId: `${encodeURIComponent(this.agentId ?? '')}`,
            theme: v.theme
        };
    }

    // Copy functionality moved into EmbedCodePreviewComponent
}


