import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ApiError, allFieldMessages } from '../../../core/models/api-error';
import {
  INCIDENT_LIMITS,
  Incident,
  IncidentComment,
  IncidentHistoryEntry,
  IncidentStatus,
  PRIORITY_LABELS,
  STATUS_TRANSITIONS,
  isPriority,
} from '../../../core/models/incident.models';
import { ConfirmService } from '../../../core/services/confirm.service';
import { CurrentUserService, isGuid } from '../../../core/services/current-user.service';
import { IncidentService } from '../../../core/services/incident.service';
import { ReferenceDataService } from '../../../core/services/reference-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { PriorityBadge, StatusBadge } from '../../../shared/components/badges';
import { Icon } from '../../../shared/components/icon';
import { StateMessage } from '../../../shared/components/state-message';

interface HistoryView {
  id: string;
  title: string;
  from: string | null;
  to: string | null;
  by: string;
  at: string;
}

type ActionKey = 'assign' | 'status' | 'comment';

@Component({
  selector: 'app-incident-details',
  imports: [DatePipe, ReactiveFormsModule, RouterLink, Icon, StatusBadge, PriorityBadge, StateMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incident-details.html',
  styleUrl: './incident-details.css',
})
export class IncidentDetails implements OnInit {
  /** Route param `:id`. */
  readonly id = input.required<string>();

  private readonly incidents = inject(IncidentService);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly currentUser = inject(CurrentUserService);

  protected readonly limits = INCIDENT_LIMITS;

  protected readonly incident = signal<Incident | null>(null);
  protected readonly loading = signal(true);
  protected readonly error = signal<ApiError | null>(null);

  protected readonly history = signal<IncidentHistoryEntry[]>([]);
  protected readonly historyLoading = signal(false);
  protected readonly historyError = signal<ApiError | null>(null);

  /** Comments created from this page. The API has no endpoint to list existing comments. */
  protected readonly sessionComments = signal<IncidentComment[]>([]);

  private readonly categoryNames = signal(new Map<string, string>());
  private readonly serviceNames = signal(new Map<string, string>());

  protected readonly busy = signal<ActionKey | null>(null);
  protected readonly actionError = signal<{ action: ActionKey; message: string } | null>(null);

  protected readonly assigneeControl = new FormControl('', { nonNullable: true, validators: [Validators.required] });
  protected readonly statusControl = new FormControl<IncidentStatus | ''>('', { nonNullable: true, validators: [Validators.required] });
  protected readonly noteControl = new FormControl('', { nonNullable: true, validators: [Validators.maxLength(INCIDENT_LIMITS.commentMaxLength)] });
  protected readonly commentControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(INCIDENT_LIMITS.commentMaxLength)],
  });

  protected readonly isClosed = computed(() => this.incident()?.status === 'Closed');
  protected readonly allowedStatuses = computed(() => {
    const i = this.incident();
    return i ? STATUS_TRANSITIONS[i.status] : [];
  });

  /** Users whose id → name mapping the API has given us (reporter, assignee, history actors, comment authors). */
  protected readonly knownUsers = computed(() => {
    const users = new Map<string, string>();
    const i = this.incident();
    if (i) {
      users.set(i.reporterId, i.reporterName);
      if (i.assigneeId && i.assigneeName) users.set(i.assigneeId, i.assigneeName);
    }
    for (const h of this.history()) if (h.changedById && h.changedByName) users.set(h.changedById, h.changedByName);
    for (const c of this.sessionComments()) users.set(c.authorId, c.authorName);
    return users;
  });

  protected readonly knownUserList = computed(() => [...this.knownUsers()].map(([id, name]) => ({ id, name })));

  protected readonly historyView = computed<HistoryView[]>(() =>
    [...this.history()].reverse().map((h) => ({
      id: h.id,
      title: this.historyTitle(h.fieldName),
      from: h.fieldName === 'Created' ? null : this.formatValue(h.fieldName, h.oldValue),
      to: this.formatValue(h.fieldName, h.newValue),
      by: h.changedByName ?? 'System',
      at: h.changedAtUtc,
    })),
  );

  constructor() {
    // The router reuses this component when only :id changes, so reload on every id change.
    toObservable(this.id)
      .pipe(takeUntilDestroyed())
      .subscribe(() => {
        this.incident.set(null);
        this.history.set([]);
        this.sessionComments.set([]);
        this.actionError.set(null);
        this.load();
      });
  }

  ngOnInit(): void {
    forkJoin({ categories: this.referenceData.categories(), services: this.referenceData.services() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, services }) => {
          this.categoryNames.set(new Map(categories.map((c) => [c.id, c.name])));
          this.serviceNames.set(new Map(services.map((s) => [s.id, s.name])));
        },
        // Non-fatal: history then shows raw ids for category/service changes.
        error: () => undefined,
      });
  }

  protected load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.incidents
      .get(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (incident) => {
          this.incident.set(incident);
          this.loading.set(false);
          this.loadHistory();
        },
        error: (err: ApiError) => {
          this.error.set(err);
          this.loading.set(false);
        },
      });
  }

  protected loadHistory(): void {
    this.historyLoading.set(true);
    this.historyError.set(null);
    this.incidents
      .history(this.id())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (history) => {
          this.history.set(history);
          this.historyLoading.set(false);
        },
        error: (err: ApiError) => {
          this.historyError.set(err);
          this.historyLoading.set(false);
        },
      });
  }

  protected userName(id: string): string {
    return this.knownUsers().get(id) ?? `user ${id.slice(0, 8)}…`;
  }

  protected assignToMe(): void {
    const me = this.currentUser.userId();
    if (me) {
      this.assigneeControl.setValue(me);
      void this.assign();
    }
  }

  protected async assign(): Promise<void> {
    const incident = this.incident();
    const assigneeId = this.assigneeControl.value.trim().toLowerCase();
    this.actionError.set(null);
    if (!incident) return;
    if (!isGuid(assigneeId)) {
      this.assigneeControl.markAsTouched();
      this.actionError.set({ action: 'assign', message: 'Enter a valid user id (GUID).' });
      return;
    }

    const statusNote = incident.status === 'Open' ? '\nThe status will change from Open to Assigned.' : '';
    const ok = await this.confirm.confirm({
      title: 'Assign incident',
      message: `Assign ${incident.incidentNumber} to ${this.userName(assigneeId)}?${statusNote}`,
      confirmText: 'Assign',
    });
    if (!ok) return;

    this.busy.set('assign');
    this.incidents
      .assign(incident.id, { assigneeId, actorUserId: this.currentUser.userId() })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.afterUpdate(updated, `${updated.incidentNumber} assigned to ${updated.assigneeName ?? 'user'}.`);
          this.assigneeControl.reset();
        },
        error: (err: ApiError) => this.fail('assign', err),
      });
  }

  protected async changeStatus(): Promise<void> {
    const incident = this.incident();
    const newStatus = this.statusControl.value;
    const note = this.noteControl.value.trim();
    const actorUserId = this.currentUser.userId();
    this.actionError.set(null);
    if (!incident || !newStatus) {
      this.statusControl.markAsTouched();
      return;
    }
    if (this.noteControl.invalid) return;
    if (note && !actorUserId) {
      this.actionError.set({ action: 'status', message: 'A note is saved as a comment, so the API needs an acting user. Set it (top right) or clear the note.' });
      return;
    }

    const closing = newStatus === 'Closed';
    const ok = await this.confirm.confirm({
      title: closing ? 'Close incident' : 'Change status',
      message: closing
        ? `Close ${incident.incidentNumber}? Closed incidents can't be updated, reassigned, commented on or reopened.`
        : `Change ${incident.incidentNumber} from ${incident.status} to ${newStatus}?`,
      confirmText: closing ? 'Close incident' : 'Change status',
      danger: closing,
    });
    if (!ok) return;

    this.busy.set('status');
    this.incidents
      .changeStatus(incident.id, { newStatus, actorUserId, note: note || null })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.afterUpdate(updated, `${updated.incidentNumber} is now ${updated.status}.${note ? ' The note was saved as a comment.' : ''}`);
          this.statusControl.reset();
          this.noteControl.reset();
        },
        error: (err: ApiError) => this.fail('status', err),
      });
  }

  protected addComment(): void {
    const incident = this.incident();
    const authorId = this.currentUser.userId();
    const body = this.commentControl.value.trim();
    this.actionError.set(null);
    if (!incident || !authorId) return;
    if (this.commentControl.invalid || !body) {
      this.commentControl.markAsTouched();
      this.actionError.set({ action: 'comment', message: 'Write a comment first.' });
      return;
    }

    this.busy.set('comment');
    this.incidents
      .addComment(incident.id, { authorId, body })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (comment) => {
          this.busy.set(null);
          this.sessionComments.update((list) => [comment, ...list]);
          this.commentControl.reset();
          this.toast.success('Comment added.');
        },
        error: (err: ApiError) => this.fail('comment', err),
      });
  }

  private afterUpdate(updated: Incident, message: string): void {
    this.busy.set(null);
    this.incident.set(updated);
    this.toast.success(message);
    this.loadHistory();
  }

  private fail(action: ActionKey, err: ApiError): void {
    this.busy.set(null);
    const details = allFieldMessages(err);
    this.actionError.set({ action, message: details.length ? details.join(' ') : err.message });
    this.toast.error(err.message);
    // 409 usually means the incident changed elsewhere; refresh so the UI shows the real state.
    if (err.status === 409) this.load();
  }

  private historyTitle(field: string): string {
    switch (field) {
      case 'Created': return 'Incident created';
      case 'CategoryId': return 'Category changed';
      case 'ServiceId': return 'Service changed';
      case 'Assignee': return 'Assignee changed';
      default: return `${field} changed`;
    }
  }

  private formatValue(field: string, value: string | null): string | null {
    if (value === null || value === '') return null;
    switch (field) {
      case 'Priority': return isPriority(value) ? PRIORITY_LABELS[value] : value;
      case 'CategoryId': return this.categoryNames().get(value) ?? value;
      case 'ServiceId': return this.serviceNames().get(value) ?? value;
      case 'Assignee': return this.knownUsers().get(value) ?? `user ${value.slice(0, 8)}…`;
      default: return value;
    }
  }
}
