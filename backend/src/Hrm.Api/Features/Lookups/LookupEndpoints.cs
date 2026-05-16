using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Pagination;
using Hrm.Api.Common.Persistence;
using Hrm.Api.Features.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Lookups;

public static class LookupEndpoints
{
    public static IEndpointRouteBuilder MapLookupEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/lookups").RequireAuthorization();

        group.MapGet("/categories", ListCategories).RequirePermission(AuthPermissions.MdView);
        group.MapGet("/{categoryCode}", ListItems).RequirePermission(AuthPermissions.MdView);
        group.MapGet("/{categoryCode}/{id:guid}", GetItem).RequirePermission(AuthPermissions.MdView);
        group.MapPost("/{categoryCode}", CreateItem).RequirePermission(AuthPermissions.MdCreate);
        group.MapPut("/{categoryCode}/{id:guid}", UpdateItem).RequirePermission(AuthPermissions.MdEdit);
        group.MapDelete("/{categoryCode}/{id:guid}", DeleteItem).RequirePermission(AuthPermissions.MdDelete);
        group.MapPost("/{categoryCode}/import", (string categoryCode) => Results.StatusCode(501)).RequirePermission(AuthPermissions.MdCreate);
        group.MapGet("/{categoryCode}/export", (string categoryCode) => Results.StatusCode(501)).RequirePermission(AuthPermissions.MdView);

