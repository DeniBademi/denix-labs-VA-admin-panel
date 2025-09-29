import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { KnowledgeBaseService, KnowledgeBaseFile as KBFile } from '../../services/knowledge-base.service';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { ActivatedRoute } from '@angular/router';
import { BaseAgentComponent } from '../../shared/base-agent-component';

interface KnowledgeBaseFile {
    name: string;
    url: string;
    uploadedAt?: string;
    size?: number;
}

@Component({
    selector: 'app-knowledge-base',
    templateUrl: './knowledge-base.component.html',
    styleUrls: ['./knowledge-base.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,
        MatProgressBarModule,
        MatSnackBarModule
    ]
})
export class KnowledgeBaseComponent extends BaseAgentComponent {
    acceptedFileTypes = '.pdf';
    isUploading = false;

    constructor(
        protected override _route: ActivatedRoute,
        protected override _snackBar: MatSnackBar,
        private _httpClient: HttpClient,
        private _kbService: KnowledgeBaseService,
        private _confirmation: FuseConfirmationService
    ) {
        super(_route, _snackBar);
    }

    protected onAgentComponentInit(): void {
        this.loadKnowledgeBase();
    }

    protected onAgentIdChanged(agentId: string | null): void {
        if (agentId) {
            this._kbService.setAgentId(agentId);
            this.loadKnowledgeBase();
        }
    }

    private async loadKnowledgeBase(): Promise<void> {
        try {
            const files = await firstValueFrom(this._kbService.listFiles());
            this.setFormValue('knowledgeBase', files);
        } catch (error) {
            this.showError('Failed to load knowledge base');
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            const file = input.files[0];
            if (file.type === 'application/pdf') {
                this.uploadFile(file);
            } else {
                this.showError('Only PDF files are allowed');
            }
            // Clear the input
            input.value = '';
        }
    }

    private async uploadFile(file: File): Promise<void> {
        this.isUploading = true;

        try {
            const uploaded = await firstValueFrom(this._kbService.uploadFile(file));
            const current: KnowledgeBaseFile[] = this.getFormValue('knowledgeBase') ?? [];
            this.setFormValue('knowledgeBase', [...current, uploaded]);

            this.showSuccess('File uploaded successfully');
        } catch (error) {
            this.showError('Failed to upload file');
        } finally {
            this.isUploading = false;
        }
    }

    async downloadFile(url: string, name: string): Promise<void> {
        try {
            const signedUrl = await firstValueFrom(this._kbService.getDownloadUrl(url));

            // Fetch the file as blob to ensure correct filename on download
            const response = await fetch(signedUrl);
            if (!response.ok) throw new Error('Download failed');
            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            const a = document.createElement('a');
            a.href = objectUrl;
            a.download = name || 'file';
            document.body.appendChild(a);
            a.click();
            a.remove();
            URL.revokeObjectURL(objectUrl);
        } catch (e) {
            this.showError('Failed to download file');
        }
    }

    async deleteFile(file: KnowledgeBaseFile): Promise<void> {
        const confirmation = this._confirmation.open({
            title: 'Delete file',
            message: `Are you sure you want to delete "${file.name}"? This action cannot be undone!`,
            actions: {
                confirm: { label: 'Delete' },
                cancel: { label: 'Cancel' }
            }
        });

        confirmation.afterClosed().subscribe(async (result) => {
            if (result !== 'confirmed') {
                return;
            }
            try {
                await firstValueFrom(this._kbService.deleteFile(file.url));
                const current: KnowledgeBaseFile[] = this.getFormValue('knowledgeBase') ?? [];
                this.setFormValue('knowledgeBase', current.filter(f => f.url !== file.url));

                this.showSuccess('File deleted successfully');
            } catch (error) {
                this.showError('Failed to delete file');
            }
        });
    }

    formatFileSize(size: number): string {
        if (!size) return '';
        const units = ['B', 'KB', 'MB', 'GB'];
        let index = 0;
        let fileSize = size;
        while (fileSize >= 1024 && index < units.length - 1) {
            fileSize /= 1024;
            index++;
        }
        return `${fileSize.toFixed(1)} ${units[index]}`;
    }

    formatDate(date: string): string {
        return new Date(date).toLocaleDateString();
    }
}