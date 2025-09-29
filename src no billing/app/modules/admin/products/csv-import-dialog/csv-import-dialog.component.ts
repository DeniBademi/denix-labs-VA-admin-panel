import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatStepperModule } from '@angular/material/stepper';
import { CsvColumnMapping } from '../products.types';
import { ProductsService } from '../products.service';
import * as XLSX from 'xlsx';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { firstValueFrom } from 'rxjs';

@Component({
    selector: 'app-csv-import-dialog',
    templateUrl: './csv-import-dialog.component.html',
    styleUrls: ['./csv-import-dialog.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatDialogModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatSelectModule,
        MatStepperModule
    ]
})
export class CsvImportDialogComponent implements OnInit {
    file: File;
    csvHeaders: string[] = [];
    previewData: string[][] = [];
    mappingForm: FormGroup;
    importing = false;
    importError: string;

    readonly requiredFields = [
        { key: 'sku', label: 'SKU' },
        { key: 'name', label: 'Name' },
        { key: 'description', label: 'Description' },
        { key: 'imageUrl', label: 'Image URL' },
        { key: 'category', label: 'Category' },
        { key: 'price', label: 'Price' }
    ];

    readonly optionalFields = [
        { key: 'salePrice', label: 'Sale Price' },
        { key: 'photos', label: 'Additional Photos (comma-separated)' },
        { key: 'attributes', label: 'Attributes (JSON)' }
    ];

    /**
     * Constructor
     */
    constructor(
        private _dialogRef: MatDialogRef<CsvImportDialogComponent>,
        private _formBuilder: FormBuilder,
        private _productsService: ProductsService,
        private _fuseConfirmationService: FuseConfirmationService
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Initialize the mapping form
        this.mappingForm = this._formBuilder.group({});

        // Add required field controls
        this.requiredFields.forEach(field => {
            this.mappingForm.addControl(field.key, this._formBuilder.control('', Validators.required));
        });

        // Add optional field controls
        this.optionalFields.forEach(field => {
            this.mappingForm.addControl(field.key, this._formBuilder.control(''));
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Handle file selection
     */
    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files?.length) {
            this.file = input.files[0];
            this.parseFile();
        }
    }

    /**
     * Parse CSV file
     */
    private parseCSV(): void {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            const text = e.target?.result as string;
            const lines = text.split('\n');

            // Get headers
            this.csvHeaders = lines[0].split(',').map(header => header.trim());

            // Get preview data (first 5 rows)
            this.previewData = lines.slice(1, 6).map(line =>
                line.split(',').map(cell => cell.trim())
            );

            // Attempt auto-mapping
            this.autoMapHeaders();
        };
        reader.readAsText(this.file);
    }

    /**
     * Parse Excel file (.xls/.xlsx)
     */
    private parseXLSX(): void {
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
            const arrayBuffer = e.target?.result as ArrayBuffer;
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            const firstSheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[firstSheetName];
            const aoa: any[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, raw: false });

            if (!aoa || aoa.length === 0) {
                this.csvHeaders = [];
                this.previewData = [];
                return;
            }

            // Get headers from first row
            this.csvHeaders = (aoa[0] || []).map((h: any) => String(h ?? '').trim());

            // Next 5 rows as preview, align cells to header count
            this.previewData = aoa.slice(1, 6).map((row: any[]) =>
                this.csvHeaders.map((_, idx) => String(row?.[idx] ?? '').trim())
            );

