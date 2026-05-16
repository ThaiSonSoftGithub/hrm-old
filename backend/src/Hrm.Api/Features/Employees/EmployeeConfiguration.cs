using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrm.Api.Features.Employees;

public sealed class EmployeeConfiguration : IEntityTypeConfiguration<Employee>
{
    public void Configure(EntityTypeBuilder<Employee> b)
    {
        b.ToTable("Employees");
        b.HasKey(x => x.Id);

        b.Property(x => x.Code).HasMaxLength(32).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();

        b.Property(x => x.MiddleName).HasMaxLength(128);
        b.Property(x => x.FirstName).HasMaxLength(64);
        b.Property(x => x.FullName).HasMaxLength(128).IsRequired();
        b.Property(x => x.Gender).HasMaxLength(16);

        b.Property(x => x.AttendanceCode).HasMaxLength(64);
        b.Property(x => x.MobilePhone).HasMaxLength(32);
        b.Property(x => x.CompanyPhone).HasMaxLength(32);
        b.Property(x => x.PersonalEmail).HasMaxLength(256);
        b.Property(x => x.CompanyEmail).HasMaxLength(256);
        b.Property(x => x.Skype).HasMaxLength(128);

        b.Property(x => x.PhoneNumber).HasMaxLength(32);
        b.Property(x => x.Email).HasMaxLength(256);

        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);

        b.HasIndex(x => x.OrganizationUnitId);
        b.HasIndex(x => x.DepartmentId);
        b.HasIndex(x => x.JobPositionId);
        b.HasIndex(x => x.JobTitleId);
        b.HasIndex(x => x.WorkLocationId);
        b.HasIndex(x => x.WorkingStatusId);
        b.HasIndex(x => x.DirectManagerEmployeeId);
        b.HasIndex(x => x.FullName);

        // ===== Tab 02 Personal =====
        b.Property(x => x.IdentityNumber).HasMaxLength(32);
        b.Property(x => x.PassportNumber).HasMaxLength(32);
        b.Property(x => x.PartyCardNumber).HasMaxLength(64);
        b.Property(x => x.PartyJoinPlace).HasMaxLength(256);
        b.Property(x => x.UnionCardNumber).HasMaxLength(64);
        b.Property(x => x.UnionJoinPlace).HasMaxLength(256);
        b.Property(x => x.GeneralEducationLevel).HasMaxLength(64);

        b.Property(x => x.HomePhone).HasMaxLength(32);
        b.Property(x => x.OfficePhone).HasMaxLength(32);
        b.Property(x => x.OtherPhone).HasMaxLength(32);
        b.Property(x => x.OfficeEmail).HasMaxLength(256);
        b.Property(x => x.OtherEmail).HasMaxLength(256);
        b.Property(x => x.Facebook).HasMaxLength(256);

        b.Property(x => x.NativePlaceAddressLine).HasMaxLength(512);
        b.Property(x => x.BirthPlace).HasMaxLength(256);
        b.Property(x => x.HouseholdBookNumber).HasMaxLength(64);
        b.Property(x => x.FamilyHouseholdCode).HasMaxLength(64);
        b.Property(x => x.PermanentResidenceAddressLine).HasMaxLength(512);
        b.Property(x => x.CurrentResidenceAddressLine).HasMaxLength(512);

        b.Property(x => x.EmergencyContactName).HasMaxLength(128);
        b.Property(x => x.EmergencyMobilePhone).HasMaxLength(32);
        b.Property(x => x.EmergencyHomePhone).HasMaxLength(32);
        b.Property(x => x.EmergencyEmail).HasMaxLength(256);
        b.Property(x => x.EmergencyAddress).HasMaxLength(512);

        b.Property(x => x.HeightText).HasMaxLength(32);
        b.Property(x => x.WeightText).HasMaxLength(32);
        b.Property(x => x.BloodGroupText).HasMaxLength(16);
        b.Property(x => x.HealthStatusText).HasMaxLength(512);

        b.Property(x => x.BankAccountNumber).HasMaxLength(64);
        b.Property(x => x.BankAccountHolderName).HasMaxLength(128);
        b.Property(x => x.BankAccountNote).HasMaxLength(2000);
        b.HasIndex(x => x.BankId);
        b.HasIndex(x => x.BankBranchId);
    }
}
