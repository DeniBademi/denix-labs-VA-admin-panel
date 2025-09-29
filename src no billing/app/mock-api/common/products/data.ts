/* eslint-disable */
import { Category, Product } from 'app/modules/admin/products/products.types';

export const categories: Category[] = [
    {
        id: 'clothing',
        name: 'Clothing',
        path: 'Clothing'
    },
    {
        id: 'clothing-men',
        name: 'Men',
        path: 'Clothing/Men',
        parentId: 'clothing'
    },
    {
        id: 'clothing-men-shirts',
        name: 'Shirts',
        path: 'Clothing/Men/Shirts',
        parentId: 'clothing-men'
    },
    {
        id: 'clothing-men-pants',
        name: 'Pants',
        path: 'Clothing/Men/Pants',
        parentId: 'clothing-men'
    },
    {
        id: 'clothing-women',
        name: 'Women',
        path: 'Clothing/Women',
        parentId: 'clothing'
    },
    {
        id: 'clothing-women-dresses',
        name: 'Dresses',
        path: 'Clothing/Women/Dresses',
        parentId: 'clothing-women'
    },
    {
        id: 'accessories',
        name: 'Accessories',
        path: 'Accessories'
    },
    {
        id: 'accessories-watches',
        name: 'Watches',
        path: 'Accessories/Watches',
        parentId: 'accessories'
    }
];

export const products: Product[] = [
    {
        id: '1',
        sku: 'MS-001',
        name: 'Classic Oxford Shirt',
        description: 'A timeless Oxford shirt perfect for any occasion.',
        imageUrl: 'assets/images/products/oxford-shirt.jpg',
        photos: [
            'assets/images/products/oxford-shirt-1.jpg',
            'assets/images/products/oxford-shirt-2.jpg'
        ],
        category: 'Clothing/Men/Shirts',
        price: 59.99,
        //stock: 100,
        attributes: {
            color: 'White',
            size: 'M',
            material: 'Cotton'
        },
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
    },
    {
        id: '2',
        sku: 'WD-001',
        name: 'Summer Floral Dress',
        description: 'A beautiful floral dress perfect for summer days.',
        imageUrl: 'assets/images/products/floral-dress.jpg',
        photos: [
            'assets/images/products/floral-dress-1.jpg',
            'assets/images/products/floral-dress-2.jpg'
        ],
        category: 'Clothing/Women/Dresses',
        price: 89.99,
        salePrice: 69.99,
        //stock: 50,
        attributes: {
            color: 'Blue',
            size: 'S',
            material: 'Cotton Blend'
        },
        createdAt: '2024-01-02T00:00:00Z',
        updatedAt: '2024-01-02T00:00:00Z'
    },
    {
        id: '3',
        sku: 'AW-001',
        name: 'Classic Chronograph Watch',
        description: 'A sophisticated chronograph watch for the modern gentleman.',
        imageUrl: 'assets/images/products/watch.jpg',
        photos: [
            'assets/images/products/watch-1.jpg',
            'assets/images/products/watch-2.jpg'
        ],
        category: 'Accessories/Watches',
        price: 299.99,
        //stock: 25,
        attributes: {
            color: 'Silver',
            material: 'Stainless Steel',
            waterResistant: true
        },
        createdAt: '2024-01-03T00:00:00Z',
        updatedAt: '2024-01-03T00:00:00Z'
    }
];
