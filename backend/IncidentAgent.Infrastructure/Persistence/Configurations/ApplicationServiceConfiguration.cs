using IncidentAgent.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IncidentAgent.Infrastructure.Persistence.Configurations;

public class ApplicationServiceConfiguration : IEntityTypeConfiguration<ApplicationService>
{
    public void Configure(EntityTypeBuilder<ApplicationService> builder)
    {
        builder.ToTable("ApplicationServices");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Name).IsRequired().HasMaxLength(150);
        builder.Property(x => x.Description).HasMaxLength(500);
        builder.Property(x => x.OwnerTeam).HasMaxLength(150);
        builder.HasIndex(x => x.Name).IsUnique();
    }
}
