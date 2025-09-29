import { Route } from '@angular/router';
import { callDetailResolver } from './call-detail.resolver';

export default [
    {
        path     : '',
        loadComponent: () => import('./calls.component').then(m => m.CallsComponent)
    },
    {
        path     : ':id',
        loadComponent: () => import('./call-detail.component').then(m => m.CallDetailComponent),
        resolve: { data: callDetailResolver }
    }
] as Route[];


