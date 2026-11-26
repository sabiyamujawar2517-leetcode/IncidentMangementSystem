import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../core/models/api-error';
import { ApplicationService } from '../../core/models/reference-data.models';
import { ReferenceDataService } from '../../core/services/reference-data.service';
import { StateMessage } from '../../shared/components/state-message';

/** Read-only: the API exposes GET /api/services only. */
@Component({
  selector: 'app-application-services',
  imports: [RouterLink, StateMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">Application services</h1>
        <p class="page-subtitle">Services incidents can be raised against, read-only. The API has no endpoints to create, edit or delete them.</p>
      </div>
    </header>

    <section class="card" aria-label="Application services">
      @if (error(); as err) {
        <app-state-message kind="error" [title]="err.title" [message]="err.message" (retry)="load()" />
      } @else if (loading()) {
        <app-state-message kind="loading" title="Loading services…" />
      } @else if (items().length === 0) {
        <app-state-message kind="empty" title="No services" message="The API returned no application services." [retryable]="false" />
      } @else {
        <table class="data-table">
          <caption class="visually-hidden">Application services</caption>
          <thead>
            <tr>
              <th scope="col">Name</th><th scope="col">Owner team</th><th scope="col">Description</th>
              <th scope="col"><span class="visually-hidden">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            @for (s of items(); track s.id) {
              <tr>
                <td data-label="Name"><strong>{{ s.name }}</strong></td>
                <td data-label="Owner team">@if (s.ownerTeam) { {{ s.ownerTeam }} } @else { <span class="text-muted">—</span> }</td>
                <td data-label="Description">@if (s.description) { {{ s.description }} } @else { <span class="text-muted">—</span> }</td>
                <td data-label="Actions" class="cell-actions">
                  <a class="btn btn-ghost btn-sm" routerLink="/incidents" [queryParams]="{ serviceId: s.id }">View incidents</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
        <p class="table-footer">{{ items().length }} services</p>
      }
    </section>
  `,
})
export class ApplicationServices {
  private readonly referenceData = inject(ReferenceDataService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly items = signal<ApplicationService[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.referenceData
      .services()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (items) => {
          this.items.set(items);
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.error.set(err);
          this.loading.set(false);
        },
      });
  }
}
