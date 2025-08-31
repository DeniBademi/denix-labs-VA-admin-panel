import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Options, DotType, CornerSquareType, CornerDotType, ShapeType } from 'ngx-qrcode-styling';
import { QrAgentUrlComponent } from './components/agent-url/agent-url.component';
import { QrStylingFormComponent } from './components/styling-form/styling-form.component';
import { QrPreviewComponent } from './components/preview/preview.component';
import { dotTypes } from './config-options/dot-types';
import { cornerSquareTypes } from './config-options/corner-square-types';
import { cornerDotTypes } from './config-options/corner-dot-types';
import { colorTypes } from './config-options/color-types';
import { errorCorrectionLevels } from './config-options/error-correction-levels';
import { createQrForm, defaultFormValues } from './forms/qr-form-factory';

@Component({
    selector: 'app-qr-codes',
    standalone: true,
    imports: [
    CommonModule,
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
    public currentConfig: Options = {}

    public dotTypes = dotTypes;
    public cornerSquareTypes = cornerSquareTypes;
    public cornerDotTypes = cornerDotTypes;
    public colorTypes = colorTypes;
    public errorCorrectionLevels = errorCorrectionLevels;

    constructor(
        private _formBuilder: FormBuilder
    ) {
        this.qrForm = createQrForm(this._formBuilder);
        this.updateCustomConfig();
    }

    ngOnInit(): void {
        this.resetToBasic();
        this.qrForm.valueChanges.subscribe(() => this.updateCustomConfig());
    }

    /**
     * Update custom configuration based on form values
     */
    updateCustomConfig(): void {
        const next = this.buildConfigFromForm();
        this.applyConfig(next);
    }

    private buildConfigFromForm(): Options {
        const v = this.qrForm.value;

        const config: Options = {
            width: v.size,
            height: v.size,
            data: this.AGENT_URL,
            margin: 10,
            dotsOptions: {
                type: v.dotStyle,
                color: v.colorType === 'single' ? v.dotColor : null,
                gradient: v.colorType === 'gradient' ? v.dotGradient : null
            },
            cornersSquareOptions: {
                type: v.cornerSquareType,
                color: v.cornerSquareColorType === 'single' ? v.cornerSquareColor : null,
                gradient: v.cornerSquareColorType === 'gradient' ? v.cornerSquareGradient : null
            },
            cornersDotOptions: {
                type: v.cornerDotType,
                color: v.cornerDotColorType === 'single' ? v.cornerDotColor : null,
                gradient: v.cornerDotColorType === 'gradient' ? v.cornerDotGradient : null
            },
            backgroundOptions: {
                color: v.backgroundColor
            },
            qrOptions: {
                errorCorrectionLevel: v.errorCorrectionLevel
            }
        };

        if (v.logoUrl) {
            if (v.showLogo) {
                config.image = v.logoUrl;
                config.imageOptions = {
                    hideBackgroundDots: v.hideBackgroundDots,
                    imageSize: v.logoSize,
                    crossOrigin: "anonymous",
                    margin: v.logoMargin
                };
            }
        }

        return config;
    }

    private applyConfig(next: Options): void {
        if (this.preview) {
            this.preview.update(this.currentConfig, next).subscribe({
                next: () => {
                    this.currentConfig = next;
                },
                error: (error) => console.error('Failed to update QR code:', error)
            });
        } else {
            this.currentConfig = { ...next };
        }
    }

    /**
     * Reset to basic configuration
     */
    resetToBasic(): void {
        this.qrForm.patchValue(defaultFormValues);
        this.applyConfig({ data: this.AGENT_URL, width: 300, height: 300, template: 'default' } as Options);
    }


}