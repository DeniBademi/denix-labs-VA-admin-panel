import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { ActivatedRoute } from '@angular/router';
import { BaseChipInputComponent } from '../../shared/base-chip-input-component';

@Component({
    selector: 'app-tools',
    templateUrl: './tools.component.html',
    styleUrls: ['./tools.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatChipsModule
    ]
})
export class ToolsComponent extends BaseChipInputComponent {
    constructor(protected override _route: ActivatedRoute) {
        super(_route);
    }

    addTool(event: MatChipInputEvent): void {
        this.addChip(event, 'tools');
    }

    removeTool(tool: string): void {
        this.removeChip(tool, 'tools');
    }

    getToolIcon(tool: string): string {
        const toolLower = tool.toLowerCase();
        if (toolLower.includes('product') || toolLower.includes('catalog') || toolLower.includes('size') || toolLower.includes('stock')) {
            return 'heroicons_outline:shopping-bag';
        }
        if (toolLower.includes('order') || toolLower.includes('return') || toolLower.includes('customer')) {
            return 'heroicons_outline:user-group';
        }
        if (toolLower.includes('promotion') || toolLower.includes('campaign') || toolLower.includes('recommend')) {
            return 'heroicons_outline:megaphone';
        }
        if (toolLower.includes('faq') || toolLower.includes('support') || toolLower.includes('ticket')) {
            return 'heroicons_outline:lifebuoy';
        }
        return 'heroicons_outline:wrench';
    }

    getToolColor(tool: string): string {
        const toolLower = tool.toLowerCase();
        if (toolLower.includes('product') || toolLower.includes('catalog') || toolLower.includes('size') || toolLower.includes('stock')) {
            return 'primary';
        }
        if (toolLower.includes('order') || toolLower.includes('return') || toolLower.includes('customer')) {
            return 'accent';
        }
        if (toolLower.includes('promotion') || toolLower.includes('campaign') || toolLower.includes('recommend')) {
            return 'warn';
        }
        return '';
    }
}