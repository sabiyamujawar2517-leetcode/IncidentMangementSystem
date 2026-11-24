using IncidentAgent.Domain.Entities;
using IncidentAgent.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace IncidentAgent.Infrastructure.Persistence;

/// <summary>Development-only, idempotent reference data. Each set is inserted only when its table is empty.</summary>
public static class DevDataSeeder
{
    public static readonly Guid AppErrorCategoryId = Guid.Parse("3f1a7c52-9b1e-4d6a-8c3e-1a2b3c4d5e01");
    public static readonly Guid PaymentApiServiceId = Guid.Parse("7d2e9a10-4c5b-4f8a-9e6d-2b3c4d5e6f02");
    public static readonly Guid AdminUserId = Guid.Parse("a9c4e8b3-1d7f-4a2c-b5e9-3c4d5e6f7a03");

    public static async Task SeedAsync(ApplicationDbContext db, CancellationToken ct)
    {
        var now = DateTime.UtcNow;

        if (!await db.IncidentCategories.AnyAsync(ct))
        {
            db.IncidentCategories.AddRange(
                new IncidentCategory { Name = "Hardware", Description = "Physical devices and infrastructure", CreatedAtUtc = now },
                new IncidentCategory { Name = "Software", Description = "Application defects and errors", CreatedAtUtc = now },
                new IncidentCategory { Name = "Network", Description = "Connectivity and DNS issues", CreatedAtUtc = now },
                new IncidentCategory { Name = "Access", Description = "Login and permission problems", CreatedAtUtc = now });
        }

        if (!await db.ApplicationServices.AnyAsync(ct))
        {
            db.ApplicationServices.AddRange(
                new ApplicationService { Name = "Customer Portal", OwnerTeam = "Web Team", CreatedAtUtc = now },
                new ApplicationService { Name = "Payments API", OwnerTeam = "Payments Team", CreatedAtUtc = now },
                new ApplicationService { Name = "Email Service", OwnerTeam = "Platform Team", CreatedAtUtc = now },
                new ApplicationService { Name = "Internal HR System", OwnerTeam = "IT Team", CreatedAtUtc = now });
        }

        if (!await db.Users.AnyAsync(ct))
        {
            db.Users.AddRange(
                new User { Email = "alex.reporter@example.com", DisplayName = "Alex Reporter", CreatedAtUtc = now },
                new User { Email = "sam.engineer@example.com", DisplayName = "Sam Engineer", CreatedAtUtc = now },
                new User { Email = "jordan.lead@example.com", DisplayName = "Jordan Lead", CreatedAtUtc = now });
        }

        if (!await db.SlaPolicies.AnyAsync(ct))
        {
            db.SlaPolicies.AddRange(
                new SlaPolicy { Name = "P1 Critical", Priority = Priority.P1Critical, ResponseTimeMinutes = 15, ResolutionTimeMinutes = 240, CreatedAtUtc = now },
                new SlaPolicy { Name = "P2 High", Priority = Priority.P2High, ResponseTimeMinutes = 60, ResolutionTimeMinutes = 480, CreatedAtUtc = now },
                new SlaPolicy { Name = "P3 Medium", Priority = Priority.P3Medium, ResponseTimeMinutes = 240, ResolutionTimeMinutes = 1440, CreatedAtUtc = now },
                new SlaPolicy { Name = "P4 Low", Priority = Priority.P4Low, ResponseTimeMinutes = 480, ResolutionTimeMinutes = 4320, CreatedAtUtc = now });
        }


        // Fixed ids so they can be reused in .http files. Checked by Id, so this also works on an already-seeded database.
        if (!await db.IncidentCategories.AnyAsync(c => c.Id == AppErrorCategoryId, ct))
            db.IncidentCategories.Add(new IncidentCategory { Id = AppErrorCategoryId, Name = "Application Error", Description = "Application exceptions and failures", CreatedAtUtc = now });

        if (!await db.ApplicationServices.AnyAsync(s => s.Id == PaymentApiServiceId, ct))
            db.ApplicationServices.Add(new ApplicationService { Id = PaymentApiServiceId, Name = "Payment API", OwnerTeam = "Payments Team", CreatedAtUtc = now });

        if (!await db.Users.AnyAsync(u => u.Id == AdminUserId, ct))
            db.Users.Add(new User { Id = AdminUserId, Email = "admin@example.com", DisplayName = "Admin User", CreatedAtUtc = now });

        await db.SaveChangesAsync(ct);
    }
}
