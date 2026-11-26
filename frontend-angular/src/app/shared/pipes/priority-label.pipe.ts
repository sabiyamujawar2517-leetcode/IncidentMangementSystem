import { Pipe, PipeTransform } from '@angular/core';
import { PRIORITY_LABELS, isPriority } from '../../core/models/incident.models';

/** `P1Critical` → `P1 Critical`. Unknown values pass through unchanged. */
@Pipe({ name: 'priorityLabel' })
export class PriorityLabelPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    return isPriority(value) ? PRIORITY_LABELS[value] : value;
  }
}
