namespace Hrm.Api.Features.Authorization;

public sealed class RoleGroupUser
{
    public Guid RoleGroupId { get; set; }
    public Guid UserId { get; set; }
}

public sealed class RoleGroupPermission
{
    public Guid RoleGroupId { get; set; }
    public Guid PermissionId { get; set; }
}

public sealed class FunctionGroupScreen
{
    public Guid FunctionGroupId { get; set; }
    public Guid ScreenId { get; set; }
}
