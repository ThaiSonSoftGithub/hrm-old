using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Lookups;

public sealed class LookupCategory : EntityBase
{
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string Group { get; set; } = "";
    public string? Description { get; set; }
    public string? CodePrefix { get; set; }
    public int? CodePadLength { get; set; }
    public string? ParentCategoryCode { get; set; }
    public string? Ref1CategoryCode { get; set; }
    public string? Ref2CategoryCode { get; set; }
    public bool IsSystem { get; set; } = true;
}
