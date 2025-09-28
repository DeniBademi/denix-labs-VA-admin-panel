import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { ProductPriceComponent } from './components/product-price/product-price.component';
import { MatDialog } from '@angular/material/dialog';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Category, Product, ProductFilter } from './products.types';
import { ProductDialogComponent } from './product-dialog/product-dialog.component';
import { CsvImportDialogComponent } from './csv-import-dialog/csv-import-dialog.component';
import { CategoryDialogComponent } from './category-dialog/category-dialog.component';
import { ProductsService } from './products.service';
import { Subject, takeUntil } from 'rxjs';
import { HasPermissionDirective } from 'app/core/auth/directives/has-permission.directive';
import { ActivatedRoute } from '@angular/router';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-products',
    templateUrl: './products.component.html',
    styleUrls: ['./products.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatSelectModule,
        MatSortModule,
        MatTableModule,
        MatTooltipModule,
        MatCheckboxModule,
        ProductPriceComponent,
        HasPermissionDirective
    ]
})
export class ProductsComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    categories: Category[] = [];
    dataSource: MatTableDataSource<Product> = new MatTableDataSource();
    displayedColumns: string[] = ['image', 'sku', 'name', 'category', 'price', 'actions'];
    total = undefined;

    filter: ProductFilter = {
        search: '',
        category: '',
        minPrice: null,
        maxPrice: null,
        onSale: false,
        sortBy: 'name',
        sortDirection: 'asc',
        page: 0,
        limit: 10
    };

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _productsService: ProductsService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _dialog: MatDialog,
        private _route: ActivatedRoute
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

        // React to agent_id route changes
        this._route.paramMap
            .pipe(
                map((pm) => pm.get('agent_id')),
                distinctUntilChanged(),
            )
            .subscribe((agentId) => {
                this._productsService.setAgentId(agentId);
                // Refresh lists for the new agent
                this._productsService.getCategories().subscribe();
                this.filter.page = 0;
                this.getProducts();
            });
        // Get categories
        this._productsService.categories$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((categories: Category[]) => {
                this.categories = this._buildCategoryTree(categories);
            });

        // Get products
        this._productsService.products$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((products: Product[]) => {
                // Update the data source
                this.dataSource = new MatTableDataSource(products);
                // Do not attach MatPaginator for server-side paging to avoid it overriding total length
                this.dataSource.sort = this.sort;
            });

        // Track pagination to bind total length properly
        this._productsService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pg) => {
                this.total = pg.total ?? this.dataSource.data.length;
                // Keep filter in sync with service response
                if (pg.limit !== undefined) this.filter.limit = pg.limit;
                if (pg.page !== undefined) this.filter.page = pg.page;
            });

        // Initial load happens via the paramMap subscription
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get products with current filter
     */
    getProducts(): void {
        this._productsService.getProducts(this.filter).subscribe();
    }

    /**
     * Handle paginator events to keep server-side pagination in sync
     */
    onPage(event: { pageIndex: number; pageSize: number }): void {
        this.filter.page = event.pageIndex;
        this.filter.limit = event.pageSize;
        this.getProducts();
    }

    /**
     * Filter products
     */
    filterProducts(): void {
        this.filter.page = 0;
        this.getProducts();
    }

    /**
     * Reset filter
     */
    resetFilter(): void {
        this.filter = {
            search: '',
            category: '',
            minPrice: null,
            maxPrice: null,
            onSale: false,
            sortBy: 'name',
            sortDirection: 'asc',
            page: 0,
            limit: 10
        };
        this.getProducts();
    }

    /**
     * Open category dialog
     */
    openCategoryDialog(): void {
        const dialogRef = this._dialog.open(CategoryDialogComponent, {
            data: { categories: this.categories },
            width: '1000px',
            maxHeight: '90vh',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                // Refresh categories
                this._productsService.getCategories().subscribe();
            }
        });
    }

    /**
     * Open CSV import dialog
     */
    openCsvImportDialog(): void {
        const dialogRef = this._dialog.open(CsvImportDialogComponent, {
            width: '800px',
            maxHeight: '90vh',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                // Show success message with import results
                this._fuseConfirmationService.open({
                    title: 'Import Complete',
                    message: `Successfully imported ${result.imported} products. ${result.failed} products failed to import.`,
                    actions: {
                        confirm: {
                            show: false
                        },
                        cancel: {
                            show: true,
                            label: 'OK'
                        }
                    }
                });

                // Refresh products list
                this.getProducts();
            }
        });
    }

    /**
     * Open product dialog
     */
    openProductDialog(product?: Product): void {
        const dialogRef = this._dialog.open(ProductDialogComponent, {
            data: { product },
            width: '800px',
            maxHeight: '90vh',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.getProducts();
            }
        });
    }

    /**
     * Delete product
     */
    deleteProduct(product: Product): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete product',
            message: 'Are you sure you want to delete this product? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this._productsService.deleteProduct(product.id).subscribe();
            }
        });
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