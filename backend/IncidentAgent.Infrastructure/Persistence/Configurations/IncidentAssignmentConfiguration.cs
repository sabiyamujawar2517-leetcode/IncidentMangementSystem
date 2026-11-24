using IncidentAgent.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IncidentAgent.Infrastructure.Persistence.Configurations;

public class IncidentAssignmentConfiguration : IEntityTypeConfiguration<IncidentAssignment>
{
    public void Configure(EntityTypeBuilder<IncidentAssignment> builder)
    {
        builder.ToTable("IncidentAssignments");
        builder.HasKey(x => x.Id);
        builder.HasIndex(x => x.IncidentId);
        builder.HasIndex(x => x.AssigneeId);

        builder.HasOne(x => x.Incident).WithMany(x => x.Assignments)
            .HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.Assignee).WithMany()
            .HasForeignKey(x => x.AssigneeId).OnDelete(DeleteBehavior.Restrict);
        builder.HasOne(x => x.AssignedBy).WithMany()
            .HasForeignKey(x => x.AssignedById).OnDelete(DeleteBehavior.Restrict);
    }
}
