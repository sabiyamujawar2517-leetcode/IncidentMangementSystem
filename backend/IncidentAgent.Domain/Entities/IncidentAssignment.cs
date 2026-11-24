namespace IncidentAgent.Domain.Entities;

public class IncidentAssignment
{
    public Guid Id { get; set; }

    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    public Guid AssigneeId { get; set; }
    public User Assignee { get; set; } = null!;

    public Guid AssignedById { get; set; }
    public User AssignedBy { get; set; } = null!;

    public DateTime AssignedAtUtc { get; set; }
    public DateTime? UnassignedAtUtc { get; set; }
}
