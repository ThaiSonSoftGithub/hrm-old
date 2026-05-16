namespace Hrm.Api.Features.Lookups;

public sealed record LookupCategoryDto(
    string Code, string Name, string Group, string? Description,
    string? CodePrefix, int? CodePadLength,
    string? ParentCategoryCode, string? Ref1CategoryCode, string? Ref2CategoryCode);

public sealed record LookupItemRefDto(Guid Id, string Code, string Name);

public sealed record LookupItemDto(
    Guid Id, string CategoryCode, string Code, string Name, string? Note,
    bool IsActive, int SortOrder,
    Guid? ParentItemId, LookupItemRefDto? Parent,
    Guid? RefItemId1, LookupItemRefDto? Ref1,
    Guid? RefItemId2, LookupItemRefDto? Ref2,
    string? Extra, DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record CreateLookupItemRequest(
    string? Code, string Name, string? Note, bool IsActive, int SortOrder,
    Guid? ParentItemId, Guid? RefItemId1, Guid? RefItemId2, string? Extra);

public sealed record UpdateLookupItemRequest(
    string Name, string? Note, bool IsActive, int SortOrder,
    Guid? ParentItemId, Guid? RefItemId1, Guid? RefItemId2, string? Extra);
