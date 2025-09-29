/* eslint-disable */
import { Campaign } from 'app/modules/admin/marketing/marketing.types';

export const campaigns: Campaign[] = [
    {
        id: '1',
        name: 'Summer Sale 2024',
        bannerUrl: 'assets/images/marketing/summer-sale-banner.jpg',
        forwardUrl: '/sale',
        status: 'scheduled',
        startDate: '2024-06-01T00:00:00Z',
        endDate: '2024-06-30T23:59:59Z',
        targetCategories: ['Clothing/Men', 'Clothing/Women']
    },
    {
        id: '2',
        name: 'New Collection Launch',
        bannerUrl: 'assets/images/marketing/new-collection-banner.jpg',
        forwardUrl: '/new-arrivals',
        status: 'active',
        startDate: '2024-02-01T00:00:00Z',
        endDate: '2024-02-28T23:59:59Z',
        targetProducts: ['1', '2', '3', '4']
    },
    {
        id: '3',
        name: 'Holiday Special',
        bannerUrl: 'assets/images/marketing/holiday-banner.jpg',
        forwardUrl: '/holiday-deals',
        status: 'draft',
        startDate: '2024-12-01T00:00:00Z',
        endDate: '2024-12-31T23:59:59Z',
        targetCategories: ['Accessories/Watches', 'Accessories/Jewelry']
    }
];