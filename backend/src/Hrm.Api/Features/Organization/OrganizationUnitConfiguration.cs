using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrm.Api.Features.Organization;

public sealed class OrganizationUnitConfiguration : IEntityTypeConfiguration<OrganizationUnit>
{
    public void Configure(EntityTypeBuilder<OrganizationUnit> b)
    {
        b.ToTable("OrganizationUnits");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(64).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Name).HasMaxLength(256).IsRequired();
        b.Property(x => x.BusinessRegistrationNumber).HasMaxLength(64);
        b.Property(x => x.LicenseIssuedPlace).HasMaxLength(256);
        b.Property(x => x.RepresentativeName).HasMaxLength(128);
        b.Property(x => x.Phone).HasMaxLength(32);
        b.Property(x => x.Fax).HasMaxLength(32);
        b.Property(x => x.Email).HasMaxLength(256);
        b.Property(x => x.Note).HasMaxLength(2000);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);

        b.HasIndex(x => x.ParentUnitId);
        b.HasIndex(x => x.OrganizationLevelId);
        b.HasIndex(x => x.WorkLocationId);

        b.HasOne(x => x.Parent)
            .WithMany()
            .HasForeignKey(x => x.ParentUnitId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}
