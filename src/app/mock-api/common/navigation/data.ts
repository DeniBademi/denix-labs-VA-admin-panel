/* eslint-disable */
import { FuseNavigationItem } from '@fuse/components/navigation';

export const defaultNavigation: FuseNavigationItem[] = [
    {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'basic',
        icon: 'heroicons_outline:chart-bar',
        link: '/dashboard',
    },
    {
        id: 'agent',
        title: 'Agent Configuration',
        type: 'basic',
        icon: 'heroicons_outline:cog-8-tooth',
        link: '/agent',
    },
    {
        id: 'products',
        title: 'Product Catalog',
        type: 'basic',
        icon: 'heroicons_outline:shopping-bag',
        link: '/products',
    },
    {
        id: 'marketing',
        title: 'Marketing Campaigns',
        type: 'basic',
        icon: 'heroicons_outline:megaphone',
        link: '/marketing',
    },
    {
        id: 'users',
        title: 'User Management',
        type: 'basic',
        icon: 'heroicons_outline:users',
        link: '/users',
    },
    {
        id: 'qr-codes',
        title: 'QR Codes',
        type: 'basic',
        icon: 'heroicons_outline:qr-code',
        link: '/qr-codes',
    }
];

export const compactNavigation: FuseNavigationItem[] = defaultNavigation;

export const futuristicNavigation: FuseNavigationItem[] = defaultNavigation;

export const horizontalNavigation: FuseNavigationItem[] = defaultNavigation;