using System.Linq.Expressions;
using IncidentAgent.Application.Common;
using IncidentAgent.Application.Incidents;
using IncidentAgent.Domain.Entities;
using IncidentAgent.Domain.Enums;
using IncidentAgent.Domain.Rules;
using IncidentAgent.Infrastructure.Persistence;
using Microsoft.EntityFrameworkCore;
using Npgsql;

namespace IncidentAgent.Infrastructure.Services;

public class IncidentService(ApplicationDbContext db) : IIncidentService
{
    private const int DefaultPageSize = 20;
    private const int MaxPageSize = 100;

    private static readonly Expression<Func<Incident, IncidentDto>> ToDto = i => new IncidentDto(
        i.Id, i.IncidentNumber, i.Title, i.Description, i.Priority, i.Status,
        i.CategoryId, i.Category.Name,
        i.ServiceId, i.Service.Name,
        i.ReporterId, i.Reporter.DisplayName,
        i.Assignments.Where(a => a.UnassignedAtUtc == null).Select(a => (Guid?)a.AssigneeId).FirstOrDefault(),
        i.Assignments.Where(a => a.UnassignedAtUtc == null).Select(a => a.Assignee.DisplayName).FirstOrDefault(),
        i.CreatedAtUtc, i.UpdatedAtUtc, i.ResolvedAtUtc, i.ClosedAtUtc);

    public async Task<Result<IncidentDto>> CreateAsync(CreateIncidentRequest r, CancellationToken ct)
    {
        var errors = new ValidationErrors();
        ValidateFields(errors, r.Title, r.Description, r.Priority);
        await ValidateReferencesAsync(errors, r.CategoryId, r.ServiceId, ct);
        if (!await UserExistsAsync(r.ReporterId, ct)) errors.Add("reporterId", "Reporter does not exist.");
        await ValidateActorAsync(errors, r.ActorUserId, ct);
        if (errors.HasErrors) return Result<IncidentDto>.Validation(errors.ToDictionary());

        var sequence = (await db.Database
            .SqlQueryRaw<long>("SELECT nextval('incident_number_seq') AS \"Value\"")
            .ToListAsync(ct))[0];

        var now = DateTime.UtcNow;
        var incident = new Incident
        {
            IncidentNumber = $"INC-{now.Year}-{sequence:D6}",
            Title = r.Title!.Trim(),
            Description = r.Description!.Trim(),
            Priority = r.Priority!.Value,
            Status = Status.Open,
            CategoryId = r.CategoryId,
            ServiceId = r.ServiceId,
            ReporterId = r.ReporterId,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        };
        db.Incidents.Add(incident);
        AddHistory(incident.Id, "Created", null, incident.IncidentNumber, r.ActorUserId ?? r.ReporterId, now);

        var conflict = await SaveAsync<IncidentDto>(ct);
        return conflict ?? await GetAsync(incident.Id, ct);
    }

    public async Task<Result<IncidentDto>> GetAsync(Guid id, CancellationToken ct)
    {
        var dto = await db.Incidents.AsNoTracking().Where(i => i.Id == id).Select(ToDto).FirstOrDefaultAsync(ct);
        return dto is null ? IncidentNotFound<IncidentDto>(id) : Result<IncidentDto>.Success(dto);
    }

    public async Task<Result<PagedResult<IncidentListItemDto>>> ListAsync(IncidentListQuery q, CancellationToken ct)
    {
        var page = q.Page ?? 1;
        var pageSize = q.PageSize ?? DefaultPageSize;
        var errors = new ValidationErrors();
        if (page < 1) errors.Add("page", "page must be 1 or greater.");
        if (pageSize is < 1 or > MaxPageSize) errors.Add("pageSize", $"pageSize must be between 1 and {MaxPageSize}.");
        if (errors.HasErrors) return Result<PagedResult<IncidentListItemDto>>.Validation(errors.ToDictionary());

        var query = db.Incidents.AsNoTracking();
        if (q.Status is { } status) query = query.Where(i => i.Status == status);
        if (q.Priority is { } priority) query = query.Where(i => i.Priority == priority);
        if (q.CategoryId is { } categoryId) query = query.Where(i => i.CategoryId == categoryId);
        if (q.ServiceId is { } serviceId) query = query.Where(i => i.ServiceId == serviceId);
        if (q.AssignedToId is { } assigneeId)
            query = query.Where(i => i.Assignments.Any(a => a.UnassignedAtUtc == null && a.AssigneeId == assigneeId));

        var total = await query.CountAsync(ct);
        var items = await query
            .OrderByDescending(i => i.CreatedAtUtc)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(i => new IncidentListItemDto(
                i.Id, i.IncidentNumber, i.Title, i.Priority, i.Status, i.Category.Name, i.Service.Name,
                i.Assignments.Where(a => a.UnassignedAtUtc == null).Select(a => a.Assignee.DisplayName).FirstOrDefault(),
                i.CreatedAtUtc))
            .ToListAsync(ct);

        return Result<PagedResult<IncidentListItemDto>>.Success(new PagedResult<IncidentListItemDto>(items, total, page, pageSize));
    }

