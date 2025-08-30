import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
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
export class KnowledgeBaseComponent implements OnInit {
    @Input() parentForm: FormGroup;
    acceptedFileTypes = '.pdf';
    isUploading = false;

    constructor(
        private _httpClient: HttpClient,
        private _snackBar: MatSnackBar,
        private _kbService: KnowledgeBaseService,
        private _confirmation: FuseConfirmationService
    ) {}

    ngOnInit(): void {
        // Load initial data
        this.loadKnowledgeBase();
    }

    private async loadKnowledgeBase(): Promise<void> {
        try {
            const files = await firstValueFrom(this._kbService.listFiles());
            this.parentForm.get('knowledgeBase').setValue(files);
        } catch (error) {
            this._snackBar.open('Failed to load knowledge base', 'Close', {
                duration: 3000,
                horizontalPosition: 'end'
            });
        }
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            const file = input.files[0];
            if (file.type === 'application/pdf') {
                this.uploadFile(file);
            } else {
                this._snackBar.open('Only PDF files are allowed', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'end'
                });
            }
            // Clear the input
            input.value = '';
        }
    }

    private async uploadFile(file: File): Promise<void> {
        this.isUploading = true;

        try {
            const uploaded = await firstValueFrom(this._kbService.uploadFile(file));
            const current: KnowledgeBaseFile[] = this.parentForm.get('knowledgeBase').value ?? [];
            this.parentForm.get('knowledgeBase').setValue([...current, uploaded]);

            this._snackBar.open('File uploaded successfully', 'Close', {
                duration: 3000,
                horizontalPosition: 'end'
            });
        } catch (error) {
            this._snackBar.open('Failed to upload file', 'Close', {
                duration: 3000,
                horizontalPosition: 'end'
            });
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
            this._snackBar.open('Failed to download file', 'Close', {
                duration: 3000,
                horizontalPosition: 'end'
            });
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
                const current: KnowledgeBaseFile[] = this.parentForm.get('knowledgeBase').value ?? [];
                this.parentForm.get('knowledgeBase').setValue(current.filter(f => f.url !== file.url));

                this._snackBar.open('File deleted successfully', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'end'
                });
            } catch (error) {
                this._snackBar.open('Failed to delete file', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'end'
                });
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