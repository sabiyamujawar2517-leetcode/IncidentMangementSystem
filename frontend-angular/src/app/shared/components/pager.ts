import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon } from './icon';

/** Server-side pagination control driven by PagedResult metadata (page, pageSize, totalCount). */
@Component({
  selector: 'app-pager',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <nav class="pager" aria-label="Pagination">
      <p class="pager-summary">
        @if (totalCount() > 0) {
          Showing <strong>{{ first() }}–{{ last() }}</strong> of <strong>{{ totalCount() }}</strong>
        } @else {
          No results
        }
      </p>
      @if (totalPages() > 1) {
        <ul class="pager-pages">
          <li>
            <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() <= 1" (click)="go(page() - 1)" aria-label="Previous page">
              <app-icon name="chevronLeft" [size]="18" />
            </button>
          </li>
          @for (p of pages(); track $index) {
            <li>
              @if (p === null) {
                <span class="pager-gap" aria-hidden="true">…</span>
              } @else {
                <button type="button" class="btn btn-sm" [class.btn-primary]="p === page()" [class.btn-ghost]="p !== page()"
                        [attr.aria-current]="p === page() ? 'page' : null" [attr.aria-label]="'Page ' + p" (click)="go(p)">{{ p }}</button>
              }
            </li>
          }
          <li>
            <button type="button" class="btn btn-ghost btn-sm" [disabled]="page() >= totalPages()" (click)="go(page() + 1)" aria-label="Next page">
              <app-icon name="chevronRight" [size]="18" />
            </button>
          </li>
        </ul>
      }
    </nav>
  `,
  styles: `
    .pager { display: flex; align-items: center; justify-content: space-between; gap: 0.75rem; flex-wrap: wrap; padding: 0.75rem 1rem; border-top: 1px solid var(--color-border); }
    .pager-summary { margin: 0; color: var(--color-text-muted); font-size: 0.875rem; }
    .pager-pages { display: flex; gap: 0.25rem; list-style: none; margin: 0; padding: 0; flex-wrap: wrap; }
    .pager-pages .btn { min-width: 2.25rem; justify-content: center; }
    .pager-gap { display: inline-block; padding: 0.375rem 0.25rem; color: var(--color-text-muted); }
  `,
})
export class Pager {
  readonly page = input.required<number>();
  readonly pageSize = input.required<number>();
  readonly totalCount = input.required<number>();
  readonly pageChange = output<number>();

  protected readonly totalPages = computed(() => Math.max(1, Math.ceil(this.totalCount() / this.pageSize())));
  protected readonly first = computed(() => Math.min(this.totalCount(), (this.page() - 1) * this.pageSize() + 1));
  protected readonly last = computed(() => Math.min(this.totalCount(), this.page() * this.pageSize()));

  /** Page numbers with null for gaps: 1 … 4 5 6 … 12 */
  protected readonly pages = computed<(number | null)[]>(() => {
    const total = this.totalPages();
    const current = this.page();
    const wanted = new Set([1, total, current - 1, current, current + 1].filter((p) => p >= 1 && p <= total));
    const sorted = [...wanted].sort((a, b) => a - b);
    const result: (number | null)[] = [];
    sorted.forEach((p, i) => {
      if (i > 0 && p - sorted[i - 1] > 1) result.push(null);
      result.push(p);
    });
    return result;
  });

  protected go(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page()) this.pageChange.emit(page);
  }
}
