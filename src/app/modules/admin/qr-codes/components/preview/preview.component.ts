import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxQrcodeStylingComponent, Options } from 'ngx-qrcode-styling';

@Component({
    selector: 'app-qr-preview',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, NgxQrcodeStylingComponent],
    templateUrl: './preview.component.html',
    styleUrls: ['./preview.component.scss']
})
export class QrPreviewComponent {

    @Input() config!: Options;
    @ViewChild(NgxQrcodeStylingComponent) childQrcode!: NgxQrcodeStylingComponent;

    constructor(private _snackBar: MatSnackBar) {}
    update(previous: Options, next: Options) {
        return this.childQrcode.update(previous, next);
    }

    downloadImage() {
        const fileName = `qr-code-${Date.now()}.png`;
        this.childQrcode.download(fileName).subscribe({
            next: (result) => {
                console.log('QR code downloaded successfully:', result);
                this._snackBar.open('QR code downloaded successfully', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'end'
                });
            },
            error: (error) => {
                console.error('Failed to download QR code:', error);
                this._snackBar.open('Failed to download QR code', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'end'
                });
             }
         });
    }

}


