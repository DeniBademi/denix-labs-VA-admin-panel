import { inject, Injectable } from '@angular/core';
import { FUSE_CONFIG } from '@fuse/services/config/config.constants';
import { merge } from 'lodash-es';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FuseConfigService {
    private readonly _storageKey = 'fuse.config.user';
    private readonly _defaultConfig = inject(FUSE_CONFIG);
    private _config: BehaviorSubject<any>;

    constructor() {
        const stored = this._loadFromStorage();
        const initial = stored ? merge({}, this._defaultConfig, stored) : this._defaultConfig;
        this._config = new BehaviorSubject(initial);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for config
     */
    set config(value: any) {
        // Merge the new config over to the current config
        const config = merge({}, this._config.getValue(), value);

        // Execute the observable
        this._config.next(config);

        // Persist to local storage
        this._saveToStorage(config);
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    get config$(): Observable<any> {
        return this._config.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resets the config to the default
     */
    reset(): void {
        // Clear saved preferences
        this._clearStorage();

        // Reset to defaults
        this._config.next(this._defaultConfig);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    private _loadFromStorage(): any | null {
        try {
            if (typeof localStorage === 'undefined') return null;
            const raw = localStorage.getItem(this._storageKey);
            if (!raw) return null;
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    private _saveToStorage(config: any): void {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.setItem(this._storageKey, JSON.stringify(config));
        } catch {
            // Ignore storage errors
        }
    }

    private _clearStorage(): void {
        try {
            if (typeof localStorage === 'undefined') return;
            localStorage.removeItem(this._storageKey);
        } catch {
            // Ignore storage errors
        }
    }
}
