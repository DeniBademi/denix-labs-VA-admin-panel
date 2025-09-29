import { Component, inject, OnInit, ViewChild, ViewEncapsulation, PLATFORM_ID, AfterViewInit } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { isPlatformBrowser } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { environment } from '../../../../../environments/environment';

declare var particlesJS: any;


declare global {
    interface Window {
        turnstile?: any;
    }
}

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    imports: [
        RouterLink,
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
    ],
})
export class AuthSignInComponent implements OnInit, AfterViewInit {
    @ViewChild('signInNgForm') signInNgForm: NgForm;
    captchaToken: string = '';
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;
    private readonly platform_id = inject(PLATFORM_ID);

    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.signInForm = this._formBuilder.group({
            email: [
                '',
                [Validators.required, Validators.email],
            ],
            password: ['', Validators.required],
            rememberMe: [''],
            captchaToken: ['', [Validators.required]],
        });

        if (isPlatformBrowser(this.platform_id)) {
            particlesJS.load('particles-js', '/js/particlesjs-config.json', null);
          }
    }

    ngAfterViewInit(): void {
        if (!isPlatformBrowser(this.platform_id)) {
            return;
        }
        const renderTurnstile = () => {
            const container = document.getElementById('turnstile-container');
            if (!container || !window.turnstile) {
                return;
            }
            window.turnstile.render(container, {
                sitekey: environment.turnstileSiteKey,
                theme: 'light',
                size: 'normal',
                callback: (token: string) => {
                    this.captchaToken = token;
                    this.signInForm.get('captchaToken')?.setValue(token);
                },
                'expired-callback': () => {
                    this.captchaToken = '';
                    this.signInForm.get('captchaToken')?.reset();
                },
                'error-callback': () => {
                    this.captchaToken = '';
                    this.signInForm.get('captchaToken')?.reset();
                }
            });
        };

        if (window.turnstile) {
            renderTurnstile();
        } else {
            // The Turnstile script loads async; wait for it
            const interval = setInterval(() => {
                if (window.turnstile) {
                    clearInterval(interval);
                    renderTurnstile();
                }
            }, 100);
            // Safety timeout
            setTimeout(() => clearInterval(interval), 10000);
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign in
     */
    signIn(): void {
        // Return if the form is invalid
        if (this.signInForm.invalid) {
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Sign in
        this._authService.signIn(this.signInForm.value, this.captchaToken).subscribe(
            () => {
                // Set the redirect url.
                // The '/signed-in-redirect' is a dummy url to catch the request and redirect the user
                // to the correct page after a successful sign in. This way, that url can be set via
                // routing file and we don't have to touch here.
                const redirectURL =
                    this._activatedRoute.snapshot.queryParamMap.get(
                        'redirectURL'
                    ) || '/signed-in-redirect';

                // Navigate to the redirect url
                this._router.navigateByUrl(redirectURL);
            },
            (response) => {
                // Re-enable the form
                this.signInForm.enable();

                // Reset the form
                this.signInNgForm.resetForm();

                // Set the alert
                this.alert = {
                    type: 'error',
                    message: 'Wrong email or password',
                };

                // Show the alert
                this.showAlert = true;
            }
        );
    }
}
