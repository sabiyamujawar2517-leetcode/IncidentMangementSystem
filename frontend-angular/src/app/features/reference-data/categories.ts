import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { ApiError } from '../../core/models/api-error';
import { Category } from '../../core/models/reference-data.models';
import { ReferenceDataService } from '../../core/services/reference-data.service';
import { StateMessage } from '../../shared/components/state-message';

/** Read-only: the API exposes GET /api/categories only. */
@Component({
  selector: 'app-categories',
  imports: [RouterLink, StateMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div>
        <h1 class="page-title">Categories</h1>
        <p class="page-subtitle">Incident categories, read-only. The API has no endpoints to create, edit or delete them.</p>
      </div>
    </header>

    <section class="card" aria-label="Categories">
      @if (error(); as err) {
        <app-state-message kind="error" [title]="err.title" [message]="err.message" (retry)="load()" />
      } @else if (loading()) {
        <app-state-message kind="loading" title="Loading categories…" />
      } @else if (items().length === 0) {
        <app-state-message kind="empty" title="No categories" message="The API returned no categories." [retryable]="false" />
      } @else {
        <table class="data-table">
          <caption class="visually-hidden">Categories</caption>
          <thead>
            <tr><th scope="col">Name</th><th scope="col">Description</th><th scope="col"><span class="visually-hidden">Actions</span></th></tr>
          </thead>
          <tbody>
            @for (c of items(); track c.id) {
              <tr>
                <td data-label="Name"><strong>{{ c.name }}</strong></td>
                <td data-label="Description">@if (c.description) { {{ c.description }} } @else { <span class="text-muted">—</span> }</td>
                <td data-label="Actions" class="cell-actions">
                  <a class="btn btn-ghost btn-sm" routerLink="/incidents" [queryParams]="{ categoryId: c.id }">View incidents</a>
                </td>
              </tr>
            }
          </tbody>
        </table>
        <p class="table-footer">{{ items().length }} categories</p>
      }
    </section>
  `,
})
export class Categories {
  private readonly referenceData = inject(ReferenceDataService);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly items = signal<Category[]>([]);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);

  constructor() {
    this.load();
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.referenceData
      .categories()
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
