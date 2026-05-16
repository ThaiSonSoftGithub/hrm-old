using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Employees;

/// <summary>
/// Hồ sơ nhân viên — Phase 4. Bao gồm trường cho employee-list + Tab 01 Thông tin chung.
/// Các tab khác sẽ bổ sung trường qua migration sau.
/// </summary>
public sealed class Employee : EntityBase
{
    public string Code { get; set; } = "";

    // Tên: middle = Họ và đệm, first = Tên, full = display
    public string? MiddleName { get; set; }
    public string? FirstName { get; set; }
    public string FullName { get; set; } = "";

    /// <summary>"male" | "female" | "other"</summary>
    public string? Gender { get; set; }
    public DateTime? DateOfBirth { get; set; }

    public string? AttendanceCode { get; set; }
    public string? MobilePhone { get; set; }
    public string? CompanyPhone { get; set; }
    public string? PersonalEmail { get; set; }
    public string? CompanyEmail { get; set; }
    public string? Skype { get; set; }

    /// <summary>Reserved cho upload avatar (phase sau).</summary>
    public Guid? AvatarFileId { get; set; }

    // Thông tin công việc
    public Guid? JobPositionId { get; set; }
    public Guid? JobTitleId { get; set; }
    /// <summary>Đơn vị công tác (optional secondary).</summary>
    public Guid? OrganizationUnitId { get; set; }
    /// <summary>Phòng ban — required theo spec.</summary>
    public Guid? DepartmentId { get; set; }
    public Guid? WorkLocationId { get; set; }
    public Guid? WorkingStatusId { get; set; }
    public Guid? DirectManagerEmployeeId { get; set; }

    public DateTime? InternshipStartDate { get; set; }
    public DateTime? ProbationStartDate { get; set; }
    public DateTime? OfficialStartDate { get; set; }

    // Field-list cho list page giữ lại
    public string? PhoneNumber { get; set; }
    public string? Email { get; set; }

    public bool IsActive { get; set; } = true;

    // ===== Tab 02 Personal =====
    // Identity / Passport
    public string? IdentityNumber { get; set; }
    public DateTime? IdentityIssueDate { get; set; }
    public Guid? IdentityIssueProvinceId { get; set; }
    public DateTime? IdentityExpiryDate { get; set; }
    public string? PassportNumber { get; set; }
    public DateTime? PassportIssueDate { get; set; }
    public Guid? PassportIssueProvinceId { get; set; }
    public DateTime? PassportExpiryDate { get; set; }

    // Đảng / Đoàn
    public string? PartyCardNumber { get; set; }
    public DateTime? PartyJoinDate { get; set; }
    public string? PartyJoinPlace { get; set; }
    public string? UnionCardNumber { get; set; }
    public DateTime? UnionJoinDate { get; set; }
    public string? UnionJoinPlace { get; set; }

    // Trình độ
    public string? GeneralEducationLevel { get; set; }
    public Guid? EducationLevelId { get; set; }
    public Guid? EducationPlaceId { get; set; }
    public Guid? EducationFacultyId { get; set; }
    public Guid? EducationMajorId { get; set; }
    public int? GraduationYear { get; set; }
    public Guid? DegreeClassificationId { get; set; }

    // Thành phần
    public Guid? MaritalStatusId { get; set; }
    public Guid? FamilyBackgroundId { get; set; }
    public Guid? PersonalBackgroundId { get; set; }
    public Guid? EthnicityId { get; set; }
    public Guid? ReligionId { get; set; }
    public Guid? NationalityCountryId { get; set; }

    // Liên hệ chi tiết
    public string? HomePhone { get; set; }
    public string? OfficePhone { get; set; }
    public string? OtherPhone { get; set; }
    public string? OfficeEmail { get; set; }
    public string? OtherEmail { get; set; }
    public string? Facebook { get; set; }

    // Nguyên quán
    public Guid? NativePlaceCountryId { get; set; }
    public Guid? NativePlaceProvinceId { get; set; }
    public Guid? NativePlaceDistrictId { get; set; }
    public Guid? NativePlaceWardId { get; set; }
    public string? NativePlaceAddressLine { get; set; }
    public string? BirthPlace { get; set; }
    public string? HouseholdBookNumber { get; set; }
    public string? FamilyHouseholdCode { get; set; }
    public bool IsHouseholdHead { get; set; }

    // Hộ khẩu thường trú
    public Guid? PermanentResidenceCountryId { get; set; }
    public Guid? PermanentResidenceProvinceId { get; set; }
    public Guid? PermanentResidenceDistrictId { get; set; }
    public Guid? PermanentResidenceWardId { get; set; }
    public string? PermanentResidenceAddressLine { get; set; }

    // Chỗ ở hiện nay
    public Guid? CurrentResidenceCountryId { get; set; }
    public Guid? CurrentResidenceProvinceId { get; set; }
    public Guid? CurrentResidenceDistrictId { get; set; }
    public Guid? CurrentResidenceWardId { get; set; }
    public string? CurrentResidenceAddressLine { get; set; }
    public bool SameAsPermanentResidence { get; set; }

    // Liên hệ khẩn cấp
    public string? EmergencyContactName { get; set; }
    public Guid? EmergencyRelationId { get; set; }
    public string? EmergencyMobilePhone { get; set; }
    public string? EmergencyHomePhone { get; set; }
    public string? EmergencyEmail { get; set; }
    public string? EmergencyAddress { get; set; }

    // Sức khỏe
    public string? HeightText { get; set; }
    public string? WeightText { get; set; }
    public string? BloodGroupText { get; set; }
    public string? HealthStatusText { get; set; }

    // ===== Tab 05 Bank Account =====
    public string? BankAccountNumber { get; set; }
    public string? BankAccountHolderName { get; set; }
    public Guid? BankId { get; set; }
    public Guid? BankBranchId { get; set; }
    public string? BankAccountNote { get; set; }
}
