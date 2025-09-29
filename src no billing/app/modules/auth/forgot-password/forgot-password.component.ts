import { isPlatformBrowser } from '@angular/common';
import { Component, inject, OnInit, PLATFORM_ID, ViewChild, ViewEncapsulation, AfterViewInit } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { finalize } from 'rxjs';
import { environment } from '../../../../../environments/environment';

declare global {
    interface Window {
        turnstile?: any;
    }
}

declare var particlesJS: any;

@Component({
    selector: 'auth-forgot-password',
    templateUrl: './forgot-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    imports: [
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatProgressSpinnerModule,
        RouterLink,
    ],
})
export class AuthForgotPasswordComponent implements OnInit, AfterViewInit {
    @ViewChild('forgotPasswordNgForm') forgotPasswordNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    forgotPasswordForm: UntypedFormGroup;
    captchaToken: string = '';
    showAlert: boolean = false;
    private readonly platform_id = inject(PLATFORM_ID);
    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.forgotPasswordForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            captchaToken: ['', Validators.required],
        });

        if (isPlatformBrowser(this.platform_id)) {
            particlesJS.load('particles-js', '/js/particlesjs-config.json', null);
          }
    }

    /**
     * After view init: render Cloudflare Turnstile
     */
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
                    this.forgotPasswordForm.get('captchaToken')?.setValue(token);
                },
                'expired-callback': () => {
                    this.captchaToken = '';
                    this.forgotPasswordForm.get('captchaToken')?.reset();
                },
                'error-callback': () => {
                    this.captchaToken = '';
                    this.forgotPasswordForm.get('captchaToken')?.reset();
                },
            });
        };

        if (window.turnstile) {
            renderTurnstile();
        } else {
            const interval = setInterval(() => {
                if (window.turnstile) {
                    clearInterval(interval);
                    renderTurnstile();
                }
            }, 100);
            setTimeout(() => clearInterval(interval), 10000);
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Send the reset link
     */
    sendResetLink(): void {
        // Return if the form is invalid
        if (this.forgotPasswordForm.invalid) {
            return;
        }

        // Disable the form
        this.forgotPasswordForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Forgot password
        this._authService
            .forgotPassword(this.forgotPasswordForm.get('email').value, this.captchaToken)
            .pipe(
                finalize(() => {
                    // Re-enable the form
                    this.forgotPasswordForm.enable();

                    // Reset the form
                    this.forgotPasswordNgForm.resetForm();

                    // Show the alert
                    this.showAlert = true;
                })
            )
            .subscribe(
                (response) => {
                    // Set the alert
                    this.alert = {
                        type: 'success',
                        message:
                            "Password reset sent! You'll receive an email if you are registered on our system.",
                    };
                },
                (response) => {
                    // Set the alert
                    this.alert = {
                        type: 'error',
                        message:
                            'Email does not found! Are you sure you are already a member?',
                    };
                }
            );
    }
}
