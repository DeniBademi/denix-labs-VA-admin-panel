/**
 * Product category interface
 */
export interface Category {
    id: string;
    name: string;
    path: string; // Full path including parent categories (e.g., "Clothing/Men/Shirts")
    parentId?: string;
    children?: Category[];
}

/**
 * Product interface
 */
export interface Product {
    id: string;
    sku: string;
    name: string;
    description: string;
    imageUrl: string;
    photos: string[]; // Additional product photos
    category: string; // Category path (e.g., "Clothing/Men/Shirts")
    price: number;
    salePrice?: number;
    attributes?: {
        [key: string]: string | number | boolean; // Dynamic attributes like size, color, etc.
    };
    createdAt: string;
    updatedAt: string;
}

/**
 * Product list response interface
 */
export interface ProductsResponse {
    products: Product[];
    total: number;
    page: number;
    limit: number;
}

/**
 * Product filter interface
 */
export interface ProductFilter {
    search?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    onSale?: boolean;
    sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt';
    sortDirection?: 'asc' | 'desc';
    page?: number;
    limit?: number;
}

/**
 * CSV import column mapping interface
 */
export interface CsvColumnMapping {
    sku: string;
    name: string;
    description: string;
    imageUrl: string;
    photos: string;
    category: string;
    price: string;
    salePrice?: string;
    stock: string;
    [key: string]: string | undefined; // Additional dynamic attribute mappings
}

/**
 * CSV import result interface
 */
export interface CsvImportResult {
    total: number;
    imported: number;
    failed: number;
    errors: {
        row: number;
        message: string;
    }[];
}
