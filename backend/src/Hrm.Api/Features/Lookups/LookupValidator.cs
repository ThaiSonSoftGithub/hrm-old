using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Lookups;

public sealed class LookupValidator
{
    private readonly HrmDbContext _db;
    public LookupValidator(HrmDbContext db) => _db = db;

    public async Task ValidateForSaveAsync(
        LookupCategory category,
        Guid? parentItemId, Guid? refItemId1, Guid? refItemId2,
        CancellationToken ct)
    {
        await ValidateRef(parentItemId, category.ParentCategoryCode,
            requiredCode: "LOOKUP_PARENT_REQUIRED",
            invalidCode: "LOOKUP_PARENT_INVALID_CATEGORY",
            ct);

        await ValidateRef(refItemId1, category.Ref1CategoryCode,
            requiredCode: null,
            invalidCode: "LOOKUP_REF_INVALID_CATEGORY",
            ct);

        await ValidateRef(refItemId2, category.Ref2CategoryCode,
            requiredCode: null,
            invalidCode: "LOOKUP_REF_INVALID_CATEGORY",
            ct);
    }

    private async Task ValidateRef(Guid? itemId, string? expectedCategoryCode,
        string? requiredCode, string invalidCode, CancellationToken ct)
    {
        if (expectedCategoryCode is null)
        {
            if (itemId is not null)
                throw new DomainException(invalidCode,
                    "Bản ghi tham chiếu không hợp lệ với danh mục này.");
            return;
        }

        if (itemId is null)
        {
            if (requiredCode is not null)
                throw new DomainException(requiredCode,
                    "Bản ghi cha là bắt buộc cho danh mục này.");
            return;
        }

        var actualCategory = await _db.LookupItems
            .Where(x => x.Id == itemId)
            .Select(x => x.CategoryCode)
            .FirstOrDefaultAsync(ct);

        if (actualCategory is null || actualCategory != expectedCategoryCode)
            throw new DomainException(invalidCode,
                $"Bản ghi tham chiếu phải thuộc danh mục '{expectedCategoryCode}'.");
    }
}
