import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, ChangeDetectorRef, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, FormArray } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Options, DotType, CornerSquareType, CornerDotType, ShapeType, ErrorCorrectionLevel } from 'ngx-qrcode-styling';
import { QrAgentUrlComponent } from './components/agent-url/agent-url.component';
import { QrStylingFormComponent } from './components/styling-form/styling-form.component';
import { QrPreviewComponent } from './components/preview/preview.component';
//

@Component({
    selector: 'app-qr-codes',
    standalone: true,
    imports: [
    CommonModule,
    MatSnackBarModule,
    QrAgentUrlComponent,
    QrStylingFormComponent,
    QrPreviewComponent
],
    templateUrl: './qr-codes.component.html',
    styleUrls: ['./qr-codes.component.scss']
})
export class QrCodesComponent implements OnInit {

    // Child preview component reference
    @ViewChild(QrPreviewComponent) preview!: QrPreviewComponent;

    // Fixed agent URL
    public readonly AGENT_URL = "https://your-voice-agent-url.com";

    // Form for custom styling
    public qrForm: FormGroup;

    // Current QR code configuration
    public currentConfig: Options = {
        data: this.AGENT_URL,
        template: 'default',
        width: 300,
        height: 300
    };;


    // Available options for form controls
    public dotTypes = [
        { value: 'square' as DotType, label: 'Square' },
        { value: 'dots' as DotType, label: 'Dots' },
        { value: 'rounded' as DotType, label: 'Rounded' },
        { value: 'extra-rounded' as DotType, label: 'Extra Rounded' },
        { value: 'classy' as DotType, label: 'Classy' },
        { value: 'classy-rounded' as DotType, label: 'Classy Rounded' }
    ];

    public cornerSquareTypes = [
        { value: 'dot' as CornerSquareType, label: 'Dot' },
        { value: 'square' as CornerSquareType, label: 'Square' },
        { value: 'extra-rounded' as CornerSquareType, label: 'Extra Rounded' }
    ];

    public cornerDotTypes = [
        { value: 'dot' as CornerDotType, label: 'Dot' },
        { value: 'square' as CornerDotType, label: 'Square' }
    ];

    public colorTypes = [
        { value: 'single', label: 'Single Color' },
        { value: 'gradient', label: 'Color Gradient' }
    ];
    public errorCorrectionLevels = [
        { value: 'L' as ErrorCorrectionLevel, label: 'Low' },
        { value: 'M' as ErrorCorrectionLevel, label: 'Medium' },
        { value: 'Q' as ErrorCorrectionLevel, label: 'Quartile' },
        { value: 'H' as ErrorCorrectionLevel, label: 'High' }
    ];

    constructor(
        private _formBuilder: FormBuilder,
        private _cdr: ChangeDetectorRef,
        private _snackBar: MatSnackBar
    ) {

        this.qrForm = this._formBuilder.group({
            // Business Identity & Branding
            showLogo: [false],
                logoUrl: [''],
                logoSize: [0.4],
                logoMargin: [0],
                hideBackgroundDots: [true],
            // General Appearance
            size: [300],
            backgroundColor: ['#ffffff'],

            // Visual Styling
            dotStyle: ['square' as DotType],
            colorType: ['single'],
                dotColor: ['#000000FF'],
                dotGradient: this._formBuilder.group({
                    type: ['linear'],
                    rotation: [0],
                    colorStops: this._formBuilder.array([
                        this._formBuilder.group({
                            offset: [0],
                            color: ['#000000FF']
                        }),
                        this._formBuilder.group({
                            offset: [1],
                            color: ['#ff6b6b']
                        })
                    ])
                }),
            errorCorrectionLevel: ['H' as ErrorCorrectionLevel],

            // Professional Finishing
            cornerSquareType: ['square' as CornerSquareType],
            cornerSquareColorType: ['single'],
            cornerSquareColor: ['#000000FF'],
            cornerSquareGradient: this._formBuilder.group({
                type: ['linear'],
                rotation: [0],
                colorStops: this._formBuilder.array([
                    this._formBuilder.group({
                        offset: [0],
                        color: ['#000000FF']
                    }),
                    this._formBuilder.group({
                        offset: [1],
                        color: ['#ff6b6b']
                    })
                ])
            }),
            cornerDotType: ['square' as CornerDotType],
            cornerDotColorType: ['single'],
            cornerDotColor: ['#000000FF'],
            cornerDotGradient: this._formBuilder.group({
                type: ['linear'],
                rotation: [0],
                colorStops: this._formBuilder.array([
                    this._formBuilder.group({
                        offset: [0],
                        color: ['#000000FF']
                    }),
                    this._formBuilder.group({
                        offset: [1],
                        color: ['#ff6b6b']
                    })
                ])
            }),

            shape: ['circle' as ShapeType]
        });
        this.updateCustomConfig();


    }

