import { ChangeDetectionStrategy, Component, ElementRef, effect, inject, viewChild } from '@angular/core';
import { ConfirmService } from '../../core/services/confirm.service';

/** Native <dialog> (focus trap + Esc for free) driven by ConfirmService. Mounted once in the main layout. */
@Component({
  selector: 'app-confirm-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <dialog #dialog class="dialog" aria-labelledby="confirm-title" aria-describedby="confirm-message" (close)="confirm.settle(false)">
      @if (confirm.request(); as req) {
        <h2 id="confirm-title" class="dialog-title">{{ req.title }}</h2>
        <p id="confirm-message" class="dialog-message">{{ req.message }}</p>
        <div class="dialog-actions">
          <button type="button" class="btn btn-secondary" (click)="confirm.settle(false)">Cancel</button>
          <button type="button" class="btn" [class.btn-danger]="req.danger" [class.btn-primary]="!req.danger" (click)="confirm.settle(true)" autofocus>
            {{ req.confirmText ?? 'Confirm' }}
          </button>
        </div>
      }
    </dialog>
  `,
  styles: `
    .dialog { border: none; border-radius: var(--radius-lg); padding: 1.5rem; width: min(28rem, calc(100vw - 2rem)); box-shadow: var(--shadow-lg); color: var(--color-text); }
    .dialog::backdrop { background: rgb(15 27 51 / 0.45); }
    .dialog-title { margin: 0 0 0.5rem; font-size: 1.125rem; }
    .dialog-message { margin: 0 0 1.25rem; color: var(--color-text-muted); white-space: pre-line; }
    .dialog-actions { display: flex; justify-content: flex-end; gap: 0.5rem; flex-wrap: wrap; }
  `,
})
export class ConfirmDialog {
  protected readonly confirm = inject(ConfirmService);
  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  constructor() {
    effect(() => {
      const el = this.dialog().nativeElement;
      if (this.confirm.request()) {
        if (!el.open) el.showModal();
      } else if (el.open) {
        el.close();
      }
    });
  }
}
