using IncidentAgent.Application.Common;

namespace IncidentAgent.Application.Incidents;

public interface IIncidentService
{
    Task<Result<IncidentDto>> CreateAsync(CreateIncidentRequest request, CancellationToken ct);
    Task<Result<IncidentDto>> GetAsync(Guid id, CancellationToken ct);
    Task<Result<PagedResult<IncidentListItemDto>>> ListAsync(IncidentListQuery query, CancellationToken ct);
    Task<Result<IncidentDto>> UpdateAsync(Guid id, UpdateIncidentRequest request, CancellationToken ct);
    Task<Result<IncidentDto>> AssignAsync(Guid id, AssignIncidentRequest request, CancellationToken ct);
    Task<Result<IncidentDto>> ChangeStatusAsync(Guid id, ChangeStatusRequest request, CancellationToken ct);
    Task<Result<IncidentCommentDto>> AddCommentAsync(Guid id, AddCommentRequest request, CancellationToken ct);
    Task<Result<IReadOnlyList<IncidentHistoryDto>>> GetHistoryAsync(Guid id, CancellationToken ct);
}
