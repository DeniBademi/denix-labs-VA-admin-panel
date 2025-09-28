import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { QrCodeTabComponent } from './components/qr-code-tab/qr-code-tab.component';
import { WebsiteWidgetTabComponent } from './components/website-widget-tab/website-widget-tab.component';
import { distinctUntilChanged, map } from 'rxjs/operators';

@Component({
    selector: 'app-access',
    standalone: true,
    imports: [
    CommonModule,
    FormsModule,
    MatListModule,
    MatIconModule,
    MatButtonToggleModule,
    QrCodeTabComponent,
    WebsiteWidgetTabComponent
],
    templateUrl: './access.component.html',
    styleUrls: ['./access.component.scss']
})
export class AccessComponent implements OnInit {
    selected: 'qr' | 'widget' | 'pbx' = 'qr';
    constructor(
        private _route: ActivatedRoute
    ) {
    }

    ngOnInit(): void {
        // No-op for now; tabs encapsulate their own logic

    }
}