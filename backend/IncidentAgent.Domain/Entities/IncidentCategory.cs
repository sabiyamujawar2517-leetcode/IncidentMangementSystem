namespace IncidentAgent.Domain.Entities;

public class IncidentCategory
{
    public Guid Id { get; set; }
    public required string Name { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAtUtc { get; set; }

    public ICollection<Incident> Incidents { get; set; } = new List<Incident>();
}
