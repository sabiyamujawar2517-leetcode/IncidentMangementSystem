using IncidentAgent.Domain.Enums;

namespace IncidentAgent.Domain.Entities;

public class SlaPolicy
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public Priority Priority { get; set; }
    public int ResponseTimeMinutes { get; set; }
    public int ResolutionTimeMinutes { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }

    public ICollection<Incident> Incidents { get; set; } = new List<Incident>();
}