    public async Task<Result<IncidentDto>> UpdateAsync(Guid id, UpdateIncidentRequest r, CancellationToken ct)
    {
        var incident = await db.Incidents.FirstOrDefaultAsync(i => i.Id == id, ct);
        if (incident is null) return IncidentNotFound<IncidentDto>(id);
        if (incident.Status == Status.Closed) return Result<IncidentDto>.Conflict("Closed incidents cannot be updated.");

        var errors = new ValidationErrors();
        ValidateFields(errors, r.Title, r.Description, r.Priority);
        await ValidateReferencesAsync(errors, r.CategoryId, r.ServiceId, ct);
        await ValidateActorAsync(errors, r.ActorUserId, ct);
        if (errors.HasErrors) return Result<IncidentDto>.Validation(errors.ToDictionary());

        var now = DateTime.UtcNow;
        if (incident.Priority != r.Priority)
            AddHistory(id, "Priority", incident.Priority.ToString(), r.Priority!.Value.ToString(), r.ActorUserId, now);
        if (incident.CategoryId != r.CategoryId)
            AddHistory(id, "CategoryId", incident.CategoryId.ToString(), r.CategoryId.ToString(), r.ActorUserId, now);
        if (incident.ServiceId != r.ServiceId)
            AddHistory(id, "ServiceId", incident.ServiceId.ToString(), r.ServiceId.ToString(), r.ActorUserId, now);

        // Explicit allow-list: Id, IncidentNumber, CreatedAtUtc and Status are never touched here.
        incident.Title = r.Title!.Trim();
        incident.Description = r.Description!.Trim();
        incident.Priority = r.Priority!.Value;
        incident.CategoryId = r.CategoryId;
        incident.ServiceId = r.ServiceId;
        incident.UpdatedAtUtc = now;

        return await SaveAsync<IncidentDto>(ct) ?? await GetAsync(id, ct);
    }

    public async Task<Result<IncidentDto>> AssignAsync(Guid id, AssignIncidentRequest r, CancellationToken ct)
    {
        var incident = await db.Incidents
            .Include(i => i.Assignments.Where(a => a.UnassignedAtUtc == null))
            .FirstOrDefaultAsync(i => i.Id == id, ct);
        if (incident is null) return IncidentNotFound<IncidentDto>(id);
        if (incident.Status == Status.Closed) return Result<IncidentDto>.Conflict("Closed incidents cannot be assigned.");

        var errors = new ValidationErrors();
        if (!await UserExistsAsync(r.AssigneeId, ct)) errors.Add("assigneeId", "Assignee does not exist.");
        await ValidateActorAsync(errors, r.ActorUserId, ct);
        if (errors.HasErrors) return Result<IncidentDto>.Validation(errors.ToDictionary());

        var current = incident.Assignments.FirstOrDefault();
        if (current?.AssigneeId == r.AssigneeId)
            return Result<IncidentDto>.Conflict("Incident is already assigned to this user.");

        var now = DateTime.UtcNow;
        if (current is not null) current.UnassignedAtUtc = now;
        db.IncidentAssignments.Add(new IncidentAssignment
        {
            IncidentId = id,
            AssigneeId = r.AssigneeId,
            AssignedById = r.ActorUserId,
            AssignedAtUtc = now
        });
        AddHistory(id, "Assignee", current?.AssigneeId.ToString(), r.AssigneeId.ToString(), r.ActorUserId, now);

        if (incident.Status == Status.Open)
        {
            AddHistory(id, "Status", incident.Status.ToString(), Status.Assigned.ToString(), r.ActorUserId, now);
            incident.Status = Status.Assigned;
        }
        incident.UpdatedAtUtc = now;

        return await SaveAsync<IncidentDto>(ct) ?? await GetAsync(id, ct);
    }

    public async Task<Result<IncidentDto>> ChangeStatusAsync(Guid id, ChangeStatusRequest r, CancellationToken ct)
    {
        var errors = new ValidationErrors();
        if (r.NewStatus is null) errors.Add("newStatus", "newStatus is required.");
        if (r.Note is not null)
        {
            errors.Required("note", r.Note, IncidentComment.BodyMaxLength);
            if (r.ActorUserId is null) errors.Add("actorUserId", "actorUserId is required when a note is provided.");
        }
        await ValidateActorAsync(errors, r.ActorUserId, ct);
        if (errors.HasErrors) return Result<IncidentDto>.Validation(errors.ToDictionary());

        var incident = await db.Incidents.FirstOrDefaultAsync(i => i.Id == id, ct);
        if (incident is null) return IncidentNotFound<IncidentDto>(id);

        var from = incident.Status;
        var to = r.NewStatus!.Value;
        if (!IncidentStatusTransitions.CanTransition(from, to))
            return Result<IncidentDto>.Conflict($"Status cannot change from {from} to {to}.");

        var now = DateTime.UtcNow;
        incident.Status = to;
        incident.UpdatedAtUtc = now;
        if (to == Status.Resolved) incident.ResolvedAtUtc = now;
        if (from == Status.Resolved && to == Status.Investigating) incident.ResolvedAtUtc = null;
        if (to == Status.Closed) incident.ClosedAtUtc = now;

        AddHistory(id, "Status", from.ToString(), to.ToString(), r.ActorUserId, now);
        if (r.Note is not null)
        {
            db.IncidentComments.Add(new IncidentComment
            {
                IncidentId = id, AuthorId = r.ActorUserId!.Value, Body = r.Note.Trim(), CreatedAtUtc = now
            });
        }

        return await SaveAsync<IncidentDto>(ct) ?? await GetAsync(id, ct);
    }