            // Attempt auto-mapping
            this.autoMapHeaders();
        };
        reader.readAsArrayBuffer(this.file);
    }

    /**
     * Detect file type and parse accordingly
     */
    private parseFile(): void {
        const name = this.file.name.toLowerCase();
        if (name.endsWith('.csv')) {
            this.parseCSV();
            return;
        }
        if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            this.parseXLSX();
            return;
        }
        this.importError = 'Unsupported file type. Please upload a CSV or Excel file.';
    }

    /**
     * Import CSV
     */
    async importCSV(): Promise<void> {
        if (this.mappingForm.invalid) {
            return;
        }

        this.importing = true;
        this.importError = null;

        const mapping = this.mappingForm.value as Partial<CsvColumnMapping>;
        try {
            const ok = await this._preflightCategories(mapping);
            if (!ok) {
                this.importing = false;
                return;
            }
        } catch (err: any) {
            this.importing = false;
            this.importError = err?.message || 'An error occurred during category validation';
            return;
        }

        this._productsService.importProductsFromCsv(this.file, mapping).subscribe({
            next: (result) => {
                this._dialogRef.close(result);
            },
            error: (error) => {
                this.importing = false;
                this.importError = error.message || 'An error occurred during import';
            }
        });
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any {
        return item.key || index;
    }

    /**
     * Truncate preview cell values to 60 chars
     */
    truncateCell(value: any): string {
        const str = value === undefined || value === null ? '' : String(value);
        return str.length > 60 ? str.slice(0, 60) + '...' : str;
    }

    /**
     * Auto-map headers to form controls using canonical names
     */
    private autoMapHeaders(): void {
        if (!this.csvHeaders?.length || !this.mappingForm) return;

        const canonical: Record<string, string[]> = {
            sku: ['sku', 'product sku', 'id'],
            name: ['name', 'product name', 'title'],
            description: ['description', 'desc', 'details'],
            imageUrl: ['imageurl', 'image_url', 'image url', 'image', 'image link', 'image_link', 'main image'],
            photos: ['photos', 'images', 'gallery', 'additional photos'],
            category: ['category', 'category path', 'category_path'],
            price: ['price', 'unit price', 'amount'],
            salePrice: ['sale price', 'sale_price', 'discount price', 'discount'],
            attributes: ['attributes', 'custom attributes', 'custom_attributes', 'attrs']
        };

        const lowerToOriginal: Map<string, string> = new Map(
            this.csvHeaders.map(h => [String(h).toLowerCase().trim(), h])
        );

        const trySet = (key: string) => {
            const control = this.mappingForm.get(key);
            if (!control || control.value) return; // don't override user input
            const candidates = canonical[key] || [];
            for (const candidate of candidates) {
                const match = lowerToOriginal.get(candidate.toLowerCase());
                if (match) {
                    control.setValue(match);
                    break;
                }
            }
        };

        // Attempt for all fields
        [...this.requiredFields, ...this.optionalFields].forEach(f => trySet(f.key));
    }

    /**
     * Check for unknown categories in the file and optionally create them
     */
    private async _preflightCategories(mapping: Partial<CsvColumnMapping>): Promise<boolean> {
        const categoryKey = mapping.category;
        if (!categoryKey) return true;

        // Parse workbook as objects keyed by headers
        const lower = this.file.name.toLowerCase();
        const workbook: XLSX.WorkBook = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onerror = () => reject(reader.error);
            reader.onload = () => {
                try {
                    if (lower.endsWith('.csv')) {
                        resolve(XLSX.read(reader.result as string, { type: 'string' }));
                    } else {
                        resolve(XLSX.read(reader.result as ArrayBuffer, { type: 'array' }));
                    }
                } catch (e) { reject(e); }
            };
            if (lower.endsWith('.csv')) reader.readAsText(this.file);
            else reader.readAsArrayBuffer(this.file);
        });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows: Record<string, any>[] = XLSX.utils.sheet_to_json(sheet, { defval: '', raw: false });
        if (!rows.length) return true;

        const headers = Object.keys(rows[0] ?? {});
        const headerIdx = headers.findIndex((h) => (h ?? '').toString().toLowerCase().trim() === categoryKey.toLowerCase());
        if (headerIdx === -1) return true;
        const header = headers[headerIdx];

        const categories = new Set<string>();
        for (const row of rows) {
            const val = row[header];
            if (val && typeof val === 'string') categories.add(val.trim());
        }
        if (categories.size === 0) return true;

        const existing = await firstValueFrom(this._productsService.getCategories());
        const existingPaths = new Set((existing ?? []).map((c) => c.path));
        const missing = Array.from(categories).filter((p) => !existingPaths.has(p));
        if (missing.length === 0) return true;

        const ref = this._fuseConfirmationService.open({
            title: 'Unknown Categories Detected',
            message: `Found ${missing.length} unknown categor${missing.length === 1 ? 'y' : 'ies'}. Do you want to add them now?\n\n` +
                missing.slice(0, 10).map((m) => `- ${m}`).join('\n') + (missing.length > 10 ? `\n...and ${missing.length - 10} more` : ''),
            actions: {
                confirm: { label: 'Add Categories' },
                cancel: { label: 'Cancel' }
            }
        });
        const confirmed = await firstValueFrom(ref.afterClosed());
        if (!confirmed) return false;

        await firstValueFrom(this._productsService.ensureCategoriesForPaths(missing));
        return true;
    }
}
