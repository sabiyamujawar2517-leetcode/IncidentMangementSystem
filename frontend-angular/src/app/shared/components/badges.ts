import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IncidentStatus, Priority } from '../../core/models/incident.models';
import { PriorityLabelPipe } from '../pipes/priority-label.pipe';

@Component({
  selector: 'app-status-badge',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge status-' + status().toLowerCase()">
    <span class="badge-dot" aria-hidden="true"></span>{{ status() }}
  </span>`,
})
export class StatusBadge {
  readonly status = input.required<IncidentStatus>();
}

@Component({
  selector: 'app-priority-badge',
  imports: [PriorityLabelPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="badge" [class]="'badge priority-' + priority().toLowerCase()">{{ priority() | priorityLabel }}</span>`,
})
export class PriorityBadge {
  readonly priority = input.required<Priority>();
}
