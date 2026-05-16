using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrm.Api.Features.Employees;

public sealed class LaborContractConfiguration : IEntityTypeConfiguration<LaborContract>
{
    public void Configure(EntityTypeBuilder<LaborContract> b)
    {
        b.ToTable("LaborContracts");
        b.HasKey(x => x.Id);

        b.Property(x => x.ContractNumber).HasMaxLength(64).IsRequired();
        b.Property(x => x.ContractDurationText).HasMaxLength(64);
        b.Property(x => x.SignerJobTitleText).HasMaxLength(128);
        b.Property(x => x.Note).HasMaxLength(2000);
        b.Property(x => x.BaseSalary).HasColumnType("decimal(18,2)");
        b.Property(x => x.InsuranceSalary).HasColumnType("decimal(18,2)");
        b.Property(x => x.SalaryPercent).HasColumnType("decimal(5,2)");
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);

        b.HasIndex(x => x.EmployeeId);
        b.HasIndex(x => x.ContractNumber);
        b.HasIndex(x => x.ContractTypeId);
        b.HasIndex(x => x.SignerEmployeeId);
    }
}
