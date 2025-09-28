import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule } from '@angular/material/chips';
import { ActivatedRoute } from '@angular/router';
import { BaseChipInputComponent } from '../../shared/base-chip-input-component';
import { FuseAlertComponent } from '@fuse/components/alert';

@Component({
    selector: 'app-tone',
    templateUrl: './tone.component.html',
    styleUrls: ['./tone.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatChipsModule,
        FuseAlertComponent
    ]
})
export class ToneComponent extends BaseChipInputComponent {
    constructor(protected override _route: ActivatedRoute) {
        super(_route);
    }
}