        return routes;
    }

    private static async Task<IResult> ListCategories(HrmDbContext db, CancellationToken ct)
    {
        var data = await db.LookupCategories
            .OrderBy(c => c.Group).ThenBy(c => c.Name)
            .Select(c => new LookupCategoryDto(
                c.Code, c.Name, c.Group, c.Description,
                c.CodePrefix, c.CodePadLength,
                c.ParentCategoryCode, c.Ref1CategoryCode, c.Ref2CategoryCode))
            .ToListAsync(ct);
        return Results.Ok(data);
    }

    private static async Task<LookupCategory> RequireCategory(HrmDbContext db, string code, CancellationToken ct)
    {
        var c = await db.LookupCategories.FirstOrDefaultAsync(x => x.Code == code, ct);
        return c ?? throw new NotFoundException("LOOKUP_CATEGORY_NOT_FOUND", $"Danh mục '{code}' không tồn tại.");
    }

    private static async Task<IResult> ListItems(
        string categoryCode,
        [AsParameters] PagedRequest q,
        HrmDbContext db,
        CancellationToken ct)
    {
        await RequireCategory(db, categoryCode, ct);

        var query = db.LookupItems
            .Include(x => x.Parent)
            .Include(x => x.Ref1)
            .Include(x => x.Ref2)
            .Where(x => x.CategoryCode == categoryCode);

        if (!string.IsNullOrWhiteSpace(q.Keyword))
        {
            var k = q.Keyword.Trim();
            query = query.Where(x => x.Code.Contains(k) || x.Name.Contains(k));
        }
        if (q.IsActive is not null) query = query.Where(x => x.IsActive == q.IsActive);
        if (q.ParentId is not null) query = query.Where(x => x.ParentItemId == q.ParentId);
        if (q.RefId1 is not null) query = query.Where(x => x.RefItemId1 == q.RefId1);
        if (q.RefId2 is not null) query = query.Where(x => x.RefItemId2 == q.RefId2);

        query = (q.SortBy?.ToLowerInvariant(), q.SortDirection?.ToLowerInvariant()) switch
        {
            ("name", "desc") => query.OrderByDescending(x => x.Name),
            ("name", _)      => query.OrderBy(x => x.Name),
            ("code", "desc") => query.OrderByDescending(x => x.Code),
            ("code", _)      => query.OrderBy(x => x.Code),
            _                 => query.OrderBy(x => x.SortOrder).ThenBy(x => x.Code)
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(q.Skip).Take(q.Take).ToListAsync(ct);
        var items = rows.Select(ToDto).ToList();

        return Results.Ok(new PagedResult<LookupItemDto>(items, q.EffectivePage, q.Take, total));
    }

    private static async Task<IResult> GetItem(
        string categoryCode, Guid id, HrmDbContext db, CancellationToken ct)
    {
        var item = await db.LookupItems
            .Include(x => x.Parent).Include(x => x.Ref1).Include(x => x.Ref2)
            .FirstOrDefaultAsync(x => x.CategoryCode == categoryCode && x.Id == id, ct);
        if (item is null) throw new NotFoundException("LOOKUP_NOT_FOUND", "Không tìm thấy bản ghi.");
        return Results.Ok(ToDto(item));
    }

    private static async Task<IResult> CreateItem(
        string categoryCode,
        [FromBody] CreateLookupItemRequest req,
        HrmDbContext db,
        LookupCodeGenerator generator,
        LookupValidator validator,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 256)
            throw new ValidationException("Tên không được để trống và tối đa 256 ký tự.");

        var category = await RequireCategory(db, categoryCode, ct);

        string code;
        if (!string.IsNullOrWhiteSpace(category.CodePrefix))
        {
            if (string.IsNullOrWhiteSpace(req.Code))
            {
                code = await generator.NextCodeAsync(category, ct);
            }
            else
            {
                var pattern = $"^{category.CodePrefix}\\d{{{category.CodePadLength}}}$";
                if (!System.Text.RegularExpressions.Regex.IsMatch(req.Code, pattern))
                    throw new ValidationException(
                        $"Mã phải có định dạng {category.CodePrefix} + {category.CodePadLength} chữ số.");
                code = req.Code;
            }
        }
        else
        {
            if (string.IsNullOrWhiteSpace(req.Code))
                throw new ValidationException("Mã là bắt buộc cho danh mục này.");
            code = req.Code.Trim();
        }

        var duplicate = await db.LookupItems.AnyAsync(
            x => x.CategoryCode == categoryCode && x.Code == code, ct);
        if (duplicate)
            throw new DomainException("LOOKUP_DUPLICATE_CODE", "Mã đã tồn tại trong danh mục.", 409);

        await validator.ValidateForSaveAsync(category, req.ParentItemId, req.RefItemId1, req.RefItemId2, ct);

        var entity = new LookupItem
        {
            CategoryCode = categoryCode,
            Code = code,
            Name = req.Name.Trim(),
            Note = req.Note,
            IsActive = req.IsActive,
            SortOrder = req.SortOrder,
            ParentItemId = req.ParentItemId,
            RefItemId1 = req.RefItemId1,
            RefItemId2 = req.RefItemId2,
            Extra = req.Extra
        };
        db.LookupItems.Add(entity);
        await db.SaveChangesAsync(ct);

        var saved = await db.LookupItems
            .Include(x => x.Parent).Include(x => x.Ref1).Include(x => x.Ref2)
            .FirstAsync(x => x.Id == entity.Id, ct);

        return Results.Created($"/api/lookups/{categoryCode}/{saved.Id}", ToDto(saved));
    }

    private static async Task<IResult> UpdateItem(
        string categoryCode,
        Guid id,
        [FromBody] UpdateLookupItemRequest req,
        HrmDbContext db,
        LookupValidator validator,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 256)
            throw new ValidationException("Tên không được để trống và tối đa 256 ký tự.");

        var category = await RequireCategory(db, categoryCode, ct);

        var entity = await db.LookupItems
            .FirstOrDefaultAsync(x => x.CategoryCode == categoryCode && x.Id == id, ct)
            ?? throw new NotFoundException("LOOKUP_NOT_FOUND", "Không tìm thấy bản ghi.");

        await validator.ValidateForSaveAsync(category, req.ParentItemId, req.RefItemId1, req.RefItemId2, ct);

        entity.Name = req.Name.Trim();
        entity.Note = req.Note;
        entity.IsActive = req.IsActive;
        entity.SortOrder = req.SortOrder;
        entity.ParentItemId = req.ParentItemId;
        entity.RefItemId1 = req.RefItemId1;
        entity.RefItemId2 = req.RefItemId2;
        entity.Extra = req.Extra;

        await db.SaveChangesAsync(ct);

        var saved = await db.LookupItems
            .Include(x => x.Parent).Include(x => x.Ref1).Include(x => x.Ref2)
            .FirstAsync(x => x.Id == entity.Id, ct);

        return Results.Ok(ToDto(saved));
    }

    private static async Task<IResult> DeleteItem(
        string categoryCode, Guid id,
        HrmDbContext db,
        CancellationToken ct)
    {
        var entity = await db.LookupItems
            .FirstOrDefaultAsync(x => x.CategoryCode == categoryCode && x.Id == id, ct)
            ?? throw new NotFoundException("LOOKUP_NOT_FOUND", "Không tìm thấy bản ghi.");

        var referenced = await db.LookupItems
            .Where(x => x.ParentItemId == id || x.RefItemId1 == id || x.RefItemId2 == id)
            .Select(x => x.CategoryCode + ":" + x.Code)
            .Take(5)
            .ToListAsync(ct);

        if (referenced.Count > 0)
            throw new DomainException("LOOKUP_IN_USE",
                "Không thể xóa: bản ghi đang được tham chiếu.",
                409,
                new { referencedBy = referenced });

        db.LookupItems.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    internal static LookupItemDto ToDto(LookupItem x) => new(
        x.Id, x.CategoryCode, x.Code, x.Name, x.Note, x.IsActive, x.SortOrder,
        x.ParentItemId, x.Parent is null ? null : new LookupItemRefDto(x.Parent.Id, x.Parent.Code, x.Parent.Name),
        x.RefItemId1, x.Ref1 is null ? null : new LookupItemRefDto(x.Ref1.Id, x.Ref1.Code, x.Ref1.Name),
        x.RefItemId2, x.Ref2 is null ? null : new LookupItemRefDto(x.Ref2.Id, x.Ref2.Code, x.Ref2.Name),
        x.Extra, x.CreatedAt, x.UpdatedAt);
}
