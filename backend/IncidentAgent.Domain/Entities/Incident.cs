using IncidentAgent.Domain.Enums;

namespace IncidentAgent.Domain.Entities;

public class Incident
{
    public Guid Id { get; set; }
    public required string IncidentNumber { get; set; }
    public required string Title { get; set; }
    public required string Description { get; set; }
    public Priority Priority { get; set; }
    public Status Status { get; set; } = Status.Open;

    public Guid CategoryId { get; set; }
    public IncidentCategory Category { get; set; } = null!;

    public Guid ServiceId { get; set; }
    public ApplicationService Service { get; set; } = null!;

    public Guid ReporterId { get; set; }
    public User Reporter { get; set; } = null!;

    public Guid? SlaPolicyId { get; set; }
    public SlaPolicy? SlaPolicy { get; set; }

    public DateTime CreatedAtUtc { get; set; }
    public DateTime UpdatedAtUtc { get; set; }
    public DateTime? ResolvedAtUtc { get; set; }
    public DateTime? ClosedAtUtc { get; set; }

    public ICollection<IncidentAssignment> Assignments { get; set; } = new List<IncidentAssignment>();
    public ICollection<IncidentComment> Comments { get; set; } = new List<IncidentComment>();
    public ICollection<IncidentHistory> History { get; set; } = new List<IncidentHistory>();
    public ICollection<IncidentAttachment> Attachments { get; set; } = new List<IncidentAttachment>();
}
