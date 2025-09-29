import { Routes } from '@angular/router';
import { UsersComponent } from './users.component';

export default [
    {
        path: '',
        component: UsersComponent,
        data: { permissions: ['view_users'] }
    },
] as Routes;
