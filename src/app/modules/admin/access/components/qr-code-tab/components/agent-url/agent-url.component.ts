import { CommonModule } from '@angular/common';
import { Component, Input } from '@angular/core';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-qr-agent-url',
    standalone: true,
    imports: [CommonModule, MatSnackBarModule, MatButtonModule, MatIconModule],
    templateUrl: './agent-url.component.html',
    styleUrls: ['./agent-url.component.scss']
})
export class QrAgentUrlComponent {

    @Input() url: string = '';

    constructor(private _snackBar: MatSnackBar) {}

    async copyUrl(): Promise<void> {
        try {
            await navigator.clipboard.writeText(this.url);
            this._snackBar.open('Agent URL copied to clipboard', 'Close', {
                duration: 3000,
                horizontalPosition: 'end'
            });
        } catch (error) {
            try {
                const textArea = document.createElement('textarea');
                textArea.value = this.url;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this._snackBar.open('Agent URL copied to clipboard', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'end'
                });
            } catch (fallbackError) {
                console.error('Failed to copy URL:', fallbackError);
                this._snackBar.open('Failed to copy URL', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'end'
                });
            }
        }
    }
}


