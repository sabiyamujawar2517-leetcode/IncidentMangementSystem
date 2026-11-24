using IncidentAgent.Application.ReferenceData;
using IncidentAgent.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;

namespace IncidentAgent.Infrastructure.Services;

public class ReferenceDataService(ApplicationDbContext db) : IReferenceDataService
{
    public async Task<IReadOnlyList<CategoryDto>> GetCategoriesAsync(CancellationToken ct) =>
        await db.IncidentCategories.AsNoTracking()
            .OrderBy(c => c.Name)
            .Select(c => new CategoryDto(c.Id, c.Name, c.Description))
            .ToListAsync(ct);

    public async Task<IReadOnlyList<ServiceDto>> GetServicesAsync(CancellationToken ct) =>
        await db.ApplicationServices.AsNoTracking()
            .OrderBy(s => s.Name)
            .Select(s => new ServiceDto(s.Id, s.Name, s.Description, s.OwnerTeam))
            .ToListAsync(ct);
}
