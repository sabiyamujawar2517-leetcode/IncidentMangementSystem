using IncidentAgent.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IncidentAgent.Infrastructure.Persistence.Configurations;

public class IncidentHistoryConfiguration : IEntityTypeConfiguration<IncidentHistory>
{
    public void Configure(EntityTypeBuilder<IncidentHistory> builder)
    {
        builder.ToTable("IncidentHistory");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FieldName).IsRequired().HasMaxLength(100);
        builder.Property(x => x.OldValue).HasMaxLength(4000);
        builder.Property(x => x.NewValue).HasMaxLength(4000);
        builder.HasIndex(x => x.IncidentId);

        builder.HasOne(x => x.Incident).WithMany(x => x.History)
            .HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.ChangedBy).WithMany()
            .HasForeignKey(x => x.ChangedById).OnDelete(DeleteBehavior.Restrict);
    }
}
