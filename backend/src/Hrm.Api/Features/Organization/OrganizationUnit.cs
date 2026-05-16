using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Organization;

public sealed class OrganizationUnit : EntityBase
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public Guid? ParentUnitId { get; set; }
    public Guid OrganizationLevelId { get; set; }
    public Guid? WorkLocationId { get; set; }
    public DateTime? EstablishedDate { get; set; }
    public string? BusinessRegistrationNumber { get; set; }
    public DateTime? LicenseIssuedDate { get; set; }
    public string? LicenseIssuedPlace { get; set; }
    public string? RepresentativeName { get; set; }
    public string? Phone { get; set; }
    public string? Fax { get; set; }
    public string? Email { get; set; }
    public string? Note { get; set; }
    public bool IsActive { get; set; } = true;

    public OrganizationUnit? Parent { get; set; }
}
