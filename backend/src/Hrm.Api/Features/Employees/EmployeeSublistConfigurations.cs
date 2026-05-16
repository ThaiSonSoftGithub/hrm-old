using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrm.Api.Features.Employees;

public sealed class EmployeeDegreeConfiguration : IEntityTypeConfiguration<EmployeeDegree>
{
    public void Configure(EntityTypeBuilder<EmployeeDegree> b)
    {
        b.ToTable("EmployeeDegrees");
        b.HasKey(x => x.Id);
        b.Property(x => x.Note).HasMaxLength(2000);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);
        b.HasIndex(x => x.EmployeeId);
    }
}

public sealed class EmployeeCertificateConfiguration : IEntityTypeConfiguration<EmployeeCertificate>
{
    public void Configure(EntityTypeBuilder<EmployeeCertificate> b)
    {
        b.ToTable("EmployeeCertificates");
        b.HasKey(x => x.Id);
        b.Property(x => x.CertificateName).HasMaxLength(255).IsRequired();
        b.Property(x => x.CertificateNumber).HasMaxLength(64);
        b.Property(x => x.IssuedPlace).HasMaxLength(256);
        b.Property(x => x.Note).HasMaxLength(2000);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);
        b.HasIndex(x => x.EmployeeId);
        b.HasIndex(x => x.CertificateTypeId);
    }
}

public sealed class EmployeeWorkExperienceConfiguration : IEntityTypeConfiguration<EmployeeWorkExperience>
{
    public void Configure(EntityTypeBuilder<EmployeeWorkExperience> b)
    {
        b.ToTable("EmployeeWorkExperiences");
        b.HasKey(x => x.Id);
        b.Property(x => x.FromMonthYear).HasMaxLength(10).IsRequired();
        b.Property(x => x.ToMonthYear).HasMaxLength(10).IsRequired();
        b.Property(x => x.WorkplaceName).HasMaxLength(255).IsRequired();
        b.Property(x => x.JobTitleText).HasMaxLength(255).IsRequired();
        b.Property(x => x.SalaryAmount).HasColumnType("decimal(18,2)");
        b.Property(x => x.JobDescription).HasMaxLength(2000);
        b.Property(x => x.Note).HasMaxLength(2000);
        b.Property(x => x.ReferenceName).HasMaxLength(128);
        b.Property(x => x.ReferenceJobTitle).HasMaxLength(128);
        b.Property(x => x.ReferencePhone).HasMaxLength(32);
        b.Property(x => x.ReferenceEmail).HasMaxLength(256);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);
        b.HasIndex(x => x.EmployeeId);
    }
}

public sealed class EmployeeWorkHistoryConfiguration : IEntityTypeConfiguration<EmployeeWorkHistory>
{
    public void Configure(EntityTypeBuilder<EmployeeWorkHistory> b)
    {
        b.ToTable("EmployeeWorkHistories");
        b.HasKey(x => x.Id);
        b.Property(x => x.DecisionNumber).HasMaxLength(64);
        b.Property(x => x.Note).HasMaxLength(2000);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);
        b.HasIndex(x => x.EmployeeId);
        b.HasIndex(x => x.JobPositionId);
        b.HasIndex(x => x.OrganizationUnitId);
        b.HasIndex(x => x.DepartmentId);
    }
}
