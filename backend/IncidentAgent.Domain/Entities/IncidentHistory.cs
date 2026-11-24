namespace IncidentAgent.Domain.Entities;

public class IncidentHistory
{
    public Guid Id { get; set; }

    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    public Guid? ChangedById { get; set; }
    public User? ChangedBy { get; set; }

    public required string FieldName { get; set; }
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public DateTime ChangedAtUtc { get; set; }
}
