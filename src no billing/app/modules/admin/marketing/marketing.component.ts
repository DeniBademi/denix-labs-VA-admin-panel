import { CommonModule } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { FuseConfirmationService } from '@fuse/services/confirmation';
import { Campaign, CampaignFilter, CampaignStatus } from './marketing.types';
import { MarketingService } from './marketing.service';
import { Subject, takeUntil } from 'rxjs';
import { HasPermissionDirective } from 'app/core/auth/directives/has-permission.directive';
import { CampaignDialogComponent } from './campaign-dialog/campaign-dialog.component';
import { ActivatedRoute } from '@angular/router';
import { map, distinctUntilChanged } from 'rxjs/operators';

@Component({
    selector: 'app-marketing',
    templateUrl: './marketing.component.html',
    styleUrls: ['./marketing.component.scss'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatIconModule,
        MatInputModule,
        MatPaginatorModule,
        MatSelectModule,
        MatSortModule,
        MatTableModule,
        MatTooltipModule,
        MatDialogModule,
        MatChipsModule,
        HasPermissionDirective
    ]
})
export class MarketingComponent implements OnInit {
    @ViewChild(MatPaginator) paginator: MatPaginator;
    @ViewChild(MatSort) sort: MatSort;

    dataSource: MatTableDataSource<Campaign> = new MatTableDataSource();
    displayedColumns: string[] = ['name', 'bannerUrl', 'status', 'dateRange', 'targeting', 'actions'];
    total = 0;

    filter: CampaignFilter = {
        search: '',
        status: [],
        startDate: null,
        endDate: null,
        sortBy: 'name',
        sortDirection: 'asc',
        page: 0,
        limit: 10
    };

    readonly statusOptions: { value: CampaignStatus; label: string }[] = [
        { value: 'draft', label: 'Draft' },
        { value: 'scheduled', label: 'Scheduled' },
        { value: 'active', label: 'Active' },
        { value: 'paused', label: 'Paused' },
        { value: 'completed', label: 'Completed' }
    ];

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _marketingService: MarketingService,
        private _fuseConfirmationService: FuseConfirmationService,
        private _dialog: MatDialog,
        private _route: ActivatedRoute
    ) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

        // React to agent_id route changes
        this._route.paramMap
            .pipe(
                map((pm) => pm.get('agent_id')),
                distinctUntilChanged(),
            )
            .subscribe((agentId) => {
                this._marketingService.setAgentId(agentId);
                this.filter.page = 0;
                this.getCampaigns();
            });
        // Get campaigns
        this._marketingService.campaigns$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((campaigns: Campaign[]) => {
                // Update the data source
                this.dataSource = new MatTableDataSource(campaigns);
                // Server-side pagination; don't bind paginator to data source length
                this.dataSource.sort = this.sort;
            });

        // Track pagination from service
        this._marketingService.pagination$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((pg) => {
                this.total = pg.total ?? this.dataSource.data.length;
                if (pg.limit !== undefined) this.filter.limit = pg.limit;
                if (pg.page !== undefined) this.filter.page = pg.page;
            });

        // Initial load handled by paramMap subscription
    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get campaigns with current filter
     */
    getCampaigns(): void {
        this._marketingService.getCampaigns(this.filter).subscribe();
    }

    /**
     * Handle paginator events
     */
    onPage(event: { pageIndex: number; pageSize: number }): void {
        this.filter.page = event.pageIndex;
        this.filter.limit = event.pageSize;
        this.getCampaigns();
    }

    /**
     * Filter campaigns
     */
    filterCampaigns(): void {
        this.filter.page = 0;
        this.getCampaigns();
    }

    /**
     * Reset filter
     */
    resetFilter(): void {
        this.filter = {
            search: '',
            status: [],
            startDate: null,
            endDate: null,
            sortBy: 'name',
            sortDirection: 'asc',
            page: 0,
            limit: 10
        };
        this.getCampaigns();
    }

    /**
     * Open campaign dialog
     */
    openCampaignDialog(campaign?: Campaign): void {
        const dialogRef = this._dialog.open(CampaignDialogComponent, {
            data: { campaign },
            width: '800px',
            maxHeight: '90vh',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.getCampaigns();
            }
        });
    }

    /**
     * Delete campaign
     */
    deleteCampaign(campaign: Campaign): void {
        const confirmation = this._fuseConfirmationService.open({
            title: 'Delete campaign',
            message: 'Are you sure you want to delete this campaign? This action cannot be undone!',
            actions: {
                confirm: {
                    label: 'Delete'
                }
            }
        });

        confirmation.afterClosed().subscribe((result) => {
            if (result === 'confirmed') {
                this._marketingService.deleteCampaign(campaign.id).subscribe();
            }
        });
    }

    /**
     * Get status color
     */
    getStatusColor(status: CampaignStatus): string {
        switch (status) {
            case 'draft':
                return 'gray';
            case 'scheduled':
                return 'amber';
            case 'active':
                return 'green';
            case 'paused':
                return 'orange';
            case 'completed':
                return 'blue';
            default:
                return 'gray';
        }
    }

    /**
     * Format date range
     */
    formatDateRange(startDate: string, endDate: string): string {
        const start = new Date(startDate);
        const end = new Date(endDate);
        return `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`;
    }

    /**
     * Track by function for ngFor loops
     */
    trackByFn(index: number, item: any): any {
        return item.id || index;
    }
}