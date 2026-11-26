import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, ParamMap, Router, RouterLink } from '@angular/router';
import { BehaviorSubject, EMPTY, catchError, combineLatest, forkJoin, map, switchMap, tap } from 'rxjs';
import { ApiError } from '../../../core/models/api-error';
import {
  INCIDENT_LIMITS,
  INCIDENT_STATUSES,
  IncidentListItem,
  IncidentStatus,
  PRIORITIES,
  PRIORITY_LABELS,
  PagedResult,
  Priority,
  isIncidentStatus,
  isPriority,
} from '../../../core/models/incident.models';
import { ApplicationService, Category } from '../../../core/models/reference-data.models';
import { CurrentUserService, isGuid } from '../../../core/services/current-user.service';
import { IncidentService } from '../../../core/services/incident.service';
import { ReferenceDataService } from '../../../core/services/reference-data.service';
import { Icon } from '../../../shared/components/icon';
import { IncidentTable } from '../../../shared/components/incident-table';
import { Pager } from '../../../shared/components/pager';
import { StateMessage } from '../../../shared/components/state-message';

export type IncidentListMode = 'all' | 'mine';

interface ListFilters {
  status: IncidentStatus | null;
  priority: Priority | null;
  categoryId: string | null;
  serviceId: string | null;
  page: number;
  pageSize: number;
}

const PAGE_SIZES = [10, 20, 50, INCIDENT_LIMITS.maxPageSize] as const;

/** Filters live in the URL query string so they survive reloads, back navigation and shared links. */
function parseFilters(params: ParamMap): ListFilters {
  const page = Number(params.get('page'));
  const pageSize = Number(params.get('pageSize'));
  const status = params.get('status');
  const priority = params.get('priority');
  const categoryId = params.get('categoryId');
  const serviceId = params.get('serviceId');
  return {
    status: isIncidentStatus(status) ? status : null,
    priority: isPriority(priority) ? priority : null,
    categoryId: isGuid(categoryId) ? categoryId : null,
    serviceId: isGuid(serviceId) ? serviceId : null,
    page: Number.isInteger(page) && page >= 1 ? page : 1,
    pageSize: (PAGE_SIZES as readonly number[]).includes(pageSize) ? pageSize : INCIDENT_LIMITS.defaultPageSize,
  };
}

@Component({
  selector: 'app-incident-list',
  imports: [RouterLink, Icon, IncidentTable, Pager, StateMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incident-list.html',
  styleUrl: './incident-list.css',
})
export class IncidentList {
  /** Bound from route data via withComponentInputBinding(). */
  readonly mode = input<IncidentListMode>('all');

  private readonly incidents = inject(IncidentService);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  protected readonly currentUser = inject(CurrentUserService);

  protected readonly statuses = INCIDENT_STATUSES;
  protected readonly priorities = PRIORITIES;
  protected readonly priorityLabels = PRIORITY_LABELS;
  protected readonly pageSizes = PAGE_SIZES;

  protected readonly filters = toSignal(this.route.queryParamMap.pipe(map(parseFilters)), { requireSync: true });

  protected readonly categories = signal<Category[]>([]);
  protected readonly services = signal<ApplicationService[]>([]);
  protected readonly referenceError = signal<string | null>(null);

  protected readonly result = signal<PagedResult<IncidentListItem> | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);

  protected readonly title = computed(() => (this.mode() === 'mine' ? 'My incidents' : 'All incidents'));
  protected readonly needsUser = computed(() => this.mode() === 'mine' && !this.currentUser.userId());
  protected readonly hasFilters = computed(() => {
    const f = this.filters();
    return !!(f.status || f.priority || f.categoryId || f.serviceId);
  });

  private readonly reload$ = new BehaviorSubject<void>(undefined);

  constructor() {
    forkJoin({ categories: this.referenceData.categories(), services: this.referenceData.services() })
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: ({ categories, services }) => {
          this.categories.set(categories);
          this.services.set(services);
        },
        error: (err: ApiError) => this.referenceError.set(`Category and service filters are unavailable: ${err.message}`),
      });

    combineLatest([toObservable(this.filters), toObservable(this.mode), toObservable(this.currentUser.userId), this.reload$])
      .pipe(
        switchMap(([filters, mode, userId]) => {
          if (mode === 'mine' && !userId) {
            this.loading.set(false);
            this.result.set(null);
            return EMPTY;
          }
          this.loading.set(true);
          this.error.set(null);
          return this.incidents.list({ ...filters, assignedToId: mode === 'mine' ? userId : null }).pipe(
            tap((result) => {
              this.result.set(result);
              this.loading.set(false);
            }),
            catchError((err: ApiError) => {
              this.error.set(err);
              this.loading.set(false);
              return EMPTY;
            }),
          );
        }),
        takeUntilDestroyed(),
      )
      .subscribe();
  }

  protected reload(): void {
    this.reload$.next();
  }

  protected setFilter(patch: Partial<ListFilters>): void {
    this.navigate({ ...this.filters(), page: 1, ...patch });
  }

  protected setStatus(value: string): void {
    this.setFilter({ status: isIncidentStatus(value) ? value : null });
  }

  protected setPriority(value: string): void {
    this.setFilter({ priority: isPriority(value) ? value : null });
  }

  protected setPageSize(value: string): void {
    this.setFilter({ pageSize: Number(value) });
  }

  protected clearFilters(): void {
    this.navigate({ status: null, priority: null, categoryId: null, serviceId: null, page: 1, pageSize: this.filters().pageSize });
  }

  protected goToPage(page: number): void {
    this.navigate({ ...this.filters(), page });
  }

  private navigate(f: ListFilters): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        status: f.status,
        priority: f.priority,
        categoryId: f.categoryId,
        serviceId: f.serviceId,
        page: f.page > 1 ? f.page : null,
        pageSize: f.pageSize !== INCIDENT_LIMITS.defaultPageSize ? f.pageSize : null,
      },
    });
  }
}
