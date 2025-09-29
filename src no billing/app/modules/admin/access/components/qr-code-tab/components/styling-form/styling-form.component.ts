import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { dotTypes } from '../../config-options/dot-types';
import { cornerSquareTypes } from '../../config-options/corner-square-types';
import { cornerDotTypes } from '../../config-options/corner-dot-types';
import { colorTypes } from '../../config-options/color-types';
import { errorCorrectionLevels } from '../../config-options/error-correction-levels';
import { backgroundShapeTypes } from '../../config-options/background-shape-types';
import { DotType, CornerSquareType, CornerDotType, ShapeType, ErrorCorrectionLevel } from 'ngx-qrcode-styling';
import { defaultFormValues } from '../../forms/qr-form-factory';

@Component({
    selector: 'app-qr-styling-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatCheckboxModule,
        MatButtonModule
    ],
    templateUrl: './styling-form.component.html',
    styleUrls: ['./styling-form.component.scss']
})
export class QrStylingFormComponent implements OnInit {

    @Input() form!: FormGroup;
    @Output() reset = new EventEmitter<void>();
    dotTypes = dotTypes;
    public cornerSquareTypes = cornerSquareTypes;
    public cornerDotTypes = cornerDotTypes;
    public colorTypes = colorTypes;
    public errorCorrectionLevels = errorCorrectionLevels;
    public backgroundShapeTypes = backgroundShapeTypes;

    ngOnInit(): void {}

    get dotGradientStops(): FormArray {
        return this.form.get('dotGradient.colorStops') as unknown as FormArray;
    }

    get cornerSquareGradientStops(): FormArray {
        return this.form.get('cornerSquareGradient.colorStops') as unknown as FormArray;
    }

    get cornerDotGradientStops(): FormArray {
        return this.form.get('cornerDotGradient.colorStops') as unknown as FormArray;
    }

    get backgroundGradientStops(): FormArray {
        return this.form.get('backgroundGradient.colorStops') as unknown as FormArray;
    }

    onLogoFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (!input.files || input.files.length === 0) {
            return;
        }
        const file = input.files[0];
        const reader = new FileReader();
        reader.onload = () => {
            const dataUrl = reader.result as string;
            this.form.patchValue({
                showLogo: true,
                logoUrl: dataUrl
            });
            this.form.get('logoUrl')?.updateValueAndValidity();
        };
        reader.readAsDataURL(file);
        // Reset input so the same file can be re-selected if needed
        input.value = '';
    }

    onReset(): void {
        this.form.reset(defaultFormValues());
        this.reset.emit();
    }
}


