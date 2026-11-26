import { Injectable, computed, signal } from '@angular/core';

const STORAGE_KEY = 'incidentagent.actingUserId';
const GUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function isGuid(value: string | null | undefined): value is string {
  return GUID_PATTERN.test((value ?? '').trim());
}

/**
 * The API has no authentication and no users endpoint, but create (reporterId), comment (authorId),
 * "My incidents" (assignedToId) and the optional actorUserId all need a user id.
 * This holds a user id the person enters once; it is stored in localStorage and the API validates it on use.
 */
@Injectable({ providedIn: 'root' })
export class CurrentUserService {
  private readonly _userId = signal<string | null>(this.read());

  readonly userId = this._userId.asReadonly();
  readonly isSet = computed(() => this._userId() !== null);

  set(userId: string): boolean {
    const value = userId.trim().toLowerCase();
    if (!isGuid(value)) return false;
    this._userId.set(value);
    this.write(value);
    return true;
  }

  clear(): void {
    this._userId.set(null);
    this.write(null);
  }

  private read(): string | null {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return isGuid(stored) ? stored : null;
    } catch {
      return null;
    }
  }

  private write(value: string | null): void {
    try {
      if (value) localStorage.setItem(STORAGE_KEY, value);
      else localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable (private mode): keep the in-memory value only.
    }
  }
}
