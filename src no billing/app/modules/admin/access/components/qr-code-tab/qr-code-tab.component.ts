import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormBuilder, FormGroup } from '@angular/forms';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Options } from 'ngx-qrcode-styling';
import { QrAgentUrlComponent } from './components/agent-url/agent-url.component';
import { QrStylingFormComponent } from './components/styling-form/styling-form.component';
import { QrPreviewComponent } from './components/preview/preview.component';
import { createQrForm, defaultFormValues } from './forms/qr-form-factory';

@Component({
    selector: 'app-qr-code-tab',
    standalone: true,
    imports: [
        CommonModule,
        QrAgentUrlComponent,
        QrStylingFormComponent,
        QrPreviewComponent
    ],
    templateUrl: './qr-code-tab.component.html',
    styleUrls: ['./qr-code-tab.component.scss']
})
    export class QrCodeTabComponent implements OnInit {

    @ViewChild(QrPreviewComponent) preview!: QrPreviewComponent;

    public AGENT_URL = "";
    public qrForm: FormGroup;
    public currentConfig: Options = {};

    constructor(
        private _formBuilder: FormBuilder,
        private _route: ActivatedRoute
    ) {
        this.qrForm = createQrForm(this._formBuilder);
        this.updateCustomConfig();
    }

    ngOnInit(): void {
        this.resetToBasic();
        this.qrForm.valueChanges.subscribe(() => this.updateCustomConfig());

        this.AGENT_URL = `https://v1.denixlabs.com/${this._route.snapshot.paramMap.get('agent_id')}`;
        this._route.paramMap
            .pipe(
                map((pm) => pm.get('agent_id')),
                distinctUntilChanged()
            )
            .subscribe((agentId) => {
                if (!agentId) return;
                this.updateCustomConfig();
                this.AGENT_URL = `https://v1.denixlabs.com/${agentId}`;
            });
    }

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
                round: v.backgroundShape,
                color: v.backgroundColorType === 'single' ? v.backgroundColor : null,
                gradient: v.backgroundColorType === 'gradient' ? v.backgroundGradient : null
            },
            qrOptions: {
                errorCorrectionLevel: v.errorCorrectionLevel
            }
        };

        if (v.logoUrl && v.showLogo) {
            config.image = v.logoUrl;
            config.imageOptions = {
                hideBackgroundDots: v.hideBackgroundDots,
                imageSize: v.logoSize,
                crossOrigin: "anonymous",
                margin: v.logoMargin
            };
        }

        return config;
    }

    private applyConfig(next: Options): void {
        this.currentConfig = { ...next };
        this.preview?.update(this.currentConfig, next);
        this.qrForm.patchValue(defaultFormValues().value);
    }

    resetToBasic(): void {
        this.applyConfig({ data: this.AGENT_URL, width: 300, height: 300, template: 'default' } as Options);
    }
}


