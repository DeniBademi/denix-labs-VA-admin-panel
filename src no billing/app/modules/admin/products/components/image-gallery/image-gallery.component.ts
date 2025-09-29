import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
    selector: 'app-image-gallery',
    standalone: true,
    imports: [CommonModule, MatIconModule],
    templateUrl: './image-gallery.component.html',
    styleUrls: ['./image-gallery.component.scss']
})
export class ImageGalleryComponent implements OnChanges {
    @Input() urls: string[] = [];

    currentIndex = 0;
    imageError = false;
    private _lastUrls: string[] = [];

    ngOnChanges(changes: SimpleChanges): void {
        if (!changes['urls']) return;

        const normalize = (arr: any[]): string[] => (arr || []).map((u) => String(u ?? '').trim());
        const newUrls = normalize(this.urls);
        const oldUrls = this._lastUrls;

        const equalLength = newUrls.length === oldUrls.length;
        const equalContent = equalLength && newUrls.every((v, i) => v === oldUrls[i]);

        // If content changed, adjust index but try to preserve current image
        if (!equalContent) {
            const current = oldUrls[this.currentIndex];
            const preservedIndex = current ? newUrls.indexOf(current) : -1;
            if (preservedIndex >= 0) {
                this.currentIndex = preservedIndex;
            } else {
                this.currentIndex = Math.max(0, Math.min(this.currentIndex, newUrls.length - 1));
            }
            this.imageError = false;
            this._lastUrls = newUrls;
        }
    }

    get hasImages(): boolean {
        return Array.isArray(this.urls) && this.urls.length > 0;
    }

    get currentUrl(): string | null {
        if (!this.hasImages) return null;
        const url = this.urls[this.currentIndex];
        return url || null;
    }

    prev(): void {
        if (!this.hasImages) return;
        this.imageError = false;
        this.currentIndex = (this.currentIndex - 1 + this.urls.length) % this.urls.length;
    }

    next(): void {
        if (!this.hasImages) return;
        this.imageError = false;
        this.currentIndex = (this.currentIndex + 1) % this.urls.length;
    }
}


