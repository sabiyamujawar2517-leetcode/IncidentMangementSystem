using System.Globalization;

namespace IncidentAgent.BlazorUi.Shared;

public static class Format
{
    /// <summary>UTC from the API -> the user's local time, e.g. "24 Nov 2026, 14:05".</summary>
    public static string LocalDateTime(DateTime utc) =>
        DateTime.SpecifyKind(utc, DateTimeKind.Utc).ToLocalTime().ToString("d MMM yyyy, HH:mm", CultureInfo.InvariantCulture);

    public static string LocalDateTime(DateTime? utc) => utc is { } value ? LocalDateTime(value) : "—";

    public static string PriorityLabel(Models.Priority priority) => priority switch
    {
        Models.Priority.P1Critical => "P1 Critical",
        Models.Priority.P2High => "P2 High",
        Models.Priority.P3Medium => "P3 Medium",
        _ => "P4 Low"
    };
}
