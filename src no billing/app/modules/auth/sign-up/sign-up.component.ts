import { isPlatformBrowser } from '@angular/common';
import { AfterViewInit, Component, inject, OnInit, PLATFORM_ID, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { AuthService } from 'app/core/auth/auth.service';
import { environment } from '../../../../../environments/environment';

declare var particlesJS: any;

@Component({
    selector: 'auth-sign-up',
    templateUrl: './sign-up.component.html',
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
export class AuthSignUpComponent implements OnInit, AfterViewInit {
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;
    captchaToken: string = '';
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signUpForm: UntypedFormGroup;
    showAlert: boolean = false;
    private readonly platform_id = inject(PLATFORM_ID);
    /**
     * Constructor
     */
    constructor(
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
        this.signUpForm = this._formBuilder.group({
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            company: [''],
            agreements: ['', Validators.requiredTrue],
            captchaToken: ['', Validators.required],
        });

        if (isPlatformBrowser(this.platform_id)) {
            particlesJS.load('particles-js', '/js/particlesjs-config.json', null);
        }
    }

    /**
     * After view init
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
                    this.signUpForm.get('captchaToken')?.setValue(token);
                },
                'expired-callback': () => {
                    this.captchaToken = '';
                    this.signUpForm.get('captchaToken')?.reset();
                },
                'error-callback': () => {
                    this.captchaToken = '';
                    this.signUpForm.get('captchaToken')?.reset();
                },
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
     * Sign up
     */
    signUp(): void {
        // Do nothing if the form is invalid
        if (this.signUpForm.invalid) {
            return;
        }

        // Disable the form
        this.signUpForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Sign up
        this._authService.signUp(this.signUpForm.value).subscribe(
            (response) => {
                // Navigate to the confirmation required page
                this._router.navigateByUrl('/confirmation-required');
            },
            (response) => {
                // Re-enable the form
                this.signUpForm.enable();

                // Reset the form
                this.signUpNgForm.resetForm();

                // Set the alert
                this.alert = {
                    type: 'error',
                    message: 'Something went wrong, please try again.',
                };

                // Show the alert
                this.showAlert = true;
            }
        );
    }
}
