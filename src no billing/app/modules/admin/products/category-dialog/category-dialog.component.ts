import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTreeModule, MatTreeNestedDataSource } from '@angular/material/tree';
import { NestedTreeControl } from '@angular/cdk/tree';
import { Category } from '../products.types';
import { ProductsService } from '../products.service';

@Component({
    selector: 'app-category-dialog',
    templateUrl: './category-dialog.component.html',
    styleUrls: ['./category-dialog.component.scss'],
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
        MatTreeModule
    ]
})
export class CategoryDialogComponent implements OnInit {
    categoryForm: FormGroup;
    treeControl = new NestedTreeControl<Category>(node => node.children);
    dataSource = new MatTreeNestedDataSource<Category>();
    selectedCategory: Category;
    editMode = false;

    /**
     * Constructor
     */
    constructor(
        @Inject(MAT_DIALOG_DATA) private _data: { categories: Category[] },
        private _dialogRef: MatDialogRef<CategoryDialogComponent>,
        private _formBuilder: FormBuilder,
        private _productsService: ProductsService
    ) {
        this.dataSource.data = this._data.categories;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the category form
        this.categoryForm = this._formBuilder.group({
            name: ['', [Validators.required]],
            parentId: ['']
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Has child
     */
    hasChild = (_: number, node: Category): boolean => !!node.children && node.children.length > 0;

    /**
     * Select category
     */
    selectCategory(category: Category): void {
        this.selectedCategory = category;
        this.editMode = true;

        // Update form
        this.categoryForm.patchValue({
            name: category.name,
            parentId: category.parentId || ''
        });
    }

    /**
     * Cancel edit
     */
    cancelEdit(): void {
        this.selectedCategory = null;
        this.editMode = false;
        this.categoryForm.reset();
    }

    /**
     * Save category
     */
    saveCategory(): void {
        if (this.categoryForm.invalid) {
            return;
        }

        const formData = this.categoryForm.value;

        if (this.editMode && this.selectedCategory) {
            // Update existing category
            this._productsService.updateCategory(this.selectedCategory.id, {
                name: formData.name,
                parentId: formData.parentId || null,
                path: this._buildCategoryPath(formData.name, formData.parentId)
            }).subscribe(() => {
                this._dialogRef.close(true);
            });
        } else {
            // Create new category
            this._productsService.createCategory({
                name: formData.name,
                parentId: formData.parentId || null,
                path: this._buildCategoryPath(formData.name, formData.parentId)
            }).subscribe(() => {
                this._dialogRef.close(true);
            });
        }
    }

    /**
     * Delete category
     */
    deleteCategory(category: Category): void {
        this._productsService.deleteCategory(category.id).subscribe(() => {
            this._dialogRef.close(true);
        });
    }

    /**
     * Get parent categories
     */
    getParentCategories(): Category[] {
        const flattenCategories = (categories: Category[], result: Category[] = []): Category[] => {
            categories.forEach(category => {
                // Don't include the selected category or its children as potential parents
                if (!this.selectedCategory ||
                    (category.id !== this.selectedCategory.id &&
                     !this._isDescendant(category, this.selectedCategory))) {
                    result.push(category);
                    if (category.children) {
                        flattenCategories(category.children, result);
                    }
                }
            });
            return result;
        };

        return flattenCategories(this._data.categories);
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Build category path
     */
    private _buildCategoryPath(name: string, parentId: string): string {
        const parent = this.getParentCategories().find(category => category.id === parentId);
        return parent ? `${parent.path}/${name}` : name;
    }

    /**
     * Check if category is descendant
     */
    private _isDescendant(parent: Category, child: Category): boolean {
        if (!parent.children) {
            return false;
        }

        return parent.children.some(category =>
            category.id === child.id ||
            (category.children && this._isDescendant(category, child))
        );
    }
}
