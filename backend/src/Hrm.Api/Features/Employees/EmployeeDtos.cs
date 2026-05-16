namespace Hrm.Api.Features.Employees;

public sealed record EmployeeListItemDto(
    Guid EmployeeId,
    string EmployeeCode,
    string FullName,
    string? Gender,
    string? GenderLabel,
    DateTime? DateOfBirth,
    Guid? JobPositionId,
    string? JobPositionLabel,
    Guid? DepartmentId,
    string? DepartmentLabel,
    string? PhoneNumber,
    string? Email,
    DateTime? ProbationStartDate,
    DateTime? OfficialStartDate,
    Guid? WorkingStatusId,
    string? WorkingStatusLabel);

public sealed record EmployeeSummaryDto(
    Guid EmployeeId,
    string EmployeeCode,
    string FullName,
    string? WorkingStatusLabel,
    string? JobPositionLabel,
    string? OrganizationUnitLabel);

public sealed record EmployeeTabRegistryDto(string DefaultTabKey, EmployeeTabDto[] Tabs);

public sealed record EmployeeTabDto(string Key, string Label, string Status);

/// <summary>
/// Tạo nhân viên — chấp nhận đầy đủ field Tab 1 (Thông tin chung). Required tối thiểu:
/// Code, FullName, Gender, JobPosition, Department, WorkingStatus.
/// </summary>
public sealed record CreateEmployeeRequest(
    string Code,
    string? MiddleName,
    string? FirstName,
    string FullName,
    string? Gender,
    DateTime? DateOfBirth,
    string? AttendanceCode,
    string? MobilePhone,
    string? CompanyPhone,
    string? PersonalEmail,
    string? CompanyEmail,
    string? Skype,
    Guid? JobPositionId,
    Guid? JobTitleId,
    Guid? OrganizationUnitId,
    Guid? DepartmentId,
    Guid? WorkLocationId,
    DateTime? InternshipStartDate,
    DateTime? ProbationStartDate,
    DateTime? OfficialStartDate,
    Guid? DirectManagerEmployeeId,
    Guid? WorkingStatusId);

public sealed record EmployeeGeneralInfoDto(
    Guid EmployeeId,
    string EmployeeCode,
    Guid? AvatarFileId,
    string? MiddleName,
    string? FirstName,
    string FullName,
    string? Gender,
    DateTime? DateOfBirth,
    string? AttendanceCode,
    string? MobilePhone,
    string? CompanyPhone,
    string? PersonalEmail,
    string? CompanyEmail,
    string? Skype,
    Guid? JobPositionId,
    EmployeeRefDto? JobPosition,
    Guid? JobTitleId,
    EmployeeRefDto? JobTitle,
    Guid? OrganizationUnitId,
    EmployeeRefDto? OrganizationUnit,
    Guid? DepartmentId,
    EmployeeRefDto? Department,
    Guid? WorkLocationId,
    EmployeeRefDto? WorkLocation,
    DateTime? InternshipStartDate,
    DateTime? ProbationStartDate,
    DateTime? OfficialStartDate,
    Guid? DirectManagerEmployeeId,
    EmployeeRefDto? DirectManagerEmployee,
    Guid? WorkingStatusId,
    EmployeeRefDto? WorkingStatus);

public sealed record EmployeeRefDto(Guid Id, string Code, string Name);

public sealed record UpdateEmployeeGeneralInfoRequest(
    string? MiddleName,
    string? FirstName,
    string FullName,
    string? Gender,
    DateTime? DateOfBirth,
    string? AttendanceCode,
    string? MobilePhone,
    string? CompanyPhone,
    string? PersonalEmail,
    string? CompanyEmail,
    string? Skype,
    Guid? JobPositionId,
    Guid? JobTitleId,
    Guid? OrganizationUnitId,
    Guid? DepartmentId,
    Guid? WorkLocationId,
    DateTime? InternshipStartDate,
    DateTime? ProbationStartDate,
    DateTime? OfficialStartDate,
    Guid? DirectManagerEmployeeId,
    Guid? WorkingStatusId);
