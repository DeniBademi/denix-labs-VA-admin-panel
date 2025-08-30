import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { DashboardData } from './dashboard.types';

@Injectable({providedIn: 'root'})
export class DashboardService {
    private _data: BehaviorSubject<DashboardData> = new BehaviorSubject(null);

    /**
     * Constructor
     */
    constructor(private _httpClient: HttpClient) {}

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for data
     */
    get data$(): Observable<DashboardData> {
        return this._data.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get data
     */
    getData(): Observable<DashboardData> {
        return this._httpClient.get<DashboardData>('api/common/dashboard').pipe(
            tap((response) => {
                this._data.next(response);
            })
        );
    }
}
