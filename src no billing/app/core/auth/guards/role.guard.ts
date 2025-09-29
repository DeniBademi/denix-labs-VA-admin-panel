import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { of, switchMap } from 'rxjs';

export const RoleGuard: CanActivateFn | CanActivateChildFn = (route, state) => {
    const router: Router = inject(Router);
    const userService = inject(UserService);

    // Get required permissions from route data
    const requiredPermissions = route.data?.['permissions'] as string[];

    // Check authentication and permissions
    return inject(AuthService)
        .check()
        .pipe(
            switchMap((authenticated) => {
                // If the user is not authenticated...
                if (!authenticated) {
                    // Redirect to the sign-in page with a redirectUrl param
                    const redirectURL = state.url === '/sign-out' ? '' : `redirectURL=${state.url}`;
                    const urlTree = router.parseUrl(`sign-in?${redirectURL}`);
                    return of(urlTree);
                }
                console.log('checking permissions');
                // Get user permissions
                return userService.get().pipe(
                    switchMap((user) => {
                        // If no permissions are required, allow access
                        if (!requiredPermissions || requiredPermissions.length === 0) {
                            return of(true);
                        }

                        // Check if user has required permissions
                        const hasPermission = requiredPermissions.every(
                            (permission) => user.permissions?.includes(permission)
                        );

                        if (!hasPermission) {
                            // Redirect to dashboard or show error
                            return of(router.parseUrl('/dashboard'));
                        }

                        // Allow access
                        return of(true);
                    })
                );
            })
        );
};
