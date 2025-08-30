import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from, map, switchMap, tap, firstValueFrom } from 'rxjs';
import { SupabaseService } from 'app/core/supabase/supabase.service';
import * as XLSX from 'xlsx';
import { WorkspaceService } from 'app/core/workspace/workspace.service';
import { Category, Product, ProductFilter, ProductsResponse, CsvImportResult, CsvColumnMapping } from './products.types';

@Injectable({ providedIn: 'root' })
export class ProductsService {
    private _products: BehaviorSubject<Product[]> = new BehaviorSubject<Product[]>([]);
    private _categories: BehaviorSubject<Category[]> = new BehaviorSubject<Category[]>([]);
    private _pagination: BehaviorSubject<{ total: number; page: number; limit: number }> = new BehaviorSubject({
        total: 0,
        page: 0,
        limit: 10
    });

    /**
     * Constructor
     */
    constructor(
        private _supabase: SupabaseService,
        private _workspace: WorkspaceService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for products
     */
    get products$(): Observable<Product[]> {
        return this._products.asObservable();
    }

    /**
     * Getter for categories
     */
    get categories$(): Observable<Category[]> {
        return this._categories.asObservable();
    }

    /**
     * Getter for pagination
     */
    get pagination$(): Observable<{ total: number; page: number; limit: number }> {
        return this._pagination.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get products
     */
    getProducts(filter?: ProductFilter): Observable<ProductsResponse> {
        return from(this._workspace.getWorkspaceId()).pipe(
            map((wsId) => wsId),
            // Execute query
            // Using from(Promise) to keep Observable API
            // eslint-disable-next-line rxjs/no-ignored-observable
            switchMap((wsId) => {
                const supabase = this._supabase.getSupabase;
                let query = supabase
                    .from('products')
                    .select('*', { count: 'exact' })
                    .eq('workspace_id', wsId);

                if (filter?.search) {
                    query = query.ilike('name', `%${filter.search}%`);
                }
                if (filter?.category) {
                    query = query.eq('category_path', filter.category);
                }
                if (filter?.minPrice !== undefined && filter.minPrice !== null) {
                    query = query.gte('price', filter.minPrice);
                }
                if (filter?.maxPrice !== undefined && filter.maxPrice !== null) {
                    query = query.lte('price', filter.maxPrice);
                }
                // if (filter?.inStock !== undefined && filter.inStock !== null) {
                //     console.log('filter.inStock', filter.inStock);
                //     if (filter.inStock) {
                //         query = query.gt('stock', 0);
                //     } else {
                //         query = query.eq('stock', 0);
                //     }
                // }
                if (filter?.onSale !== undefined) {
                    if (filter.onSale) {
                        query = query.not('sale_price', 'is', null);
                    } else {
                        query = query.is('sale_price', null);
                    }
                }

                // Sorting
                const sortBy = filter?.sortBy ?? 'createdAt';
                const sortDir = (filter?.sortDirection ?? 'desc') === 'desc';
                const sortColumnMap: Record<string, string> = {
                    name: 'name',
                    price: 'price',
                    createdAt: 'created_at',
                    updatedAt: 'updated_at'
                };
                query = query.order(sortColumnMap[sortBy], { ascending: !sortDir });

                // Pagination
                const page = filter?.page ?? 0;
                const limit = filter?.limit ?? 10;
                const fromIdx = page * limit;
                const toIdx = fromIdx + limit - 1;
                query = query.range(fromIdx, toIdx);

                return from(query.then(({ data, count, error }) => {
                    if (error) throw error;
                    const products = (data ?? []).map(this._mapDbToProduct);
                    return {
                        products,
                        total: count ?? products.length,
                        page,
                        limit
                    } as ProductsResponse;
                }));
            }),
            tap((response) => {
                this._products.next(response.products);
                this._pagination.next({ total: response.total, page: response.page, limit: response.limit });
            })
        );
    }

    /**
     * Get product by id
     */
    getProduct(id: string): Observable<Product> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return this._mapDbToProduct(data);
        })());
    }

    /**
     * Create product
     */
    createProduct(product: Partial<Product>): Observable<Product> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const wsId = await this._workspace.getWorkspaceId();
            const payload = this._mapProductToDb(product);
            payload.workspace_id = wsId;
            const { data, error } = await supabase
                .from('products')
                .insert(payload)
                .select('*')
                .single();
            if (error) throw error;
            const mapped = this._mapDbToProduct(data);
            const products = this._products.value;
            this._products.next([...products, mapped]);
            return mapped;
        })());
    }

    /**
     * Update product
     */
    updateProduct(id: string, product: Partial<Product>): Observable<Product> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const payload = this._mapProductToDb(product);
            const { data, error } = await supabase
                .from('products')
                .update(payload)
                .eq('id', id)
                .select('*')
                .single();
            if (error) throw error;
            const mapped = this._mapDbToProduct(data);
            const products = this._products.value;
            const index = products.findIndex((item) => item.id === mapped.id);
            if (index !== -1) {
                products[index] = mapped;
                this._products.next([...products]);
            }
            return mapped;
        })());
    }

    /**
     * Delete product
     */
    deleteProduct(id: string): Observable<void> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);
            if (error) throw error;
            const products = this._products.value;
            const index = products.findIndex((item) => item.id === id);
            if (index !== -1) {
                products.splice(index, 1);
                this._products.next([...products]);
            }
        })());
    }

    /**
     * Get categories
     */
    getCategories(): Observable<Category[]> {
        return from(this._workspace.getWorkspaceId()).pipe(
            switchMap((wsId) => {
                const supabase = this._supabase.getSupabase;
                return from(
                    supabase
                        .from('categories')
                        .select('*')
                        .eq('workspace_id', wsId)
                        .order('path', { ascending: true })
                        .then(({ data, error }) => {
                            if (error) throw error;
                            return (data ?? []).map(this._mapDbToCategory);
                        })
                );
            }),
            tap((categories) => this._categories.next(categories))
        );
    }

    /**
     * Create category
     */
    createCategory(category: Partial<Category>): Observable<Category> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const wsId = await this._workspace.getWorkspaceId();
            const payload = this._mapCategoryToDb(category);
            payload.workspace_id = wsId;
            const { data, error } = await supabase
                .from('categories')
                .insert(payload)
                .select('*')
                .single();
            if (error) throw error;
            const created = this._mapDbToCategory(data);
            await firstValueFrom(this.getCategories());
            return created;
        })());
    }

    /**
     * Update category
     */
    updateCategory(id: string, category: Partial<Category>): Observable<Category> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const payload = this._mapCategoryToDb(category);
            const { data, error } = await supabase
                .from('categories')
                .update(payload)
                .eq('id', id)
                .select('*')
                .single();
            if (error) throw error;
            await firstValueFrom(this.getCategories());
            return this._mapDbToCategory(data);
        })());
    }

    /**
     * Delete category
     */
    deleteCategory(id: string): Observable<void> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const { error } = await supabase
                .from('categories')
                .delete()
                .eq('id', id);
            if (error) throw error;
            await firstValueFrom(this.getCategories());
        })());
    }

    /**
     * Import products from CSV/XLSX file
     */
    importProductsFromCsv(file: File, mapping: Partial<CsvColumnMapping>): Observable<CsvImportResult> {
        return from((async () => {
            const workspaceId = await this._workspace.getWorkspaceId();
            if (!workspaceId) {
                throw new Error('Workspace not set');
            }

            const fileNameLower = file.name.toLowerCase();
            const isCsv = fileNameLower.endsWith('.csv');

            // Read file into SheetJS workbook
            const workbook: XLSX.WorkBook = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onerror = () => reject(reader.error);
                reader.onload = () => {
                    try {
                        if (isCsv) {
                            const text = reader.result as string;
                            resolve(XLSX.read(text, { type: 'string' }));
                        } else {
                            const arrayBuffer = reader.result as ArrayBuffer;
                            resolve(XLSX.read(arrayBuffer, { type: 'array' }));
                        }
                    } catch (e) {
                        reject(e);
                    }
                };
                if (isCsv) {
                    reader.readAsText(file);
                } else {
                    reader.readAsArrayBuffer(file);
                }
            });

            // Use first worksheet
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            if (!worksheet) {
                throw new Error('No worksheet found in file');
            }

            // Convert to array of objects using first row as headers
            const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: false });

            // Nothing to import
            if (!rows.length) {
                return { total: 0, imported: 0, failed: 0, errors: [] } as CsvImportResult;
            }

            // Normalize provided mapping against available headers
            const availableHeaders = Object.keys(rows[0] ?? {});
            const normalizeHeader = (h?: string): string | undefined => {
                if (!h) return undefined;
                const target = h.toString().toLowerCase().trim();
                const idx = availableHeaders.findIndex((ah) => (ah ?? '').toString().toLowerCase().trim() === target);
                return idx >= 0 ? availableHeaders[idx] : undefined;
            };

            const headerMap: Record<string, string | undefined> = {
                sku: normalizeHeader(mapping.sku),
                name: normalizeHeader(mapping.name),
                description: normalizeHeader(mapping.description),
                imageUrl: normalizeHeader(mapping.imageUrl),
                photos: normalizeHeader(mapping.photos),
                category: normalizeHeader(mapping.category),
                price: normalizeHeader(mapping.price),
                salePrice: normalizeHeader(mapping.salePrice),
                attributes: normalizeHeader(mapping.attributes)
            };

            const errors: { row: number; message: string }[] = [];
            let imported = 0;

            // Upsert row-by-row to provide granular error reporting
            for (let idx = 0; idx < rows.length; idx++) {
                const row = rows[idx];

                // Extract values using header map
                const getVal = (key: string): any => {
                    const header = headerMap[key];
                    return header ? row[header] : undefined;
                };

                const skuRaw = getVal('sku');
                const nameRaw = getVal('name');
                const categoryRaw = getVal('category');
                const priceRaw = getVal('price');

                // Validate required fields presence in data
                if (!skuRaw || !nameRaw || !categoryRaw || priceRaw === undefined || priceRaw === null || priceRaw === '') {
                    errors.push({ row: idx + 2, message: 'Missing required field(s): sku, name, category, or price' });
                    continue;
                }

                const descriptionRaw = getVal('description') ?? '';
                const imageUrlRaw = getVal('imageUrl') ?? '';
                const photosRaw = getVal('photos') ?? '';
                const salePriceRaw = getVal('salePrice');
                const attributesRaw = getVal('attributes');

                // Normalize values
                const normalizeNumber = (val: any): number | undefined => {
                    if (val === undefined || val === null || val === '') return undefined;
                    const cleaned = String(val).replace(/[^0-9.,-]/g, '').replace(',', '.');
                    const n = Number(cleaned);
                    return isNaN(n) ? undefined : n;
                };

                const price = normalizeNumber(priceRaw);
                if (price === undefined) {
                    errors.push({ row: idx + 2, message: 'Invalid price' });
                    continue;
                }
                const salePrice = normalizeNumber(salePriceRaw);

                const photos: string[] = typeof photosRaw === 'string'
                    ? photosRaw.split(',').map((p) => p.trim()).filter((p) => p.length > 0)
                    : Array.isArray(photosRaw)
                        ? photosRaw.map((p) => String(p).trim()).filter((p) => p.length > 0)
                        : [];

                // Parse attributes JSON if provided (optional)
                let attributes: Record<string, any> = {};
                if (attributesRaw !== undefined && attributesRaw !== null && attributesRaw !== '') {
                    try {
                        const parsed = typeof attributesRaw === 'string' ? JSON.parse(attributesRaw) : attributesRaw;
                        if (parsed && typeof parsed === 'object') {
                            attributes = parsed as Record<string, any>;
                        }
                    } catch {
                        // Optional column; ignore JSON parse errors and continue with empty attributes
                    }
                }

                const payload: any = {
                    workspace_id: workspaceId,
                    sku: String(skuRaw).trim(),
                    name: String(nameRaw).trim(),
                    description: String(descriptionRaw ?? ''),
                    image_url: String(imageUrlRaw ?? ''),
                    photos,
                    category_path: String(categoryRaw).trim(),
                    price,
                    sale_price: salePrice !== undefined ? salePrice : null,
                    attributes
                };

                try {
                    const supabase = this._supabase.getSupabase;
                    const { error } = await supabase
                        .from('products')
                        .upsert(payload, { onConflict: 'workspace_id,sku' })
                        .select('id')
                        .single();
                    if (error) throw error;
                    imported += 1;
                } catch (e: any) {
                    errors.push({ row: idx + 2, message: e?.message ?? 'Failed to import row' });
                }
            }

            return {
                total: rows.length,
                imported,
                failed: errors.length,
                errors
            } as CsvImportResult;
        })());
    }

    /**
     * Export products to CSV
     */
    exportProductsToCsv(): Observable<Blob> {
        return from(Promise.reject(new Error('CSV export not implemented')));
    }

    private _mapDbToProduct = (row: any): Product => {
        return {
            id: row.id,
            sku: row.sku,
            name: row.name,
            description: row.description ?? '',
            imageUrl: row.image_url ?? '',
            photos: row.photos ?? [],
            category: row.category_path,
            price: Number(row.price),
            salePrice: row.sale_price !== null ? Number(row.sale_price) : undefined,
            attributes: row.attributes ?? {},
            createdAt: row.created_at,
            updatedAt: row.updated_at
        };
    };

    private _mapProductToDb = (product: Partial<Product>): any => {
        const payload: any = {};
        if (product.sku !== undefined) payload.sku = product.sku;
        if (product.name !== undefined) payload.name = product.name;
        if (product.description !== undefined) payload.description = product.description;
        if (product.imageUrl !== undefined) payload.image_url = product.imageUrl;
        if (product.photos !== undefined) payload.photos = product.photos;
        if (product.category !== undefined) payload.category_path = product.category;
        if (product.price !== undefined) payload.price = product.price;
        if (product.salePrice !== undefined) payload.sale_price = product.salePrice;
        if (product.attributes !== undefined) payload.attributes = product.attributes as any;
        return payload;
    };

    private _mapDbToCategory = (row: any): Category => {
        return {
            id: row.id,
            name: row.name,
            path: row.path,
            parentId: row.parent_id ?? undefined
        } as Category;
    };

    private _mapCategoryToDb = (category: Partial<Category>): any => {
        const payload: any = {};
        if (category.name !== undefined) payload.name = category.name;
        if (category.path !== undefined) payload.path = category.path;
        if (category.parentId !== undefined) payload.parent_id = category.parentId;
        return payload;
    };

    /**
     * Ensure category hierarchy exists for given category paths (e.g., "A/B/C").
     */
    ensureCategoriesForPaths(paths: string[]): Observable<void> {
        return from((async () => {
            const supabase = this._supabase.getSupabase;
            const wsId = await this._workspace.getWorkspaceId();
            if (!wsId) throw new Error('Workspace not set');

            // Load existing categories for workspace
            const { data: existingRows, error: loadErr } = await supabase
                .from('categories')
                .select('*')
                .eq('workspace_id', wsId);
            if (loadErr) throw loadErr;
            const pathToCategory: Map<string, any> = new Map<string, any>();
            for (const row of existingRows ?? []) {
                pathToCategory.set(row.path, row);
            }

            const uniquePaths = Array.from(new Set(paths.map((p) => String(p).trim()).filter((p) => p.length > 0)));

            for (const fullPath of uniquePaths) {
                const segments = fullPath.split('/').map((s) => s.trim()).filter((s) => s.length > 0);
                let parentId: string | undefined = undefined;
                let accumPath = '';
                for (let i = 0; i < segments.length; i++) {
                    accumPath = i === 0 ? segments[0] : `${accumPath}/${segments[i]}`;
                    if (!pathToCategory.has(accumPath)) {
                        const payload: any = {
                            workspace_id: wsId,
                            name: segments[i],
                            path: accumPath,
                            parent_id: parentId ?? null
                        };
                        const { data: created, error: insErr } = await supabase
                            .from('categories')
                            .insert(payload)
                            .select('*')
                            .single();
                        if (insErr) throw insErr;
                        pathToCategory.set(accumPath, created);
                        parentId = created.id;
                    } else {
                        parentId = (pathToCategory.get(accumPath) as any)?.id;
                    }
                }
            }

            // Refresh categories cache
            await firstValueFrom(this.getCategories());
        })());
    }
}
