using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Pagination;
using Hrm.Api.Common.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Authorization;

public static class ScreenEndpoints
{
    public static IEndpointRouteBuilder MapScreenEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/authorization/screens").RequireAuthorization();

        group.MapGet("/", List).RequirePermission(AuthPermissions.AuthView);
        group.MapGet("/options", Options).RequirePermission(AuthPermissions.AuthView);
        group.MapGet("/{id:guid}", GetById).RequirePermission(AuthPermissions.AuthView);
        group.MapPost("/", Create).RequirePermission(AuthPermissions.AuthCreate);
        group.MapPut("/{id:guid}", Update).RequirePermission(AuthPermissions.AuthEdit);
        group.MapDelete("/{id:guid}", Delete).RequirePermission(AuthPermissions.AuthDelete);

        return routes;
    }

    private static async Task<IResult> List(
        [AsParameters] PagedRequest q,
        [FromQuery] Guid? functionGroupId,
        HrmDbContext db,
        CancellationToken ct)
    {
        var query = db.Screens.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q.Keyword))
        {
            var k = q.Keyword.Trim();
            query = query.Where(x => x.Code.Contains(k) || x.Name.Contains(k));
        }
        if (q.IsActive is not null) query = query.Where(x => x.IsActive == q.IsActive);
        if (functionGroupId is not null) query = query.Where(x => x.FunctionGroupId == functionGroupId);

        query = (q.SortBy?.ToLowerInvariant(), q.SortDirection?.ToLowerInvariant()) switch
        {
            ("name", "desc") => query.OrderByDescending(x => x.Name),
            ("name", _)      => query.OrderBy(x => x.Name),
            ("code", "desc") => query.OrderByDescending(x => x.Code),
            _                 => query.OrderBy(x => x.Code)
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(q.Skip).Take(q.Take).ToListAsync(ct);
        var fgIds = rows.Select(x => x.FunctionGroupId).Distinct().ToList();
        var fgs = await db.FunctionGroups.AsNoTracking()
            .Where(x => fgIds.Contains(x.Id))
            .Select(x => new AuthRefDto(x.Id, x.Code, x.Name))
            .ToListAsync(ct);
        var fgDict = fgs.ToDictionary(x => x.Id);
        var items = rows.Select(x => ToDto(x, fgDict.GetValueOrDefault(x.FunctionGroupId))).ToList();
        return Results.Ok(new PagedResult<ScreenDto>(items, q.EffectivePage, q.Take, total));
    }

    private static async Task<IResult> Options(
        [FromQuery] Guid? functionGroupId,
        HrmDbContext db, CancellationToken ct)
    {
        var query = db.Screens.AsNoTracking().Where(x => x.IsActive);
        if (functionGroupId is not null) query = query.Where(x => x.FunctionGroupId == functionGroupId);
        var rows = await query.OrderBy(x => x.Code)
            .Select(x => new AuthRefDto(x.Id, x.Code, x.Name))
            .ToListAsync(ct);
        return Results.Ok(rows);
    }

    private static async Task<IResult> GetById(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.Screens.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("SCREEN_NOT_FOUND", "Không tìm thấy màn hình.");
        var fg = await db.FunctionGroups.AsNoTracking()
            .Where(x => x.Id == entity.FunctionGroupId)
            .Select(x => new AuthRefDto(x.Id, x.Code, x.Name))
            .FirstOrDefaultAsync(ct);
        return Results.Ok(ToDto(entity, fg));
    }

    private static async Task<IResult> Create([FromBody] CreateScreenRequest req, HrmDbContext db, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Code) || req.Code.Length > 64)
            throw new DomainException("SCREEN_CODE_REQUIRED", "Mã màn hình bắt buộc và tối đa 64 ký tự.");
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 256)
            throw new DomainException("SCREEN_NAME_REQUIRED", "Tên màn hình bắt buộc và tối đa 256 ký tự.");
        if (req.FunctionGroupId == Guid.Empty)
            throw new DomainException("SCREEN_FUNCTION_GROUP_REQUIRED", "Nhóm chức năng bắt buộc.");
        if (req.Note is { Length: > 2000 })
            throw new DomainException("SCREEN_NAME_REQUIRED", "Ghi chú tối đa 2000 ký tự.");

        if (!await db.FunctionGroups.AnyAsync(x => x.Id == req.FunctionGroupId, ct))
            throw new DomainException("SCREEN_FUNCTION_GROUP_REQUIRED", "Nhóm chức năng không tồn tại.");
        if (await db.Screens.AnyAsync(x => x.Code == req.Code, ct))
            throw new DomainException("SCREEN_CODE_DUPLICATE", "Mã màn hình đã tồn tại.", 409);

        var entity = new Screen
        {
            Code = req.Code.Trim(),
            Name = req.Name.Trim(),
            Note = req.Note,
            FunctionGroupId = req.FunctionGroupId,
            IsActive = req.IsActive
        };
        db.Screens.Add(entity);
        await db.SaveChangesAsync(ct);
        var fg = await db.FunctionGroups.AsNoTracking()
            .Where(x => x.Id == entity.FunctionGroupId)
            .Select(x => new AuthRefDto(x.Id, x.Code, x.Name))
            .FirstOrDefaultAsync(ct);
        return Results.Created($"/api/authorization/screens/{entity.Id}", ToDto(entity, fg));
    }

    private static async Task<IResult> Update(Guid id, [FromBody] UpdateScreenRequest req, HrmDbContext db, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 256)
            throw new DomainException("SCREEN_NAME_REQUIRED", "Tên màn hình bắt buộc.");
        if (req.FunctionGroupId == Guid.Empty)
            throw new DomainException("SCREEN_FUNCTION_GROUP_REQUIRED", "Nhóm chức năng bắt buộc.");
        if (req.Note is { Length: > 2000 })
            throw new DomainException("SCREEN_NAME_REQUIRED", "Ghi chú tối đa 2000 ký tự.");

        var entity = await db.Screens.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("SCREEN_NOT_FOUND", "Không tìm thấy màn hình.");
        if (!await db.FunctionGroups.AnyAsync(x => x.Id == req.FunctionGroupId, ct))
            throw new DomainException("SCREEN_FUNCTION_GROUP_REQUIRED", "Nhóm chức năng không tồn tại.");

        entity.Name = req.Name.Trim();
        entity.Note = req.Note;
        entity.FunctionGroupId = req.FunctionGroupId;
        entity.IsActive = req.IsActive;
        await db.SaveChangesAsync(ct);
        var fg = await db.FunctionGroups.AsNoTracking()
            .Where(x => x.Id == entity.FunctionGroupId)
            .Select(x => new AuthRefDto(x.Id, x.Code, x.Name))
            .FirstOrDefaultAsync(ct);
        return Results.Ok(ToDto(entity, fg));
    }

    private static async Task<IResult> Delete(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.Screens.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("SCREEN_NOT_FOUND", "Không tìm thấy màn hình.");
        if (await db.Permissions.AnyAsync(p => p.ScreenId == id, ct))
            throw new DomainException("SCREEN_DELETE_BLOCKED",
                "Không thể xóa: vẫn còn quyền thuộc màn hình này.", 409);

        var memberships = db.FunctionGroupScreens.Where(x => x.ScreenId == id);
        db.FunctionGroupScreens.RemoveRange(memberships);
        db.Screens.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static ScreenDto ToDto(Screen x, AuthRefDto? fg) =>
        new(x.Id, x.Code, x.Name, x.Note, x.FunctionGroupId, fg, x.IsActive, x.CreatedAt, x.UpdatedAt);
}
