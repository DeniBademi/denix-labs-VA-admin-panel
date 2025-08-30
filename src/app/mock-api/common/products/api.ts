import { Injectable } from '@angular/core';
import { FuseMockApiService } from '@fuse/lib/mock-api';
import { categories as categoriesData, products as productsData } from 'app/mock-api/common/products/data';
import { Product, ProductFilter } from 'app/modules/admin/products/products.types';
import { assign, cloneDeep } from 'lodash-es';

@Injectable({providedIn: 'root'})
export class ProductsMockApi {
    private _categories: any[] = categoriesData;
    private _products: any[] = productsData;

    /**
     * Constructor
     */
    constructor(private _fuseMockApiService: FuseMockApiService) {
        // Register Mock API handlers
        this.registerHandlers();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Register Mock API handlers
     */
    registerHandlers(): void {
        // -----------------------------------------------------------------------------------------------------
        // @ Categories - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/products/categories')
            .reply(() => [200, cloneDeep(this._categories)]);

        // -----------------------------------------------------------------------------------------------------
        // @ Categories - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/products/categories')
            .reply(({request}) => {
                const category = request.body.category;

                category.id = category.id || this._generateId();
                this._categories.push(category);

                return [200, cloneDeep(category)];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Categories - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/products/categories/:id')
            .reply(({request}) => {
                const id = request.params.get('id');
                const category = request.body.category;

                const index = this._categories.findIndex(item => item.id === id);
                this._categories[index] = assign({}, this._categories[index], category);

                return [200, cloneDeep(this._categories[index])];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Categories - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/products/categories/:id')
            .reply(({request}) => {
                const id = request.params.get('id');

                const index = this._categories.findIndex(item => item.id === id);
                this._categories.splice(index, 1);

                return [200, true];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Products - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/products')
            .reply(({request}) => {
                // Get the filter parameters
                const search = request.params.get('search')?.toLowerCase();
                const category = request.params.get('category');
                const minPrice = parseFloat(request.params.get('minPrice') || '0');
                const maxPrice = parseFloat(request.params.get('maxPrice') || '999999');
                const inStock = request.params.get('inStock') === 'true';
                const onSale = request.params.get('onSale') === 'true';
                const sortBy = request.params.get('sortBy') || 'name';
                const sortDirection = request.params.get('sortDirection') || 'asc';
                const page = parseInt(request.params.get('page') || '0', 10);
                const limit = parseInt(request.params.get('limit') || '10', 10);

                // Clone the products
                let products = cloneDeep(this._products);

                // Filter by search term
                if (search) {
                    products = products.filter(product =>
                        product.name.toLowerCase().includes(search) ||
                        product.description.toLowerCase().includes(search) ||
                        product.sku.toLowerCase().includes(search)
                    );
                }

                // Filter by category
                if (category) {
                    products = products.filter(product => product.category === category);
                }

                // Filter by price
                products = products.filter(product =>
                    product.price >= minPrice && product.price <= maxPrice
                );

                // Filter by stock
                if (inStock) {
                    products = products.filter(product => product.stock > 0);
                }

                // Filter by sale
                if (onSale) {
                    products = products.filter(product => product.salePrice !== undefined);
                }

                // Sort products
                products.sort((a, b) => {
                    let compareResult = 0;
                    switch (sortBy) {
                        case 'price':
                            compareResult = a.price - b.price;
                            break;
                        case 'createdAt':
                            compareResult = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                            break;
                        case 'updatedAt':
                            compareResult = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
                            break;
                        default:
                            compareResult = a.name.localeCompare(b.name);
                    }
                    return sortDirection === 'asc' ? compareResult : -compareResult;
                });

                // Paginate products
                const start = page * limit;
                const paginatedProducts = products.slice(start, start + limit);

                return [200, {
                    products: paginatedProducts,
                    total: products.length,
                    page,
                    limit
                }];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Product - GET
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onGet('api/products/:id')
            .reply(({request}) => {
                const id = request.params.get('id');
                const product = this._products.find(item => item.id === id);

                return [200, cloneDeep(product)];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Product - POST
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPost('api/products')
            .reply(({request}) => {
                const product = request.body.product;

                product.id = this._generateId();
                product.createdAt = new Date().toISOString();
                product.updatedAt = new Date().toISOString();

                this._products.push(product);

                return [200, cloneDeep(product)];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Product - PATCH
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onPatch('api/products/:id')
            .reply(({request}) => {
                const id = request.params.get('id');
                const product = request.body.product;

                const index = this._products.findIndex(item => item.id === id);

                product.updatedAt = new Date().toISOString();
                this._products[index] = assign({}, this._products[index], product);

                return [200, cloneDeep(this._products[index])];
            });

        // -----------------------------------------------------------------------------------------------------
        // @ Product - DELETE
        // -----------------------------------------------------------------------------------------------------
        this._fuseMockApiService
            .onDelete('api/products/:id')
            .reply(({request}) => {
                const id = request.params.get('id');

                const index = this._products.findIndex(item => item.id === id);
                this._products.splice(index, 1);

                return [200, true];
            });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Generate a new ID
     */
    private _generateId(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        let id = '';

        for (let i = 0; i < 8; i++) {
            id += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        return id;
    }
}
