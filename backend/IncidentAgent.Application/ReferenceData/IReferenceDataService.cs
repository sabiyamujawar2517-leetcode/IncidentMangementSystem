namespace IncidentAgent.Application.ReferenceData;

public record CategoryDto(Guid Id, string Name, string? Description);

public record ServiceDto(Guid Id, string Name, string? Description, string? OwnerTeam);

public interface IReferenceDataService
{
    Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken ct);
    Task<IReadOnlyList<ServiceDto>> GetServicesAsync(CancellationToken ct);
}
