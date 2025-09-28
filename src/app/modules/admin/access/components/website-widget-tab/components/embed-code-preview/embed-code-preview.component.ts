import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FuseHighlightComponent } from '@fuse/components/highlight/highlight.component';

@Component({
    selector: 'app-embed-code-preview',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, MatSnackBarModule, FuseHighlightComponent],
    templateUrl: './embed-code-preview.component.html',
    styleUrls: ['./embed-code-preview.component.scss']
})
export class EmbedCodePreviewComponent {
    @Input() code: string = '';
    downloadHref: string = '/js/embed-popup.js';

    constructor(private _snackBar: MatSnackBar) {}

    async copy(textarea?: HTMLTextAreaElement): Promise<void> {
        try {
            if (navigator.clipboard?.writeText && window.isSecureContext) {
                await navigator.clipboard.writeText(this.code);
            } else if (textarea) {
                textarea.focus();
                textarea.select();
                // Fallback: ask user to copy manually to avoid deprecated execCommand
                this._snackBar.open('Press Ctrl/Cmd+C to copy', 'Close', {
                    duration: 2500,
                    horizontalPosition: 'end'
                });
                return;
            }
            this._snackBar.open('Embed code copied to clipboard', 'Close', {
                duration: 2500,
                horizontalPosition: 'end'
            });
        } catch (_) {
            this._snackBar.open('Copy failed. Please copy manually.', 'Close', {
                duration: 3000,
                horizontalPosition: 'end'
            });
        }
    }
}
