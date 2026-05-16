namespace Hrm.Api.Features.Authorization;

public sealed record AuthRefDto(Guid Id, string Code, string Name);

// Function group ----------------------------------------------------
public sealed record FunctionGroupDto(
    Guid Id, string Code, string Name, string? Note, bool IsActive,
    DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record CreateFunctionGroupRequest(string Code, string Name, string? Note, bool IsActive = true);
public sealed record UpdateFunctionGroupRequest(string Name, string? Note, bool IsActive);

// Screen ------------------------------------------------------------
public sealed record ScreenDto(
    Guid Id, string Code, string Name, string? Note,
    Guid FunctionGroupId, AuthRefDto? FunctionGroup,
    bool IsActive, DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record CreateScreenRequest(string Code, string Name, string? Note, Guid FunctionGroupId, bool IsActive = true);
public sealed record UpdateScreenRequest(string Name, string? Note, Guid FunctionGroupId, bool IsActive);

// Permission --------------------------------------------------------
public sealed record PermissionDto(
    Guid Id, string Code, string? Note,
    Guid FunctionGroupId, AuthRefDto? FunctionGroup,
    Guid ScreenId, AuthRefDto? Screen,
    DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record CreatePermissionRequest(string Code, string? Note, Guid FunctionGroupId, Guid ScreenId);
public sealed record UpdatePermissionRequest(string Code, string? Note, Guid FunctionGroupId, Guid ScreenId);

// Role group --------------------------------------------------------
public sealed record RoleGroupDto(
    Guid Id, string Code, string Name, string? Note, bool IsActive,
    int UserCount, int PermissionCount,
    DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record CreateRoleGroupRequest(string Code, string Name, string? Note, bool IsActive = true);
public sealed record UpdateRoleGroupRequest(string Name, string? Note, bool IsActive);

public sealed record RoleGroupUserDto(Guid UserId, string Username, string DisplayName, string? Email, string Status);
public sealed record AddUsersRequest(IReadOnlyList<Guid> UserIds);
public sealed record RemoveUsersRequest(IReadOnlyList<Guid> UserIds);

public sealed record SavePermissionsRequest(IReadOnlyList<Guid> PermissionIds);
public sealed record AddScreensRequest(IReadOnlyList<Guid> ScreenIds);
public sealed record RemoveScreensRequest(IReadOnlyList<Guid> ScreenIds);

public sealed record PermissionTreeNodeDto(
    Guid FunctionGroupId, string FunctionGroupCode, string FunctionGroupName,
    IReadOnlyList<PermissionTreeScreenDto> Screens);

public sealed record PermissionTreeScreenDto(
    Guid ScreenId, string ScreenCode, string ScreenName,
    IReadOnlyList<PermissionTreeLeafDto> Permissions);

public sealed record PermissionTreeLeafDto(Guid PermissionId, string Code, string? Note, bool Selected);
