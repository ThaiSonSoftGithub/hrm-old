using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Lookups;

public sealed class LookupItem : EntityBase
{
    public string CategoryCode { get; set; } = "";
    public string Code { get; set; } = "";
    public string Name { get; set; } = "";
    public string? Note { get; set; }
    public bool IsActive { get; set; } = true;
    public int SortOrder { get; set; }
    public Guid? ParentItemId { get; set; }
    public Guid? RefItemId1 { get; set; }
    public Guid? RefItemId2 { get; set; }
    public string? Extra { get; set; }

    public LookupCategory? Category { get; set; }
    public LookupItem? Parent { get; set; }
    public LookupItem? Ref1 { get; set; }
    public LookupItem? Ref2 { get; set; }
}
