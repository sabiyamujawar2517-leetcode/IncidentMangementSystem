import { Injectable, signal } from '@angular/core';

export interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  danger?: boolean;
}

export interface ConfirmRequest extends ConfirmOptions {
  resolve: (confirmed: boolean) => void;
}

/** Promise-based confirmation; rendered by ConfirmDialog in the main layout. */
@Injectable({ providedIn: 'root' })
export class ConfirmService {
  private readonly _request = signal<ConfirmRequest | null>(null);
  readonly request = this._request.asReadonly();

  confirm(options: ConfirmOptions): Promise<boolean> {
    this._request()?.resolve(false);
    return new Promise<boolean>((resolve) => this._request.set({ ...options, resolve }));
  }

  settle(confirmed: boolean): void {
    const pending = this._request();
    if (!pending) return;
    this._request.set(null);
    pending.resolve(confirmed);
  }
}
