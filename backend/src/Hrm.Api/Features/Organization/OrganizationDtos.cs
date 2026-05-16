namespace Hrm.Api.Features.Organization;

public sealed record OrganizationLookupRefDto(Guid Id, string Code, string Name);

public sealed record OrganizationUnitDto(
    Guid Id,
    string Code,
    string Name,
    Guid? ParentUnitId,
    OrganizationLookupRefDto? Parent,
    Guid OrganizationLevelId,
    OrganizationLookupRefDto? OrganizationLevel,
    Guid? WorkLocationId,
    OrganizationLookupRefDto? WorkLocation,
    DateTime? EstablishedDate,
    string? BusinessRegistrationNumber,
    DateTime? LicenseIssuedDate,
    string? LicenseIssuedPlace,
    string? RepresentativeName,
    string? Phone,
    string? Fax,
    string? Email,
    string? Note,
    bool IsActive,
    DateTime CreatedAt,
    DateTime? UpdatedAt);

public sealed record OrganizationUnitTreeNodeDto(
    Guid Id,
    string Code,
    string Name,
    bool IsActive,
    Guid? ParentUnitId,
    List<OrganizationUnitTreeNodeDto> Children);

public sealed record CreateOrganizationUnitRequest(
    string Code,
    string Name,
    Guid? ParentUnitId,
    Guid OrganizationLevelId,
    Guid? WorkLocationId,
    DateTime? EstablishedDate,
    string? BusinessRegistrationNumber,
    DateTime? LicenseIssuedDate,
    string? LicenseIssuedPlace,
    string? RepresentativeName,
    string? Phone,
    string? Fax,
    string? Email,
    string? Note,
    bool IsActive);

public sealed record UpdateOrganizationUnitRequest(
    string Name,
    Guid? ParentUnitId,
    Guid OrganizationLevelId,
    Guid? WorkLocationId,
    DateTime? EstablishedDate,
    string? BusinessRegistrationNumber,
    DateTime? LicenseIssuedDate,
    string? LicenseIssuedPlace,
    string? RepresentativeName,
    string? Phone,
    string? Fax,
    string? Email,
    string? Note,
    bool IsActive);
