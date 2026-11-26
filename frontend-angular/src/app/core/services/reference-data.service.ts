import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApplicationService, Category } from '../models/reference-data.models';

/** Client for the read-only reference data endpoints (ReferenceDataEndpoints.cs). */
@Injectable({ providedIn: 'root' })
export class ReferenceDataService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiBaseUrl;

  categories(): Observable<Category[]> {
    return this.http.get<Category[]>(`${this.baseUrl}/api/categories`);
  }

  services(): Observable<ApplicationService[]> {
    return this.http.get<ApplicationService[]>(`${this.baseUrl}/api/services`);
  }
}
