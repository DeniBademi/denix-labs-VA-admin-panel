import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AgentConfig, AgentService } from './agent.service';

// Import child components
import { DisclaimersComponent } from './components/disclaimers/disclaimers.component';
import { KnowledgeBaseComponent } from './components/knowledge-base/knowledge-base.component';
import { AgentClientComponent } from './components/livekit-demo/agent-client/agent-client.component';

@Component({
    selector: 'agent',
    templateUrl: './agent.component.html',
    styleUrls: ['./agent.component.scss'],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatTabsModule,
        MatFormFieldModule,
        MatInputModule,
        DisclaimersComponent,
        KnowledgeBaseComponent,
        AgentClientComponent
    ],
    providers: [AgentService]
})
export class AgentComponent implements OnInit, OnDestroy {
    config: AgentConfig;
    configForm: FormGroup;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _agentService: AgentService,
        private _formBuilder: FormBuilder,
        private _router: Router
    ) {
        // Initialize the form
        this.configForm = this._formBuilder.group({
            disclaimers: this._formBuilder.array([]),
            personality: [''],
            environment: [''],
            tone: [''],
            goals: [''],
            guardrails: [''],
            knowledgeBase: [[]]
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Get the config
        this._agentService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: AgentConfig) => {
                this.config = config;

                // Update form values
                this.configForm.patchValue({
                    personality: config?.personality,
                    environment: config?.environment,
                    tone: config?.tone,
                    goals: config?.goals,
                    guardrails: config?.guardrails,
                });

                // Handle disclaimers separately since it's a FormArray
                const disclaimersArray = this.configForm.get('disclaimers') as FormArray;
                if (disclaimersArray) {
                    while (disclaimersArray.length) {
                        disclaimersArray.removeAt(0);
                    }
                    config?.disclaimers?.forEach(disclaimer => {
                        disclaimersArray.push(this._formBuilder.group({
                            text: [disclaimer.text],
                            requirePermission: [disclaimer.requirePermission]
                        }));
                    });
                }
            });

        // Load initial data
        this._agentService.getConfig().subscribe();
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
     * Save the config
     */
    saveConfig(): void {
        if (this.configForm.valid) {
            // Get the config
            const config = this.configForm.value;

            // Update the config
            this._agentService.updateConfig(config).subscribe();
        }
    }

    /**
     * Test the assistant
     */
    testAssistant(): void {
        // Save current config first
        if (this.configForm.valid) {
            this._agentService.updateConfig(this.configForm.value).subscribe(() => {
                // Navigate to the test chat page
                this._router.navigate(['/chat']);
            });
        }
    }
}