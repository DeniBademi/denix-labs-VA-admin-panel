import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Product } from '../../products.types';

@Component({
    selector: 'app-product-price',
    standalone: true,
    imports: [CommonModule],
    template: `
        <ng-container *ngIf="product as p">
            <ng-container *ngIf="p.salePrice !== undefined; else regular">
                <span class="line-through text-gray-500">{{ p.price }}</span>
                <span class="ml-2 text-red-600 font-medium">{{ p.salePrice | currency }}</span>
            </ng-container>
            <ng-template #regular>
                {{ p.price | currency: 'BGN' : 'symbol' : '1.2-2' }}
            </ng-template>
        </ng-container>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductPriceComponent {
    @Input() product: Product;
}


