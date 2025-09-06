import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
	selector: 'va-welcome-view',
	standalone: true,
	template: `
		<div class="absolute inset-0" [attr.inert]="disabled ? '' : null">
			<div class="flex h-full items-center justify-between gap-4 px-3">
				<div class="pl-3">
					<img src="/images/logo/logo-black.svg" alt="LiveKit Logo" class="block size-6 dark:hidden" />
					<img src="/images/logo/logo.svg" alt="LiveKit Logo" class="hidden size-6 dark:block" />
				</div>

				<button type="button" (click)="onStartCall.emit()" class="w-48 rounded-full px-4 py-2 bg-primary text-white">
					Chat with Agent
				</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WelcomeViewComponent {
	@Input() disabled = false;
	@Output() readonly onStartCall = new EventEmitter<void>();
}


