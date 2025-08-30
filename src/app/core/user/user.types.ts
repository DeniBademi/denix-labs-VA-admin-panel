export interface User {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    status?: string;
    role: string;
    permissions: string[];
}

export type Permission =
    | 'view_dashboard'
    | 'view_agent'
    | 'edit_agent'
    | 'view_products'
    | 'create_product'
    | 'edit_product'
    | 'delete_product'
    | 'view_marketing'
    | 'create_campaign'
    | 'delete_campaign'
    | 'view_users'
    | 'create_user'
    | 'edit_user'
    | 'delete_user';
