import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { AbstractControl, FormBuilder, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Observable, forkJoin, of } from 'rxjs';
import { ApiError } from '../../../core/models/api-error';
import { INCIDENT_LIMITS, Incident, PRIORITIES, PRIORITY_LABELS, Priority } from '../../../core/models/incident.models';
import { ApplicationService, Category } from '../../../core/models/reference-data.models';
import { CurrentUserService } from '../../../core/services/current-user.service';
import { IncidentService } from '../../../core/services/incident.service';
import { ReferenceDataService } from '../../../core/services/reference-data.service';
import { ToastService } from '../../../core/services/toast.service';
import { Icon } from '../../../shared/components/icon';
import { StateMessage } from '../../../shared/components/state-message';

type FieldName = 'title' | 'description' | 'priority' | 'categoryId' | 'serviceId';
const FIELD_NAMES: readonly FieldName[] = ['title', 'description', 'priority', 'categoryId', 'serviceId'];

const FIELD_LABELS: Record<FieldName, string> = {
  title: 'Title',
  description: 'Description',
  priority: 'Priority',
  categoryId: 'Category',
  serviceId: 'Application service',
};

const SELECT_PROMPTS: Partial<Record<FieldName, string>> = {
  priority: 'a priority',
  categoryId: 'a category',
  serviceId: 'an application service',
};

/** The API rejects null/whitespace-only text (string.IsNullOrWhiteSpace). */
function notBlank(control: AbstractControl<string>): ValidationErrors | null {
  return control.value && control.value.trim().length === 0 ? { blank: true } : null;
}

@Component({
  selector: 'app-incident-form',
  imports: [ReactiveFormsModule, RouterLink, Icon, StateMessage],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './incident-form.html',
  styleUrl: './incident-form.css',
})
export class IncidentForm {
  /** Route param `:id` (edit mode); undefined on /incidents/new. */
  readonly id = input<string>();

  private readonly incidents = inject(IncidentService);
  private readonly referenceData = inject(ReferenceDataService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly destroyRef = inject(DestroyRef);
  protected readonly currentUser = inject(CurrentUserService);

  protected readonly limits = INCIDENT_LIMITS;
  protected readonly priorities = PRIORITIES;
  protected readonly priorityLabels = PRIORITY_LABELS;

  protected readonly isEdit = computed(() => !!this.id());
  protected readonly loading = signal(true);
  protected readonly loadError = signal<ApiError | null>(null);
  protected readonly saving = signal(false);
  protected readonly submitError = signal<{ message: string; details: string[] } | null>(null);
  protected readonly incident = signal<Incident | null>(null);
  protected readonly categories = signal<Category[]>([]);
  protected readonly services = signal<ApplicationService[]>([]);

  protected readonly isClosed = computed(() => this.incident()?.status === 'Closed');
  protected readonly needsUser = computed(() => !this.isEdit() && !this.currentUser.userId());

  protected readonly form = inject(FormBuilder).nonNullable.group({
    title: ['', [Validators.required, notBlank, Validators.maxLength(INCIDENT_LIMITS.titleMaxLength)]],
    description: ['', [Validators.required, notBlank, Validators.maxLength(INCIDENT_LIMITS.descriptionMaxLength)]],
    priority: ['' as Priority | '', Validators.required],
    categoryId: ['', Validators.required],
    serviceId: ['', Validators.required],
  });

  protected readonly titleLength = signal(0);
  protected readonly descriptionLength = signal(0);

  constructor() {
    this.form.controls.title.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.titleLength.set(v.length));
    this.form.controls.description.valueChanges.pipe(takeUntilDestroyed()).subscribe((v) => this.descriptionLength.set(v.length));
    // Reload when the router reuses this component for a different :id.
    toObservable(this.id).pipe(takeUntilDestroyed()).subscribe(() => this.load());
  }

  protected load(): void {
    this.loading.set(true);
    this.loadError.set(null);
    const id = this.id();
    const incident$: Observable<Incident | null> = id ? this.incidents.get(id) : of(null);

    forkJoin({ categories: this.referenceData.categories(), services: this.referenceData.services(), incident: incident$ })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: ({ categories, services, incident }) => {
          this.categories.set(categories);
          this.services.set(services);
          this.incident.set(incident);
          this.submitError.set(null);
          this.form.enable();
          if (incident) {
            this.form.reset({
              title: incident.title,
              description: incident.description,
              priority: incident.priority,
              categoryId: incident.categoryId,
              serviceId: incident.serviceId,
            });
            if (incident.status === 'Closed') this.form.disable();
          }
          this.loading.set(false);
        },
        error: (err: ApiError) => {
          this.loadError.set(err);
          this.loading.set(false);
        },
      });
  }

  protected errorFor(name: FieldName): string | null {
    const control = this.form.controls[name];
    if (!control.invalid || !(control.touched || control.dirty)) return null;
    const e = control.errors ?? {};
    const label = FIELD_LABELS[name];
    if (e['server']) return e['server'] as string;
    if (e['required'] || e['blank']) return name === 'title' || name === 'description' ? `${label} is required.` : `Select ${SELECT_PROMPTS[name]}.`;
    if (e['maxlength']) return `${label} must be at most ${(e['maxlength'] as { requiredLength: number }).requiredLength} characters.`;
    return `${label} is invalid.`;
  }

  protected submit(): void {
    this.submitError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.focusFirstInvalid();
      return;
    }

    const v = this.form.getRawValue();
    const priority = v.priority as Priority;
    const actorUserId = this.currentUser.userId();
    const id = this.id();

    let request$: Observable<Incident>;
    if (id) {
      request$ = this.incidents.update(id, {
        title: v.title, description: v.description, priority, categoryId: v.categoryId, serviceId: v.serviceId, actorUserId,
      });
    } else {
      if (!actorUserId) return;
      request$ = this.incidents.create({
        title: v.title, description: v.description, priority, categoryId: v.categoryId, serviceId: v.serviceId,
        reporterId: actorUserId, actorUserId: null,
      });
    }

    this.saving.set(true);
    request$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.toast.success(id ? `${saved.incidentNumber} updated.` : `${saved.incidentNumber} created.`);
        this.form.markAsPristine();
        this.router.navigate(['/incidents', saved.id]);
      },
      error: (err: ApiError) => {
        this.saving.set(false);
        this.applyServerErrors(err);
        this.toast.error(id ? 'Could not save the incident.' : 'Could not create the incident.');
      },
    });
  }

  private applyServerErrors(err: ApiError): void {
    const details: string[] = [];
    for (const [key, messages] of Object.entries(err.fieldErrors)) {
      const control = (FIELD_NAMES as readonly string[]).includes(key) ? this.form.controls[key as FieldName] : null;
      if (control) {
        control.setErrors({ ...(control.errors ?? {}), server: messages[0] });
        control.markAsTouched();
      } else {
        const hint = key === 'reporterId' || key === 'actorUserId' ? ' Check the acting user id (top right).' : '';
        details.push(...messages.map((m) => m + hint));
      }
    }
    this.submitError.set({ message: err.message, details });
    this.focusFirstInvalid();
  }

  private focusFirstInvalid(): void {
    const name = FIELD_NAMES.find((n) => this.form.controls[n].invalid);
    if (name) queueMicrotask(() => document.getElementById(`incident-${name}`)?.focus());
  }
}
