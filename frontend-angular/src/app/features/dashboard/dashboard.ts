import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Observable, forkJoin } from 'rxjs';
import { ApiError } from '../../core/models/api-error';
import {
  INCIDENT_STATUSES,
  IncidentListItem,
  IncidentStatus,
  PRIORITIES,
  PRIORITY_LABELS,
  Priority,
} from '../../core/models/incident.models';
import { IncidentService } from '../../core/services/incident.service';
import { Icon, IconName } from '../../shared/components/icon';
import { IncidentTable } from '../../shared/components/incident-table';
import { StateMessage } from '../../shared/components/state-message';

interface DashboardData {
  total: number;
  byStatus: Record<IncidentStatus, number>;
  byPriority: Record<Priority, number>;
  recent: IncidentListItem[];
}

interface Kpi {
  label: string;
  value: number;
  hint: string;
  icon: IconName;
  tone: string;
  queryParams: Record<string, string> | null;
}

interface DistributionRow {
  key: string;
  label: string;
  count: number;
  percent: number;
  queryParams: Record<string, string>;
}

/** Runs one count request per key in parallel; each count is the API's exact `totalCount` for that filter. */
function countBy<K extends string>(keys: readonly K[], count: (key: K) => Observable<number>): Observable<Record<K, number>> {
  const requests = Object.fromEntries(keys.map((k) => [k, count(k)])) as Record<K, Observable<number>>;
  return forkJoin(requests) as Observable<Record<K, number>>;
}

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, NgTemplateOutlet, Icon, IncidentTable, StateMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class Dashboard {
  private readonly incidents = inject(IncidentService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);
  protected readonly data = signal<DashboardData | null>(null);

  protected readonly kpis = computed<Kpi[]>(() => {
    const d = this.data();
    if (!d) return [];
    const kpis: Kpi[] = [
      { label: 'Total incidents', value: d.total, hint: 'All statuses', icon: 'list', tone: 'neutral', queryParams: {} },
      { label: 'Open', value: d.byStatus.Open, hint: 'Status Open', icon: 'inbox', tone: 'open', queryParams: { status: 'Open' } },
      {
        label: 'In progress',
        value: d.byStatus.Assigned + d.byStatus.Investigating,
        hint: 'Assigned + Investigating',
        icon: 'progress',
        tone: 'progress',
        queryParams: null,
      },
      { label: 'Critical', value: d.byPriority.P1Critical, hint: 'P1 Critical, all statuses', icon: 'warning', tone: 'critical', queryParams: { priority: 'P1Critical' } },
      { label: 'Resolved', value: d.byStatus.Resolved, hint: 'Status Resolved', icon: 'check', tone: 'resolved', queryParams: { status: 'Resolved' } },
    ];
    return kpis;
  });

  protected readonly statusRows = computed<DistributionRow[]>(() => {
    const d = this.data();
    if (!d) return [];
    return INCIDENT_STATUSES.map((s) => this.row(s, s, d.byStatus[s], d.total, { status: s }));
  });

  protected readonly priorityRows = computed<DistributionRow[]>(() => {
    const d = this.data();
    if (!d) return [];
    return PRIORITIES.map((p) => this.row(p, PRIORITY_LABELS[p], d.byPriority[p], d.total, { priority: p }));
  });

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);

    // No stats endpoint exists, so every number is the API's exact totalCount for a filtered query
    // (pageSize=1). Nothing is computed from a single page of results.
    forkJoin({
      recent: this.incidents.list({ page: 1, pageSize: 5 }),
      byStatus: countBy(INCIDENT_STATUSES, (status) => this.incidents.count({ status })),
      byPriority: countBy(PRIORITIES, (priority) => this.incidents.count({ priority })),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ recent, byStatus, byPriority }) => {
          this.data.set({ total: recent.totalCount, byStatus, byPriority, recent: recent.items });
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err);
          this.loading.set(false);
        },
      });
  }

  private row(key: string, label: string, count: number, total: number, queryParams: Record<string, string>): DistributionRow {
    return { key, label, count, percent: total > 0 ? Math.round((count / total) * 1000) / 10 : 0, queryParams };
  }
}
