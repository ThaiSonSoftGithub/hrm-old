using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Authorization;

public sealed class FunctionGroup : EntityBase
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Note { get; set; }
    public bool IsActive { get; set; } = true;
}
