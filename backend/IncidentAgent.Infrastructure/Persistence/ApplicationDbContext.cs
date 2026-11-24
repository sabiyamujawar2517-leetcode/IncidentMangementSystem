using IncidentAgent.Domain.Entities;
using Microsoft.EntityFrameworkCore;

namespace IncidentAgent.Infrastructure.Persistence;

public class ApplicationDbContext(DbContextOptions<ApplicationDbContext> options) : DbContext(options)
{
    public DbSet<User> Users => Set<User>();
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<IncidentCategory> IncidentCategories => Set<IncidentCategory>();
    public DbSet<ApplicationService> ApplicationServices => Set<ApplicationService>();
    public DbSet<IncidentAssignment> IncidentAssignments => Set<IncidentAssignment>();
    public DbSet<IncidentComment> IncidentComments => Set<IncidentComment>();
    public DbSet<IncidentHistory> IncidentHistory => Set<IncidentHistory>();
    public DbSet<SlaPolicy> SlaPolicies => Set<SlaPolicy>();
    public DbSet<IncidentAttachment> IncidentAttachments => Set<IncidentAttachment>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(ApplicationDbContext).Assembly);
    }
}