    ngOnInit(): void {
        // Watch form changes to update QR code
        this.qrForm.valueChanges.subscribe((value) => {
            console.log('Form value changed:', value);
            // Use setTimeout to ensure the form value is fully updated
            setTimeout(() => {
                this.updateCustomConfig();
            }, 0);
        });

        // Also watch individual form controls for immediate feedback
        this.qrForm.get('size')?.valueChanges.subscribe(() => {
            console.log('Size changed, updating config...');
            this.updateCustomConfig();
        });

        this.qrForm.get('dotStyle')?.valueChanges.subscribe(() => {
            console.log('Dot style changed, updating config...');
            this.updateCustomConfig();
        });

        this.qrForm.get('dotColor')?.valueChanges.subscribe(() => {
            console.log('Dot color changed, updating config...');
            this.updateCustomConfig();
        });

        // Color mode toggles
        this.qrForm.get('colorType')?.valueChanges.subscribe(() => {
            this.updateCustomConfig();
        });
        this.qrForm.get('cornerSquareColorType')?.valueChanges.subscribe(() => {
            this.updateCustomConfig();
        });
        this.qrForm.get('cornerDotColorType')?.valueChanges.subscribe(() => {
            this.updateCustomConfig();
        });
    }

    /**
     * Update custom configuration based on form values
     */
    updateCustomConfig(): void {
        const formValue = this.qrForm.value;
        console.log('Form value changed:', formValue);

        const dotsColor = formValue.colorType === 'single' ? formValue.dotColor : null;
        const dotsGradient = formValue.colorType === 'gradient' ? formValue.dotGradient : null;
        const cornerSquareColor = formValue.cornerSquareColorType === 'single' ? formValue.cornerSquareColor : null;
        const cornerSquareGradient = formValue.cornerSquareColorType === 'gradient' ? formValue.cornerSquareGradient : null;
        const cornerDotColor = formValue.cornerDotColorType === 'single' ? formValue.cornerDotColor : null;
        const cornerDotGradient = formValue.cornerDotColorType === 'gradient' ? formValue.cornerDotGradient : null;

        const config: Options = {
            width: formValue.size,
            height: formValue.size,
            data: this.AGENT_URL,
            margin: 10,
            dotsOptions: {
                type: formValue.dotStyle,
                color: dotsColor,
                gradient: dotsGradient
            },
            cornersSquareOptions: {
                type: formValue.cornerSquareType,
                color: cornerSquareColor,
                gradient: cornerSquareGradient
            },
            cornersDotOptions: {
                type: formValue.cornerDotType,
                color: cornerDotColor,
                gradient: cornerDotGradient
            },
            backgroundOptions: {
                color: formValue.backgroundColor
            },
            qrOptions: {
                errorCorrectionLevel: formValue.errorCorrectionLevel
            }

        };

        // Add logo if enabled
        if (formValue.showLogo && formValue.logoUrl) {
            config.image = formValue.logoUrl;
            config.imageOptions = {
                hideBackgroundDots: formValue.hideBackgroundDots,
                imageSize: formValue.logoSize,
                crossOrigin: "anonymous",
                margin: formValue.logoMargin
            };
        }

        // Use the child component's update method instead of just updating the config
        if (this.preview) {
            this.preview.update(this.currentConfig, config).subscribe({
                next: (result) => {
                    console.log('QR code updated successfully:', result);
                    this.currentConfig = config;
                },
                error: (error) => {
                    console.error('Failed to update QR code:', error);
                }
            });
        } else {
            // Fallback to direct config update if child component not ready
            this.currentConfig = { ...config };
        }
    }

    /**
     * Download the QR code as an image using the child component's method
     */
    downloadQRCode(): void {
        const fileName = `qr-code-${Date.now()}.png`;
        this.preview.downloadImage(fileName).subscribe({
            next: (result) => {
                console.log('QR code downloaded successfully:', result);
                this._snackBar.open('QR code downloaded successfully', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'end'
                });
            },
            error: (error) => {
                console.error('Failed to download QR code:', error);
                this._snackBar.open('Failed to download QR code', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'end'
                });
             }
         });
    }



    /**
     * Copy the agent URL to clipboard
     */
    async copyAgentURL(): Promise<void> {
        try {
            await navigator.clipboard.writeText(this.AGENT_URL);

            // Optional: Show a brief success message
            // You could add a toast notification here if you have one
            this._snackBar.open('Agent URL copied to clipboard', 'Close', {
                duration: 3000,
                horizontalPosition: 'end'
            });
        } catch (error) {
            // Fallback for older browsers
            try {
                const textArea = document.createElement('textarea');
                textArea.value = this.AGENT_URL;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                this._snackBar.open('Agent URL copied to clipboard', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'end'
                });
            } catch (fallbackError) {
                console.error('Fallback copy method also failed:', fallbackError);
            }
        }
    }

    /**
     * Reset to basic configuration
     */
    resetToBasic(): void {
        // Reset form to default values
        this.qrForm.patchValue({
            size: 300,
            dotStyle: 'circle' as DotType,
            colorType: 'single',
            dotColor: '#000000FF',
            cornerSquareColorType: 'single',
            cornerSquareType: 'square' as CornerSquareType,
            cornerSquareColor: '#000000FF',
            cornerDotColorType: 'single',
            cornerDotType: 'dot' as CornerDotType,
            cornerDotColor: '#000000FF',
            backgroundColor: '#ffffff',
            showLogo: false,
            logoUrl: '',
            logoSize: 0.4,
            logoMargin: 0,
            hideBackgroundDots: true,
            errorCorrectionLevel: 'H',
            shape: 'circle' as ShapeType
        });

        this.currentConfig = {
            data: this.AGENT_URL,
            width: 300,
            height: 300
        };
        this.preview.update(this.currentConfig, {
            ...this.currentConfig,
        }).subscribe({
            next: (result) => {
                console.log('QR code updated successfully:', result);
                this.currentConfig = {
                    ...this.currentConfig,
                    template: 'default'
                };
            }
        });
    }
}