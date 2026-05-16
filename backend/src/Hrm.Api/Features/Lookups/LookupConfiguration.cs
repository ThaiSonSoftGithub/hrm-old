using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrm.Api.Features.Lookups;

public sealed class LookupCategoryConfiguration : IEntityTypeConfiguration<LookupCategory>
{
    public void Configure(EntityTypeBuilder<LookupCategory> b)
    {
        b.ToTable("LookupCategories");
        b.HasKey(x => x.Id);
        b.HasAlternateKey(x => x.Code);
        b.Property(x => x.Code).HasMaxLength(64).IsRequired();
        b.Property(x => x.Name).HasMaxLength(256).IsRequired();
        b.Property(x => x.Group).HasMaxLength(64).IsRequired();
        b.Property(x => x.Description).HasMaxLength(512);
        b.Property(x => x.CodePrefix).HasMaxLength(8);
        b.Property(x => x.ParentCategoryCode).HasMaxLength(64);
        b.Property(x => x.Ref1CategoryCode).HasMaxLength(64);
        b.Property(x => x.Ref2CategoryCode).HasMaxLength(64);
        b.Property(x => x.IsSystem).HasDefaultValue(true);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);
    }
}

public sealed class LookupItemConfiguration : IEntityTypeConfiguration<LookupItem>
{
    public void Configure(EntityTypeBuilder<LookupItem> b)
    {
        b.ToTable("LookupItems");
        b.HasKey(x => x.Id);
        b.Property(x => x.CategoryCode).HasMaxLength(64).IsRequired();
        b.Property(x => x.Code).HasMaxLength(64).IsRequired();
        b.Property(x => x.Name).HasMaxLength(256).IsRequired();
        b.Property(x => x.Note).HasMaxLength(1024);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.Extra).HasColumnType("nvarchar(max)");
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);

        b.HasIndex(x => new { x.CategoryCode, x.Code }).IsUnique();
        b.HasIndex(x => new { x.CategoryCode, x.IsActive, x.SortOrder });

        b.HasOne(x => x.Category)
            .WithMany()
            .HasForeignKey(x => x.CategoryCode)
            .HasPrincipalKey(c => c.Code)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Parent)
            .WithMany()
            .HasForeignKey(x => x.ParentItemId)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Ref1)
            .WithMany()
            .HasForeignKey(x => x.RefItemId1)
            .OnDelete(DeleteBehavior.Restrict);

        b.HasOne(x => x.Ref2)
            .WithMany()
            .HasForeignKey(x => x.RefItemId2)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
