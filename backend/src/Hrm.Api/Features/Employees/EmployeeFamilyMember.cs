using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Employees;

/// <summary>
/// Thành viên gia đình — sublist của Employee. Tab 03.
/// </summary>
public sealed class EmployeeFamilyMember : EntityBase
{
    public Guid EmployeeId { get; set; }

    public Guid RelationId { get; set; } // FK lookup FamilyRelation
    public string FullName { get; set; } = "";
    /// <summary>"male" | "female" | "other"</summary>
    public string Gender { get; set; } = "";
    public DateTime? DateOfBirth { get; set; }
    public bool BirthYearOnly { get; set; }
    public Guid? NationalityCountryId { get; set; }
    public string? IdentityOrPassportNumber { get; set; }
    public string? Address { get; set; }
    public string? MobilePhone { get; set; }
    public string? HomePhone { get; set; }
    public string? Email { get; set; }
    public string? Occupation { get; set; }
    public string? PersonalTaxCode { get; set; }
    public string? Workplace { get; set; }
    public bool SameHouseholdBook { get; set; }
    public bool IsHouseholdHead { get; set; }
    public bool IsDependent { get; set; }
    public bool IsDeceased { get; set; }
    public string? Note { get; set; }
}
