import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  AddCommentRequest,
  AssignIncidentRequest,
  ChangeStatusRequest,
  CreateIncidentRequest,
  Incident,
  IncidentComment,
  IncidentHistoryEntry,
  IncidentListItem,
  IncidentListQuery,
  PagedResult,
  UpdateIncidentRequest,
} from '../models/incident.models';

/** Client for /api/incidents (IncidentAgent.Api/Endpoints/IncidentEndpoints.cs). */
@Injectable({ providedIn: 'root' })
export class IncidentService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/api/incidents`;

  list(query: IncidentListQuery = {}): Observable<PagedResult<IncidentListItem>> {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(query)) {
      if (value !== null && value !== undefined && value !== '') params = params.set(key, String(value));
    }
    return this.http.get<PagedResult<IncidentListItem>>(this.baseUrl, { params });
  }

  /** Exact server-side count for a filter: requests a single row and reads `totalCount`. */
  count(filter: Omit<IncidentListQuery, 'page' | 'pageSize'> = {}): Observable<number> {
    return this.list({ ...filter, page: 1, pageSize: 1 }).pipe(map((result) => result.totalCount));
  }

  get(id: string): Observable<Incident> {
    return this.http.get<Incident>(`${this.baseUrl}/${encodeURIComponent(id)}`);
  }

  create(request: CreateIncidentRequest): Observable<Incident> {
    return this.http.post<Incident>(this.baseUrl, request);
  }

  update(id: string, request: UpdateIncidentRequest): Observable<Incident> {
    return this.http.put<Incident>(`${this.baseUrl}/${encodeURIComponent(id)}`, request);
  }

  assign(id: string, request: AssignIncidentRequest): Observable<Incident> {
    return this.http.post<Incident>(`${this.baseUrl}/${encodeURIComponent(id)}/assign`, request);
  }

  changeStatus(id: string, request: ChangeStatusRequest): Observable<Incident> {
    return this.http.post<Incident>(`${this.baseUrl}/${encodeURIComponent(id)}/status`, request);
  }

  addComment(id: string, request: AddCommentRequest): Observable<IncidentComment> {
    return this.http.post<IncidentComment>(`${this.baseUrl}/${encodeURIComponent(id)}/comments`, request);
  }

  history(id: string): Observable<IncidentHistoryEntry[]> {
    return this.http.get<IncidentHistoryEntry[]>(`${this.baseUrl}/${encodeURIComponent(id)}/history`);
  }
}
