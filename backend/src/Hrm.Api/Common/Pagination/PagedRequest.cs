namespace Hrm.Api.Common.Pagination;

public sealed class PagedRequest
{
    public string? Keyword { get; set; }
    public bool? IsActive { get; set; }
    public int? Page { get; set; }
    public int? PageSize { get; set; }
    public string? SortBy { get; set; }
    public string? SortDirection { get; set; }
    public Guid? ParentId { get; set; }
    public Guid? RefId1 { get; set; }
    public Guid? RefId2 { get; set; }

    public int EffectivePage => Page is { } p && p > 0 ? p : 1;
    public int EffectivePageSize => PageSize is { } s ? Math.Clamp(s, 1, 1000) : 20;
    public int Skip => (EffectivePage - 1) * EffectivePageSize;
    public int Take => EffectivePageSize;
}
