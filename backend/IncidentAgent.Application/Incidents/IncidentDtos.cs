using IncidentAgent.Domain.Enums;

namespace IncidentAgent.Application.Incidents;

public record CreateIncidentRequest(
    string? Title,
    string? Description,
    Priority? Priority,
    Guid CategoryId,
    Guid ServiceId,
    Guid ReporterId,
    Guid? ActorUserId);

public record UpdateIncidentRequest(
    string? Title,
    string? Description,
    Priority? Priority,
    Guid CategoryId,
    Guid ServiceId,
    Guid? ActorUserId);

public record AssignIncidentRequest(Guid AssigneeId, Guid? ActorUserId);

public record ChangeStatusRequest(Status? NewStatus, Guid? ActorUserId, string? Note);

public record AddCommentRequest(Guid AuthorId, string? Body);

public record IncidentListQuery(
    int? Page,
    int? PageSize,
    Status? Status,
    Priority? Priority,
    Guid? CategoryId,
    Guid? ServiceId,
    Guid? AssignedToId);

public record IncidentDto(
    Guid Id,
    string IncidentNumber,
    string Title,
    string Description,
    Priority Priority,
    Status Status,
    Guid CategoryId,
    string CategoryName,
    Guid ServiceId,
    string ServiceName,
    Guid ReporterId,
    string ReporterName,
    Guid? AssigneeId,
    string? AssigneeName,
    DateTime CreatedAtUtc,
    DateTime UpdatedAtUtc,
    DateTime? ResolvedAtUtc,
    DateTime? ClosedAtUtc);

public record IncidentListItemDto(
    Guid Id,
    string IncidentNumber,
    string Title,
    Priority Priority,
    Status Status,
    string CategoryName,
    string ServiceName,
    string? AssigneeName,
    DateTime CreatedAtUtc);

public record PagedResult<T>(IReadOnlyList<T> Items, int TotalCount, int Page, int PageSize);

public record IncidentCommentDto(Guid Id, Guid IncidentId, Guid AuthorId, string AuthorName, string Body, DateTime CreatedAtUtc);

public record IncidentHistoryDto(
    Guid Id,
    string FieldName,
    string? OldValue,
    string? NewValue,
    Guid? ChangedById,
    string? ChangedByName,
    DateTime ChangedAtUtc);
