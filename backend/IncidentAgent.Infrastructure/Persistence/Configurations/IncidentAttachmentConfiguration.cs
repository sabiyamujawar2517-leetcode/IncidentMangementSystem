using IncidentAgent.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IncidentAgent.Infrastructure.Persistence.Configurations;

public class IncidentAttachmentConfiguration : IEntityTypeConfiguration<IncidentAttachment>
{
    public void Configure(EntityTypeBuilder<IncidentAttachment> builder)
    {
        builder.ToTable("IncidentAttachments");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.FileName).IsRequired().HasMaxLength(255);
        builder.Property(x => x.ContentType).IsRequired().HasMaxLength(100);
        builder.Property(x => x.StoragePath).IsRequired().HasMaxLength(1024);
        builder.HasIndex(x => x.IncidentId);

        builder.HasOne(x => x.Incident).WithMany(x => x.Attachments)
            .HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.UploadedBy).WithMany()
            .HasForeignKey(x => x.UploadedById).OnDelete(DeleteBehavior.Restrict);
    }
}
