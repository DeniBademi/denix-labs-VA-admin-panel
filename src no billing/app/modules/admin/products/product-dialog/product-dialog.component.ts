import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { Category, Product } from '../products.types';
import { ProductsService } from '../products.service';
import { MatDividerModule } from '@angular/material/divider';
import { ImageGalleryComponent } from '../components/image-gallery/image-gallery.component';

@Component({
    selector: 'app-product-dialog',
    templateUrl: './product-dialog.component.html',
    styleUrls: ['./product-dialog.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatChipsModule,
        MatDividerModule,
        ImageGalleryComponent
    ]
})
export class ProductDialogComponent implements OnInit {
    categories: Category[] = [];
    productForm: FormGroup;
    isEdit = false;

    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) private _data: { product: Product },
        private _dialogRef: MatDialogRef<ProductDialogComponent>,
        private _formBuilder: FormBuilder,
        private _productsService: ProductsService
    ) {
        this.isEdit = !!this._data?.product;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the product form
        this.productForm = this._formBuilder.group({
            id: [this._data?.product?.id],
            sku: [this._data?.product?.sku || '', [Validators.required]],
            name: [this._data?.product?.name || '', [Validators.required]],
            description: [this._data?.product?.description || '', [Validators.required]],
            imageUrl: [this._data?.product?.imageUrl || '', [Validators.required]],
            photos: this._formBuilder.array(this._data?.product?.photos || []),
            category: [this._data?.product?.category || '', [Validators.required]],
            price: [this._data?.product?.price || '', [Validators.required, Validators.min(0)]],
            salePrice: [this._data?.product?.salePrice || ''],
            attributes: this._formBuilder.group(this._data?.product?.attributes || {})
        });

        // Get categories
        this._productsService.categories$.subscribe((categories) => {
            this.categories = this._buildCategoryTree(categories);
        });
        this._productsService.getCategories().subscribe();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get photos form array
     */
    get photos(): FormArray {
        return this.productForm.get('photos') as FormArray;
    }

    /**
     * Build a gallery url list from imageUrl + photos
     */
    get galleryUrls(): string[] {
        const urls: string[] = [];
        const main = this.productForm?.get('imageUrl')?.value;
        if (main) urls.push(main);
        const arr = this.photos?.value as string[];
        if (Array.isArray(arr)) {
            for (const u of arr) {
                if (u) urls.push(u);
            }
        }
        return urls;
    }

    /**
     * Add photo
     */
    addPhoto(url: string): void {
        this.photos.push(this._formBuilder.control(url));
    }

    /**
     * Remove photo
     */
    removePhoto(index: number): void {
        this.photos.removeAt(index);
    }

    /**
     * Add attribute
     */
    addAttribute(key: string, value: string): void {
        const attributes = this.productForm.get('attributes') as FormGroup;
        attributes.addControl(key, this._formBuilder.control(value));
    }

    /**
     * Remove attribute
     */
    removeAttribute(key: string): void {
        const attributes = this.productForm.get('attributes') as FormGroup;
        attributes.removeControl(key);
    }

    /**
     * Save product
     */
    saveProduct(): void {
        if (this.productForm.invalid) {
            return;
        }

        const productData = this.productForm.value;

        // Remove empty sale price
        if (!productData.salePrice) {
            delete productData.salePrice;
        }

        if (this.isEdit) {
            this._productsService.updateProduct(productData.id, productData).subscribe(() => {
                this._dialogRef.close();
            });
        } else {
            this._productsService.createProduct(productData).subscribe(() => {
                this._dialogRef.close();
            });
        }
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Build category tree
     */
    private _buildCategoryTree(categories: Category[]): Category[] {
        const categoryMap = new Map<string, Category>();
        const rootCategories: Category[] = [];

        // Create a map of categories by ID
        categories.forEach(category => {
            categoryMap.set(category.id, { ...category, children: [] });
        });

        // Build the tree structure
        categories.forEach(category => {
            if (category.parentId) {
                const parent = categoryMap.get(category.parentId);
                if (parent) {
                    parent.children.push(categoryMap.get(category.id));
                }
            } else {
                rootCategories.push(categoryMap.get(category.id));
            }
        });

        return rootCategories;
    }
}
