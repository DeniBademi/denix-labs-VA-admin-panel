import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Campaign, CampaignStatus } from '../marketing.types';
import { MarketingService } from '../marketing.service';
import { ProductsService } from '../../products/products.service';
import { Category, Product } from '../../products/products.types';
import { MatChipsModule } from '@angular/material/chips';
import { MatListModule } from '@angular/material/list';

@Component({
    selector: 'app-campaign-dialog',
    templateUrl: './campaign-dialog.component.html',
    styleUrls: ['./campaign-dialog.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatDatepickerModule,
        MatNativeDateModule,
        MatChipsModule,
        MatListModule
    ]
})
export class CampaignDialogComponent implements OnInit {
    campaignForm: FormGroup;
    categories: Category[] = [];
    products: Product[] = [];
    filteredProducts: Product[] = [];
    productSearchQuery = '';
    expandedCategories = new Set<string>();
    isEdit = false;

    readonly statusOptions: { value: CampaignStatus; label: string }[] = [
        { value: 'draft', label: 'Draft' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
        { value: 'completed', label: 'Completed' }
    ];

    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) private _data: { campaign: Campaign },
        private _dialogRef: MatDialogRef<CampaignDialogComponent>,
        private _formBuilder: FormBuilder,
        private _marketingService: MarketingService,
        private _productsService: ProductsService
    ) {
        this.isEdit = !!this._data?.campaign;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the campaign form
        this.campaignForm = this._formBuilder.group({
            id: [this._data?.campaign?.id],
            name: [this._data?.campaign?.name || '', [Validators.required]],
            bannerUrl: [this._data?.campaign?.bannerUrl || '', [Validators.required]],
            forwardUrl: [this._data?.campaign?.forwardUrl || '', [Validators.required]],
            status: [this._data?.campaign?.status || 'draft', [Validators.required]],
            startDate: [this._data?.campaign?.startDate || '', [Validators.required]],
            endDate: [this._data?.campaign?.endDate || '', [Validators.required]],
            targetCategories: [this._data?.campaign?.targetCategories || []],
            targetProducts: [this._data?.campaign?.targetProducts || []]
        }, {
            validators: [
                // At least one targeting option must be selected
                (group: FormGroup) => {
                    const categories = group.get('targetCategories').value;
                    const products = group.get('targetProducts').value;
                    return (categories?.length || products?.length) ? null : { noTargeting: true };
                }
            ]
        });

        // Get categories
        this._productsService.categories$.subscribe((categories) => {
            this.categories = this._buildCategoryTree(categories);
        });
        this._productsService.getCategories().subscribe();

        // Get products
        this._productsService.products$.subscribe((products) => {
            this.products = products;
            this.filteredProducts = products;
        });
        this._productsService.getProducts().subscribe();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Toggle category expansion
     */
    toggleCategory(category: Category): void {
        const id = category.id;
        if (this.expandedCategories.has(id)) {
            this.expandedCategories.delete(id);
        } else {
            this.expandedCategories.add(id);
        }
    }

    /**
     * Check if category is expanded
     */
    isCategoryExpanded(category: Category): boolean {
        return this.expandedCategories.has(category.id);
    }

    /**
     * Check if parent category is selected
     */
    isParentSelected(path: string): boolean {
        const selectedPaths = this.campaignForm.get('targetCategories').value || [];
        return selectedPaths.includes(path);
    }

    /**
     * Handle category selection change
     */
    onCategorySelectionChange(event: any, category: Category): void {
        if (event.selected) {
            // Select all children
            const allPaths = this._getAllChildrenPaths(category);
            const currentPaths = this.campaignForm.get('targetCategories').value || [];
            this.campaignForm.get('targetCategories').setValue([...new Set([...currentPaths, ...allPaths])]);
        } else {
            // Deselect all children
            const allPaths = this._getAllChildrenPaths(category);
            const currentPaths = this.campaignForm.get('targetCategories').value || [];
            this.campaignForm.get('targetCategories').setValue(currentPaths.filter(path => !allPaths.includes(path)));
        }
    }

    /**
     * Select all categories
     */
    selectAllCategories(): void {
        const allPaths = this._getAllCategoryPaths(this.categories);
        this.campaignForm.get('targetCategories').setValue(allPaths);
    }

    /**
     * Remove category
     */
    removeCategory(path: string): void {
        const currentPaths = this.campaignForm.get('targetCategories').value || [];
        this.campaignForm.get('targetCategories').setValue(currentPaths.filter(p => p !== path));
    }

    /**
     * Get category name from path
     */
    getCategoryName(path: string): string {
        return path.split('/').pop();
    }

    /**
     * Filter products
     */
    filterProducts(query: string): void {
        this.productSearchQuery = query;
        if (!query) {
            this.filteredProducts = this.products;
            return;
        }

        const searchTerm = query.toLowerCase();
        this.filteredProducts = this.products.filter(product =>
            product.name.toLowerCase().includes(searchTerm) ||
            product.category.toLowerCase().includes(searchTerm)
        );
    }

    /**
     * Select all filtered products
     */
    selectAllFilteredProducts(): void {
        const currentIds = this.campaignForm.get('targetProducts').value || [];
        const newIds = this.filteredProducts.map(p => p.id);
        this.campaignForm.get('targetProducts').setValue([...new Set([...currentIds, ...newIds])]);
    }

    /**
     * Remove product
     */
    removeProduct(id: string): void {
        const currentIds = this.campaignForm.get('targetProducts').value || [];
        this.campaignForm.get('targetProducts').setValue(currentIds.filter(p => p !== id));
    }

    /**
     * Get product name by id
     */
    getProductName(id: string): string {
        return this.products.find(p => p.id === id)?.name || id;
    }

    /**
     * Save campaign
     */
    saveCampaign(): void {
        if (this.campaignForm.invalid) {
            return;
        }

        const campaignData = this.campaignForm.value;

        // Remove empty arrays
        if (!campaignData.targetCategories?.length) {
            delete campaignData.targetCategories;
        }
        if (!campaignData.targetProducts?.length) {
            delete campaignData.targetProducts;
        }

        // Format dates
        campaignData.startDate = new Date(campaignData.startDate).toISOString();
        campaignData.endDate = new Date(campaignData.endDate).toISOString();

        if (this.isEdit) {
            this._marketingService.updateCampaign(campaignData.id, campaignData).subscribe(() => {
                this._dialogRef.close(true);
            });
        } else {
            this._marketingService.createCampaign(campaignData).subscribe(() => {
                this._dialogRef.close(true);
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
     * Get all children paths
     */
    private _getAllChildrenPaths(category: Category): string[] {
        const paths = [category.path];
        if (category.children) {
            category.children.forEach(child => {
                paths.push(...this._getAllChildrenPaths(child));
            });
        }
        return paths;
    }

    /**
     * Get all category paths
     */
    private _getAllCategoryPaths(categories: Category[]): string[] {
        const paths = [];
        categories.forEach(category => {
            paths.push(...this._getAllChildrenPaths(category));
        });
        return paths;
    }

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
