import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { Icon, IconName } from './icon';

export type StateKind = 'loading' | 'error' | 'empty';

/** Consistent loading / error / empty block. Projected content renders below the message (e.g. a CTA). */
@Component({
  selector: 'app-state-message',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="state" [class.state-error]="kind() === 'error'" [attr.role]="kind() === 'error' ? 'alert' : 'status'">
      @if (kind() === 'loading') {
        <span class="spinner" aria-hidden="true"></span>
      } @else {
        <app-icon [name]="icon()" [size]="32" />
      }
      <p class="state-title">{{ title() }}</p>
      @if (message()) {
        <p class="state-message">{{ message() }}</p>
      }
      <div class="state-actions">
        @if (kind() === 'error' && retryable()) {
          <button type="button" class="btn btn-secondary btn-sm" (click)="retry.emit()">Try again</button>
        }
        <ng-content />
      </div>
    </div>
  `,
  styles: `
    .state { display: flex; flex-direction: column; align-items: center; text-align: center; gap: 0.5rem; padding: 2.5rem 1rem; color: var(--color-text-muted); }
    .state-error { color: var(--color-danger); }
    .state-title { margin: 0; font-weight: 600; color: var(--color-text); }
    .state-message { margin: 0; max-width: 42rem; }
    .state-actions { display: flex; gap: 0.5rem; flex-wrap: wrap; justify-content: center; margin-top: 0.25rem; }
    .state-actions:empty { display: none; }
  `,
})
export class StateMessage {
  readonly kind = input.required<StateKind>();
  readonly title = input.required<string>();
  readonly message = input<string | null>(null);
  readonly retryable = input(true);
  readonly retry = output<void>();

  protected readonly icon = computed<IconName>(() => (this.kind() === 'error' ? 'error' : 'inbox'));
}
