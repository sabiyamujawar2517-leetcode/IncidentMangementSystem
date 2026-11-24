using IncidentAgent.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IncidentAgent.Infrastructure.Persistence.Configurations;

public class IncidentConfiguration : IEntityTypeConfiguration<Incident>
{
    public void Configure(EntityTypeBuilder<Incident> builder)
    {
        builder.ToTable("Incidents");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.IncidentNumber).IsRequired().HasMaxLength(32);
        builder.Property(x => x.Title).IsRequired().HasMaxLength(200);
        builder.Property(x => x.Description).IsRequired().HasMaxLength(4000);
        builder.Property(x => x.Priority).HasConversion<string>().HasMaxLength(20);
        builder.Property(x => x.Status).HasConversion<string>().HasMaxLength(20);

        builder.HasIndex(x => x.IncidentNumber).IsUnique();
        builder.HasIndex(x => x.Status);
        builder.HasIndex(x => x.Priority);
        builder.HasIndex(x => x.ServiceId);
        builder.HasIndex(x => x.CreatedAtUtc);

        builder.HasOne(x => x.Category).WithMany(x => x.Incidents)
            .HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Service).WithMany(x => x.Incidents)
            .HasForeignKey(x => x.ServiceId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Reporter).WithMany(x => x.ReportedIncidents)
            .HasForeignKey(x => x.ReporterId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.SlaPolicy).WithMany(x => x.Incidents)
            .HasForeignKey(x => x.SlaPolicyId).OnDelete(DeleteBehavior.Restrict);
    }
}
