using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrm.Api.Features.Employees;

public sealed class EmployeeFamilyMemberConfiguration : IEntityTypeConfiguration<EmployeeFamilyMember>
{
    public void Configure(EntityTypeBuilder<EmployeeFamilyMember> b)
    {
        b.ToTable("EmployeeFamilyMembers");
        b.HasKey(x => x.Id);

        b.Property(x => x.FullName).HasMaxLength(255).IsRequired();
        b.Property(x => x.Gender).HasMaxLength(16).IsRequired();
        b.Property(x => x.IdentityOrPassportNumber).HasMaxLength(64);
        b.Property(x => x.Address).HasMaxLength(512);
        b.Property(x => x.MobilePhone).HasMaxLength(32);
        b.Property(x => x.HomePhone).HasMaxLength(32);
        b.Property(x => x.Email).HasMaxLength(256);
        b.Property(x => x.Occupation).HasMaxLength(128);
        b.Property(x => x.PersonalTaxCode).HasMaxLength(32);
        b.Property(x => x.Workplace).HasMaxLength(256);
        b.Property(x => x.Note).HasMaxLength(2000);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);

        b.HasIndex(x => x.EmployeeId);
        b.HasIndex(x => x.RelationId);
    }
}
