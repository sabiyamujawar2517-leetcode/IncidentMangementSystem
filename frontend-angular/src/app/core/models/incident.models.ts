// Typed mirrors of the DTOs in IncidentAgent.Application/Incidents/IncidentDtos.cs.
// The API serializes enums as strings (JsonStringEnumConverter) and properties as camelCase.
// DateTime values arrive as ISO-8601 UTC strings.

export const PRIORITIES = ['P1Critical', 'P2High', 'P3Medium', 'P4Low'] as const;
export type Priority = (typeof PRIORITIES)[number];

export const INCIDENT_STATUSES = ['Open', 'Assigned', 'Investigating', 'Pending', 'Resolved', 'Closed'] as const;
export type IncidentStatus = (typeof INCIDENT_STATUSES)[number];

export const PRIORITY_LABELS: Readonly<Record<Priority, string>> = {
  P1Critical: 'P1 Critical',
  P2High: 'P2 High',
  P3Medium: 'P3 Medium',
  P4Low: 'P4 Low',
};

/**
 * Mirrors IncidentAgent.Domain.Rules.IncidentStatusTransitions so the UI only offers valid moves.
 * The API stays the authority and answers 409 Conflict for anything else.
 */
export const STATUS_TRANSITIONS: Readonly<Record<IncidentStatus, readonly IncidentStatus[]>> = {
  Open: ['Assigned', 'Investigating', 'Closed'],
  Assigned: ['Investigating', 'Pending', 'Open'],
  Investigating: ['Pending', 'Resolved', 'Assigned'],
  Pending: ['Investigating', 'Resolved'],
  Resolved: ['Closed', 'Investigating'],
  Closed: [],
};

/** Backend limits: Incident.TitleMaxLength, Incident.DescriptionMaxLength, IncidentComment.BodyMaxLength, IncidentService paging. */
export const INCIDENT_LIMITS = {
  titleMaxLength: 200,
  descriptionMaxLength: 4000,
  commentMaxLength: 4000,
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
}

export interface IncidentListItem {
  id: string;
  incidentNumber: string;
  title: string;
  priority: Priority;
  status: IncidentStatus;
  categoryName: string;
  serviceName: string;
  assigneeName: string | null;
  createdAtUtc: string;
}

export interface Incident {
  id: string;
  incidentNumber: string;
  title: string;
  description: string;
  priority: Priority;
  status: IncidentStatus;
  categoryId: string;
  categoryName: string;
  serviceId: string;
  serviceName: string;
  reporterId: string;
  reporterName: string;
  assigneeId: string | null;
  assigneeName: string | null;
  createdAtUtc: string;
  updatedAtUtc: string;
  resolvedAtUtc: string | null;
  closedAtUtc: string | null;
}

/** Query string of GET /api/incidents. There are no search or sort parameters. */
export interface IncidentListQuery {
  page?: number;
  pageSize?: number;
  status?: IncidentStatus | null;
  priority?: Priority | null;
  categoryId?: string | null;
  serviceId?: string | null;
  assignedToId?: string | null;
}

export interface CreateIncidentRequest {
  title: string;
  description: string;
  priority: Priority;
  categoryId: string;
  serviceId: string;
  reporterId: string;
  actorUserId: string | null;
}

export interface UpdateIncidentRequest {
  title: string;
  description: string;
  priority: Priority;
  categoryId: string;
  serviceId: string;
  actorUserId: string | null;
}

export interface AssignIncidentRequest {
  assigneeId: string;
  actorUserId: string | null;
}

/** When `note` is not null the API requires `actorUserId` (the note is stored as a comment by that user). */
export interface ChangeStatusRequest {
  newStatus: IncidentStatus;
  actorUserId: string | null;
  note: string | null;
}

export interface AddCommentRequest {
  authorId: string;
  body: string;
}

export interface IncidentComment {
  id: string;
  incidentId: string;
  authorId: string;
  authorName: string;
  body: string;
  createdAtUtc: string;
}

export interface IncidentHistoryEntry {
  id: string;
  fieldName: string;
  oldValue: string | null;
  newValue: string | null;
  changedById: string | null;
  changedByName: string | null;
  changedAtUtc: string;
}

export function isPriority(value: string | null | undefined): value is Priority {
  return (PRIORITIES as readonly string[]).includes(value ?? '');
}

export function isIncidentStatus(value: string | null | undefined): value is IncidentStatus {
  return (INCIDENT_STATUSES as readonly string[]).includes(value ?? '');
}
