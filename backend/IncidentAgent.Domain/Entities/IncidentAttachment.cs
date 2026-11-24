namespace IncidentAgent.Domain.Entities;

public class IncidentAttachment
{
    public Guid Id { get; set; }

    public Guid IncidentId { get; set; }
    public Incident Incident { get; set; } = null!;

    public Guid UploadedById { get; set; }
    public User UploadedBy { get; set; } = null!;

    public required string FileName { get; set; }
    public required string ContentType { get; set; }
    public long SizeBytes { get; set; }
    public required string StoragePath { get; set; }
    public DateTime UploadedAtUtc { get; set; }
}
