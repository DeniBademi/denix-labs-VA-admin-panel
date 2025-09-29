import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Product } from '../../products.types';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { ProductPriceComponent } from '../product-price/product-price.component';

@Component({
    selector: 'app-product-card',
    standalone: true,
    imports: [CommonModule, MatButtonModule, MatIconModule, ProductPriceComponent],
    template: `
        <div class="rounded border p-4 flex flex-col gap-3">
            <img class="w-full h-40 object-cover rounded" [src]="product.imageUrl" [alt]="product.name" />
            <div class="font-medium">{{ product.name }}</div>
            <div class="text-sm text-gray-500">{{ product.category }}</div>
            <app-product-price [product]="product"></app-product-price>
            <div class="flex gap-2 mt-2">
                <button mat-stroked-button color="primary" (click)="edit.emit(product)"><mat-icon>edit</mat-icon> Edit</button>
                <button mat-stroked-button color="warn" (click)="remove.emit(product)"><mat-icon>delete</mat-icon> Delete</button>
            </div>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProductCardComponent {
    @Input() product: Product;
    @Output() edit = new EventEmitter<Product>();
    @Output() remove = new EventEmitter<Product>();
}


