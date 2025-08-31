import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
    @Output() download = new EventEmitter<void>();
    @ViewChild(NgxQrcodeStylingComponent) childQrcode!: NgxQrcodeStylingComponent;

    update(previous: Options, next: Options) {
        return this.childQrcode.update(previous, next);
    }

    downloadImage(fileName: string) {
        return this.childQrcode.download(fileName);
    }

}


