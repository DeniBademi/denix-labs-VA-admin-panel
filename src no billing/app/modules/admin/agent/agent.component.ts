import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTabsModule } from '@angular/material/tabs';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { AgentConfig, AgentService, AgentType } from './agent.service';
import { MatRadioModule } from '@angular/material/radio';
import { NavigationService } from 'app/core/navigation/navigation.service';
import { MatSnackBar } from '@angular/material/snack-bar';

// Import child components
import { DisclaimersComponent } from './components/disclaimers/disclaimers.component';
import { KnowledgeBaseComponent } from './components/knowledge-base/knowledge-base.component';
import { AgentClientComponent } from './components/livekit-demo/agent-client/agent-client.component';
import { KnowledgeBaseService } from './services/knowledge-base.service';
import { GoalsComponent } from './components/goals/goals.component';
import { GuardrailsComponent } from './components/guardrails/guardrails.component';
import { ToolsComponent } from './components/tools/tools.component';
import { PersonalityComponent } from './components/personality/personality.component';
import { ToneComponent } from './components/tone/tone.component';
import { EnvironmentComponent } from './components/environment/environment.component';

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
        MatRadioModule,
        DisclaimersComponent,
        GoalsComponent,
        GuardrailsComponent,
        KnowledgeBaseComponent,
        // ToolsComponent,
        PersonalityComponent,
        EnvironmentComponent,
        ToneComponent,
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
        private _router: Router,
        private _navigationService: NavigationService,
        private _route: ActivatedRoute,
        private _knowledgeBaseService: KnowledgeBaseService,
        private _snackBar: MatSnackBar
    ) {
        // Initialize the form
        this.configForm = this._formBuilder.group({
            agentType: ['receptionist'],
            disclaimers: this._formBuilder.array([]),
            personality: [''],
            environment: [''],
            tone: [''],
            goals: [''],
            guardrails: [''],
            knowledgeBase: [[]],
            availability: [null]
        });
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Optionally use agent_id from route params to pre-load specific agent in the future
        this._route.paramMap
            .pipe(
                map((pm) => pm.get('agent_id')),
                distinctUntilChanged(),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe((agentId) => {
                if (!agentId) { return; }
                this._agentService.setAgentId(agentId);
                this._knowledgeBaseService.setAgentId(agentId);
                this._agentService.getConfig().subscribe();
            });
        this._agentService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: AgentConfig) => {
                this.config = config;
                // Update form values
                // console.log('Availability:', (config as any)?.availability);
                this.configForm.patchValue({
                    agentType: config?.agentType ?? 'receptionist',
                    personality: config?.personality,
                    environment: config?.environment,
                    tone: config?.tone,
                    goals: config?.goals,
                    guardrails: config?.guardrails,
                    availability: (config as any)?.availability ?? { workHours: null }
                });
                // console.log('Availability:', this.configForm.get('availability')?.value);
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
        // config load handled by route param subscription
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
            this._agentService.updateConfig(config).subscribe((updated) => {
                // Re-apply navigation when agent type changes

                //Show success message
                this._snackBar.open('Config updated successfully', 'Close', {
                    duration: 3000,
                    horizontalPosition: 'end'
                });
            });
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