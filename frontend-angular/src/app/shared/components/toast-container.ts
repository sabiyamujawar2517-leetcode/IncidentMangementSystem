import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ToastService } from '../../core/services/toast.service';
import { Icon } from './icon';

@Component({
  selector: 'app-toast-container',
  imports: [Icon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="toasts" aria-live="polite">
      @for (toast of toastService.toasts(); track toast.id) {
        <div class="toast" [class]="'toast toast-' + toast.kind" [attr.role]="toast.kind === 'error' ? 'alert' : 'status'">
          <app-icon [name]="toast.kind === 'success' ? 'check' : toast.kind === 'error' ? 'error' : 'info'" [size]="20" />
          <span class="toast-text">{{ toast.message }}</span>
          <button type="button" class="toast-close" (click)="toastService.dismiss(toast.id)" aria-label="Dismiss notification">
            <app-icon name="close" [size]="16" />
          </button>
        </div>
      }
    </div>
  `,
  styles: `
    .toasts { position: fixed; right: 1rem; bottom: 1rem; z-index: 60; display: flex; flex-direction: column; gap: 0.5rem; width: min(24rem, calc(100vw - 2rem)); }
    .toast { display: flex; align-items: flex-start; gap: 0.625rem; padding: 0.75rem 0.875rem; border-radius: var(--radius-md); background: var(--color-surface); box-shadow: var(--shadow-lg); border-left: 4px solid var(--color-primary); animation: toast-in 160ms ease-out; }
    .toast-success { border-left-color: var(--color-success); }
    .toast-success app-icon { color: var(--color-success); }
    .toast-error { border-left-color: var(--color-danger); }
    .toast-error app-icon { color: var(--color-danger); }
    .toast-info app-icon { color: var(--color-primary); }
    .toast-text { flex: 1; font-size: 0.9rem; }
    .toast-close { border: none; background: transparent; color: var(--color-text-muted); padding: 0.125rem; border-radius: var(--radius-sm); cursor: pointer; }
    .toast-close:hover { color: var(--color-text); }
    @keyframes toast-in { from { opacity: 0; transform: translateY(6px); } }
    @media (prefers-reduced-motion: reduce) { .toast { animation: none; } }
  `,
})
export class ToastContainer {
  protected readonly toastService = inject(ToastService);
}
