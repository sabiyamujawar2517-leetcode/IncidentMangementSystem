namespace IncidentAgent.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public required string Email { get; set; }
    public required string DisplayName { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAtUtc { get; set; }

    public ICollection<Incident> ReportedIncidents { get; set; } = new List<Incident>();
}
