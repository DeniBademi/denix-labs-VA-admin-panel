/* eslint-disable */
import { Role } from 'app/core/user/user.service';

export const roles: Role[] = [
    {
        id: 'admin',
        name: 'Administrator',
        permissions: [
            'view_dashboard',
            'view_agent',
            'edit_agent',
            'view_products',
            'create_product',
            'delete_product',
            'view_marketing',
            'create_campaign',
            'delete_campaign',
            'view_users',
            'create_user',
            'edit_user',
            'delete_user'
        ]
    },
    {
        id: 'user',
        name: 'Regular User',
        permissions: [
            'view_dashboard',
            'view_agent',
            'view_products',
            'view_marketing'
        ]
    },
    {
        id: 'manager',
        name: 'Store Manager',
        permissions: [
            'view_dashboard',
            'view_agent',
            'view_products',
            'create_product',
            'delete_product',
            'view_marketing',
            'create_campaign',
            'delete_campaign'
        ]
    }
];
