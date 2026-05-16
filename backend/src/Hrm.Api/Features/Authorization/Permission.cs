using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Authorization;

public sealed class Permission : EntityBase
{
    public string Code { get; set; } = "";
    public string? Note { get; set; }
    public Guid FunctionGroupId { get; set; }
    public Guid ScreenId { get; set; }

    public FunctionGroup? FunctionGroup { get; set; }
    public Screen? Screen { get; set; }
}
