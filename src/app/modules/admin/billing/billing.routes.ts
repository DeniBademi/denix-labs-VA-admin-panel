import { Route } from '@angular/router';

export default [
    {
        path     : '',
        loadComponent: () => import('./billing.component').then(m => m.BillingComponent)
    }
] as Route[];