    public async Task<Result<IncidentCommentDto>> AddCommentAsync(Guid id, AddCommentRequest r, CancellationToken ct)
    {
        var status = await db.Incidents.Where(i => i.Id == id).Select(i => (Status?)i.Status).FirstOrDefaultAsync(ct);
        if (status is null) return IncidentNotFound<IncidentCommentDto>(id);
        if (status == Status.Closed) return Result<IncidentCommentDto>.Conflict("Closed incidents cannot be commented on.");

        var errors = new ValidationErrors();
        errors.Required("body", r.Body, IncidentComment.BodyMaxLength);
        var authorName = await db.Users.Where(u => u.Id == r.AuthorId).Select(u => u.DisplayName).FirstOrDefaultAsync(ct);
        if (authorName is null) errors.Add("authorId", "Author does not exist.");
        if (errors.HasErrors) return Result<IncidentCommentDto>.Validation(errors.ToDictionary());

        var comment = new IncidentComment
        {
            IncidentId = id, AuthorId = r.AuthorId, Body = r.Body!.Trim(), CreatedAtUtc = DateTime.UtcNow
        };
        db.IncidentComments.Add(comment);

        return await SaveAsync<IncidentCommentDto>(ct) ?? Result<IncidentCommentDto>.Success(new IncidentCommentDto(
            comment.Id, id, comment.AuthorId, authorName!, comment.Body, comment.CreatedAtUtc));
    }

    public async Task<Result<IReadOnlyList<IncidentHistoryDto>>> GetHistoryAsync(Guid id, CancellationToken ct)
    {
        if (!await db.Incidents.AnyAsync(i => i.Id == id, ct)) return IncidentNotFound<IReadOnlyList<IncidentHistoryDto>>(id);

        var history = await db.IncidentHistory.AsNoTracking()
            .Where(h => h.IncidentId == id)
            .OrderBy(h => h.ChangedAtUtc)
            .Select(h => new IncidentHistoryDto(
                h.Id, h.FieldName, h.OldValue, h.NewValue, h.ChangedById,
                h.ChangedBy != null ? h.ChangedBy.DisplayName : null, h.ChangedAtUtc))
            .ToListAsync(ct);

        return Result<IReadOnlyList<IncidentHistoryDto>>.Success(history);
    }

    private static void ValidateFields(ValidationErrors errors, string? title, string? description, Priority? priority)
    {
        errors.Required("title", title, Incident.TitleMaxLength);
        errors.Required("description", description, Incident.DescriptionMaxLength);
        if (priority is null) errors.Add("priority", "priority is required.");
    }

    private async Task ValidateReferencesAsync(ValidationErrors errors, Guid categoryId, Guid serviceId, CancellationToken ct)
    {
        if (!await db.IncidentCategories.AnyAsync(c => c.Id == categoryId, ct)) errors.Add("categoryId", "Category does not exist.");
        if (!await db.ApplicationServices.AnyAsync(s => s.Id == serviceId, ct)) errors.Add("serviceId", "Service does not exist.");
    }

    private async Task ValidateActorAsync(ValidationErrors errors, Guid? actorUserId, CancellationToken ct)
    {
        if (actorUserId is { } actor && !await UserExistsAsync(actor, ct))
            errors.Add("actorUserId", "Actor user does not exist.");
    }

    private Task<bool> UserExistsAsync(Guid userId, CancellationToken ct) => db.Users.AnyAsync(u => u.Id == userId, ct);

    private void AddHistory(Guid incidentId, string field, string? oldValue, string? newValue, Guid? actorUserId, DateTime now) =>
        db.IncidentHistory.Add(new IncidentHistory
        {
            IncidentId = incidentId,
            FieldName = field,
            OldValue = oldValue,
            NewValue = newValue,
            ChangedById = actorUserId,
            ChangedAtUtc = now
        });

    /// <summary>Single SaveChanges = one transaction for the incident change and its history rows.</summary>
    private async Task<Result<T>?> SaveAsync<T>(CancellationToken ct)
    {
        try
        {
            await db.SaveChangesAsync(ct);
            return null;
        }
        catch (DbUpdateException ex) when (ex.InnerException is PostgresException { SqlState: PostgresErrorCodes.UniqueViolation })
        {
            return Result<T>.Conflict("A record with the same unique value already exists.");
        }
    }

    private static Result<T> IncidentNotFound<T>(Guid id) => Result<T>.NotFound($"Incident {id} was not found.");
}
