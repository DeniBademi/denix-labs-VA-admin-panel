import { Routes } from '@angular/router';
import { DashboardComponent } from './dashboard.component';
import { RoleGuard } from 'app/core/auth/guards/role.guard';

export default [
    {
        path: '',
        component: DashboardComponent,
        canActivate: [RoleGuard],
        data: {
            permissions: ['view_dashboard']
        }
    }
] as Routes;