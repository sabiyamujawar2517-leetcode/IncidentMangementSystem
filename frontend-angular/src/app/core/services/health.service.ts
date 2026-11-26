import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of } from 'rxjs';
import { environment } from '../../../environments/environment';

export type ApiHealth = 'checking' | 'online' | 'offline';

/** Liveness probe against GET /health (plain-text "Healthy"). */
@Injectable({ providedIn: 'root' })
export class HealthService {
  private readonly http = inject(HttpClient);

  check(): Observable<Exclude<ApiHealth, 'checking'>> {
    return this.http.get(`${environment.apiBaseUrl}/health`, { responseType: 'text' }).pipe(
      map(() => 'online' as const),
      catchError(() => of('offline' as const)),
    );
  }
}
