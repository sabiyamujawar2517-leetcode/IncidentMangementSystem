using IncidentAgent.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace IncidentAgent.Infrastructure.Persistence.Configurations;

public class IncidentCommentConfiguration : IEntityTypeConfiguration<IncidentComment>
{
    public void Configure(EntityTypeBuilder<IncidentComment> builder)
    {
        builder.ToTable("IncidentComments");
        builder.HasKey(x => x.Id);
        builder.Property(x => x.Body).IsRequired().HasMaxLength(IncidentComment.BodyMaxLength);
        builder.HasIndex(x => x.IncidentId);

        builder.HasOne(x => x.Incident).WithMany(x => x.Comments)
            .HasForeignKey(x => x.IncidentId).OnDelete(DeleteBehavior.Cascade);
        builder.HasOne(x => x.Author).WithMany()
            .HasForeignKey(x => x.AuthorId).OnDelete(DeleteBehavior.Restrict);
    }
}
