namespace IncidentAgent.BlazorUi.Models;

// Mirrors the API JSON (enums are serialised by the API as strings).
public enum Priority { P1Critical, P2High, P3Medium, P4Low }

public enum IncidentStatus { Open, Assigned, Investigating, Pending, Resolved, Closed }

public record IncidentListItem(
    Guid Id,
    string IncidentNumber,
    string Title,
    Priority Priority,
    IncidentStatus Status,
    string CategoryName,
    string ServiceName,
    string? AssigneeName,
    DateTime CreatedAtUtc);

public record IncidentDetail(
    Guid Id,
    string IncidentNumber,
    string Title,
    string Description,
    Priority Priority,
    IncidentStatus Status,
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

public record IncidentHistoryEntry(
    Guid Id,
    string FieldName,
    string? OldValue,
    string? NewValue,
    Guid? ChangedById,
    string? ChangedByName,
    DateTime ChangedAtUtc);

public record Category(Guid Id, string Name, string? Description);

public record AppService(Guid Id, string Name, string? Description, string? OwnerTeam);

public record PagedResult<T>(List<T> Items, int TotalCount, int Page, int PageSize);

public record ProblemDetailsResponse(string? Title, string? Detail, int? Status, Dictionary<string, string[]>? Errors);

/// <summary>Server-side filters supported by GET /api/incidents.</summary>
public record IncidentFilter
{
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
    public IncidentStatus? Status { get; init; }
    public Priority? Priority { get; init; }
    public Guid? CategoryId { get; init; }
    public Guid? ServiceId { get; init; }

    public string ToQueryString()
    {
        var parts = new List<string> { $"page={Page}", $"pageSize={PageSize}" };
        if (Status is { } s) parts.Add($"status={s}");
        if (Priority is { } p) parts.Add($"priority={p}");
        if (CategoryId is { } c) parts.Add($"categoryId={c}");
        if (ServiceId is { } v) parts.Add($"serviceId={v}");
        return "?" + string.Join('&', parts);
    }
}
