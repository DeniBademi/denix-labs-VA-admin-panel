import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatChipsModule, MatChipInputEvent } from '@angular/material/chips';
import { COMMA, ENTER } from '@angular/cdk/keycodes';

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
export class ToolsComponent {
    @Input() parentForm: FormGroup;
    separatorKeysCodes: number[] = [ENTER, COMMA];

    addTool(event: MatChipInputEvent): void {
        const value = (event.value || '').trim();

        if (value) {
            const currentTools = this.parentForm.get('tools').value || [];
            this.parentForm.get('tools').setValue([...currentTools, value]);
        }

        event.chipInput!.clear();
    }

    removeTool(tool: string): void {
        const currentTools = this.parentForm.get('tools').value || [];
        const index = currentTools.indexOf(tool);

        if (index >= 0) {
            const updatedTools = [...currentTools];
            updatedTools.splice(index, 1);
            this.parentForm.get('tools').setValue(updatedTools);
        }
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