import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { IncidentListItem } from '../../core/models/incident.models';
import { PriorityBadge, StatusBadge } from './badges';

/** Incident table; collapses to stacked cards on small screens (see `.data-table` in styles.css). */
@Component({
  selector: 'app-incident-table',
  imports: [RouterLink, DatePipe, StatusBadge, PriorityBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <table class="data-table">
      <caption class="visually-hidden">{{ caption() }}</caption>
      <thead>
        <tr>
          <th scope="col">Number</th>
          <th scope="col">Title</th>
          @if (!compact()) {
            <th scope="col">Category</th>
            <th scope="col">Service</th>
          }
          <th scope="col">Priority</th>
          <th scope="col">Status</th>
          @if (!compact()) {
            <th scope="col">Assignee</th>
          }
          <th scope="col">Created</th>
          @if (!compact()) {
            <th scope="col"><span class="visually-hidden">Actions</span></th>
          }
        </tr>
      </thead>
      <tbody>
        @for (incident of items(); track incident.id) {
          <tr>
            <td data-label="Number" class="cell-number"><a class="mono" [routerLink]="['/incidents', incident.id]">{{ incident.incidentNumber }}</a></td>
            <td data-label="Title" class="cell-title"><a [routerLink]="['/incidents', incident.id]">{{ incident.title }}</a></td>
            @if (!compact()) {
              <td data-label="Category">{{ incident.categoryName }}</td>
              <td data-label="Service">{{ incident.serviceName }}</td>
            }
            <td data-label="Priority"><app-priority-badge [priority]="incident.priority" /></td>
            <td data-label="Status"><app-status-badge [status]="incident.status" /></td>
            @if (!compact()) {
              <td data-label="Assignee">
                @if (incident.assigneeName) { {{ incident.assigneeName }} } @else { <span class="text-muted">Unassigned</span> }
              </td>
            }
            <td data-label="Created" class="nowrap">
              <time [attr.datetime]="incident.createdAtUtc">{{ incident.createdAtUtc | date: 'd MMM y, HH:mm' }}</time>
            </td>
            @if (!compact()) {
              <td data-label="Actions" class="cell-actions">
                <a class="btn btn-ghost btn-sm" [routerLink]="['/incidents', incident.id]" [attr.aria-label]="'View ' + incident.incidentNumber">View</a>
                @if (incident.status !== 'Closed') {
                  <a class="btn btn-ghost btn-sm" [routerLink]="['/incidents', incident.id, 'edit']" [attr.aria-label]="'Edit ' + incident.incidentNumber">Edit</a>
                }
              </td>
            }
          </tr>
        }
      </tbody>
    </table>
  `,
})
export class IncidentTable {
  readonly items = input.required<IncidentListItem[]>();
  readonly compact = input(false);
  readonly caption = input('Incidents');
}
