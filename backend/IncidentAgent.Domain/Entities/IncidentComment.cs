namespace IncidentAgent.Domain.Entities;

public class IncidentComment
{
    public const int BodyMaxLength = 4000;

    public Guid Id { get; set; }

    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    public Guid AuthorId { get; set; }
    public User Author { get; set; } = null!;

    public required string Body { get; set; }
    public DateTime CreatedAtUtc { get; set; }
}
