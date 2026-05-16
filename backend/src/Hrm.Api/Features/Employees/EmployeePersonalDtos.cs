namespace Hrm.Api.Features.Employees;

public sealed record EmployeeAddressDto(
    Guid? CountryId, EmployeeRefDto? Country,
    Guid? ProvinceId, EmployeeRefDto? Province,
    Guid? DistrictId, EmployeeRefDto? District,
    Guid? WardId, EmployeeRefDto? Ward,
    string? AddressLine);

public sealed record EmployeeAddressInput(
    Guid? CountryId,
    Guid? ProvinceId,
    Guid? DistrictId,
    Guid? WardId,
    string? AddressLine);

public sealed record EmployeePersonalInfoDto(
    Guid EmployeeId,
    string EmployeeCode,

    // Identity
    string? IdentityNumber,
    DateTime? IdentityIssueDate,
    Guid? IdentityIssueProvinceId,
    EmployeeRefDto? IdentityIssueProvince,
    DateTime? IdentityExpiryDate,
    string? PassportNumber,
    DateTime? PassportIssueDate,
    Guid? PassportIssueProvinceId,
    EmployeeRefDto? PassportIssueProvince,
    DateTime? PassportExpiryDate,

    // Đảng/Đoàn
    string? PartyCardNumber,
    DateTime? PartyJoinDate,
    string? PartyJoinPlace,
    string? UnionCardNumber,
    DateTime? UnionJoinDate,
    string? UnionJoinPlace,

    // Trình độ
    string? GeneralEducationLevel,
    Guid? EducationLevelId, EmployeeRefDto? EducationLevel,
    Guid? EducationPlaceId, EmployeeRefDto? EducationPlace,
    Guid? EducationFacultyId, EmployeeRefDto? EducationFaculty,
    Guid? EducationMajorId, EmployeeRefDto? EducationMajor,
    int? GraduationYear,
    Guid? DegreeClassificationId, EmployeeRefDto? DegreeClassification,

    // Thành phần
    Guid? MaritalStatusId, EmployeeRefDto? MaritalStatus,
    Guid? FamilyBackgroundId, EmployeeRefDto? FamilyBackground,
    Guid? PersonalBackgroundId, EmployeeRefDto? PersonalBackground,
    Guid? EthnicityId, EmployeeRefDto? Ethnicity,
    Guid? ReligionId, EmployeeRefDto? Religion,
    Guid? NationalityCountryId, EmployeeRefDto? NationalityCountry,

    // Liên hệ
    string? MobilePhone,
    string? HomePhone,
    string? OfficePhone,
    string? OtherPhone,
    string? OfficeEmail,
    string? PersonalEmail,
    string? OtherEmail,
    string? Skype,
    string? Facebook,

    // Địa chỉ
    EmployeeAddressDto NativePlaceAddress,
    string? BirthPlace,
    string? HouseholdBookNumber,
    string? FamilyHouseholdCode,
    bool IsHouseholdHead,
    EmployeeAddressDto PermanentResidenceAddress,
    EmployeeAddressDto CurrentResidenceAddress,
    bool SameAsPermanentResidence,

    // Khẩn cấp
    string? EmergencyContactName,
    Guid? EmergencyRelationId, EmployeeRefDto? EmergencyRelation,
    string? EmergencyMobilePhone,
    string? EmergencyHomePhone,
    string? EmergencyEmail,
    string? EmergencyAddress,

    // Sức khỏe
    string? HeightText,
    string? WeightText,
    string? BloodGroupText,
    string? HealthStatusText);

public sealed record UpdateEmployeePersonalInfoRequest(
    string? IdentityNumber,
    DateTime? IdentityIssueDate,
    Guid? IdentityIssueProvinceId,
    DateTime? IdentityExpiryDate,
    string? PassportNumber,
    DateTime? PassportIssueDate,
    Guid? PassportIssueProvinceId,
    DateTime? PassportExpiryDate,

    string? PartyCardNumber,
    DateTime? PartyJoinDate,
    string? PartyJoinPlace,
    string? UnionCardNumber,
    DateTime? UnionJoinDate,
    string? UnionJoinPlace,

    string? GeneralEducationLevel,
    Guid? EducationLevelId,
    Guid? EducationPlaceId,
    Guid? EducationFacultyId,
    Guid? EducationMajorId,
    int? GraduationYear,
    Guid? DegreeClassificationId,

    Guid? MaritalStatusId,
    Guid? FamilyBackgroundId,
    Guid? PersonalBackgroundId,
    Guid? EthnicityId,
    Guid? ReligionId,
    Guid? NationalityCountryId,

    string? MobilePhone,
    string? HomePhone,
    string? OfficePhone,
    string? OtherPhone,
    string? OfficeEmail,
    string? PersonalEmail,
    string? OtherEmail,
    string? Skype,
    string? Facebook,

    EmployeeAddressInput? NativePlaceAddress,
    string? BirthPlace,
    string? HouseholdBookNumber,
    string? FamilyHouseholdCode,
    bool IsHouseholdHead,
    EmployeeAddressInput? PermanentResidenceAddress,
    EmployeeAddressInput? CurrentResidenceAddress,
    bool SameAsPermanentResidence,

    string? EmergencyContactName,
    Guid? EmergencyRelationId,
    string? EmergencyMobilePhone,
    string? EmergencyHomePhone,
    string? EmergencyEmail,
    string? EmergencyAddress,

    string? HeightText,
    string? WeightText,
    string? BloodGroupText,
    string? HealthStatusText);
