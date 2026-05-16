using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Pagination;
using Hrm.Api.Common.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Authorization;

public static class PermissionEndpoints
{
    public static IEndpointRouteBuilder MapPermissionEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/authorization/permissions").RequireAuthorization();

        group.MapGet("/", List).RequirePermission(AuthPermissions.AuthView);
        group.MapGet("/{id:guid}", GetById).RequirePermission(AuthPermissions.AuthView);
        group.MapPost("/", Create).RequirePermission(AuthPermissions.AuthCreate);
        group.MapPut("/{id:guid}", Update).RequirePermission(AuthPermissions.AuthEdit);
        group.MapDelete("/{id:guid}", Delete).RequirePermission(AuthPermissions.AuthDelete);

        return routes;
    }

    private static async Task<IResult> List(
        [AsParameters] PagedRequest q,
        [FromQuery] Guid? functionGroupId,
        [FromQuery] Guid? screenId,
        HrmDbContext db,
        CancellationToken ct)
    {
        var query = db.Permissions.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q.Keyword))
        {
            var k = q.Keyword.Trim();
            query = query.Where(x => x.Code.Contains(k) || (x.Note != null && x.Note.Contains(k)));
        }
        if (functionGroupId is not null) query = query.Where(x => x.FunctionGroupId == functionGroupId);
        if (screenId is not null) query = query.Where(x => x.ScreenId == screenId);

        query = (q.SortBy?.ToLowerInvariant(), q.SortDirection?.ToLowerInvariant()) switch
        {
            ("code", "desc") => query.OrderByDescending(x => x.Code),
            _                 => query.OrderBy(x => x.Code)
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(q.Skip).Take(q.Take).ToListAsync(ct);
        var items = await ToDtosAsync(db, rows, ct);
        return Results.Ok(new PagedResult<PermissionDto>(items, q.EffectivePage, q.Take, total));
    }

    private static async Task<IResult> GetById(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.Permissions.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("PERMISSION_NOT_FOUND", "Không tìm thấy quyền.");
        return Results.Ok((await ToDtosAsync(db, new[] { entity }, ct)).Single());
    }

    private static async Task<IResult> Create([FromBody] CreatePermissionRequest req, HrmDbContext db, CancellationToken ct)
    {
        Validate(req.Code, req.FunctionGroupId, req.ScreenId, req.Note);

        if (await db.Permissions.AnyAsync(x => x.Code == req.Code, ct))
            throw new DomainException("PERMISSION_CODE_DUPLICATE", "Mã quyền đã tồn tại.", 409);
        await EnsureScreenInGroup(db, req.ScreenId, req.FunctionGroupId, ct);

        var entity = new Permission
        {
            Code = req.Code.Trim(),
            Note = req.Note,
            FunctionGroupId = req.FunctionGroupId,
            ScreenId = req.ScreenId
        };
        db.Permissions.Add(entity);
        await db.SaveChangesAsync(ct);
        var dto = (await ToDtosAsync(db, new[] { entity }, ct)).Single();
        return Results.Created($"/api/authorization/permissions/{entity.Id}", dto);
    }

    private static async Task<IResult> Update(Guid id, [FromBody] UpdatePermissionRequest req, HrmDbContext db, CancellationToken ct)
    {
        Validate(req.Code, req.FunctionGroupId, req.ScreenId, req.Note);
        var entity = await db.Permissions.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("PERMISSION_NOT_FOUND", "Không tìm thấy quyền.");
        if (entity.Code != req.Code && await db.Permissions.AnyAsync(x => x.Code == req.Code, ct))
            throw new DomainException("PERMISSION_CODE_DUPLICATE", "Mã quyền đã tồn tại.", 409);
        await EnsureScreenInGroup(db, req.ScreenId, req.FunctionGroupId, ct);

        entity.Code = req.Code.Trim();
        entity.Note = req.Note;
        entity.FunctionGroupId = req.FunctionGroupId;
        entity.ScreenId = req.ScreenId;
        await db.SaveChangesAsync(ct);
        var dto = (await ToDtosAsync(db, new[] { entity }, ct)).Single();
        return Results.Ok(dto);
    }

    private static async Task<IResult> Delete(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.Permissions.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("PERMISSION_NOT_FOUND", "Không tìm thấy quyền.");
        if (await db.RoleGroupPermissions.AnyAsync(x => x.PermissionId == id, ct))
            throw new DomainException("PERMISSION_DELETE_BLOCKED",
                "Không thể xóa: quyền đang được gán cho nhóm quyền.", 409);
        db.Permissions.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static void Validate(string code, Guid functionGroupId, Guid screenId, string? note)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Length > 128)
            throw new DomainException("PERMISSION_CODE_REQUIRED", "Mã quyền bắt buộc và tối đa 128 ký tự.");
        if (functionGroupId == Guid.Empty)
            throw new DomainException("PERMISSION_FUNCTION_GROUP_REQUIRED", "Nhóm chức năng bắt buộc.");
        if (screenId == Guid.Empty)
            throw new DomainException("PERMISSION_SCREEN_REQUIRED", "Màn hình bắt buộc.");
        if (note is { Length: > 2000 })
            throw new DomainException("PERMISSION_CODE_REQUIRED", "Ghi chú tối đa 2000 ký tự.");
    }

    private static async Task EnsureScreenInGroup(HrmDbContext db, Guid screenId, Guid functionGroupId, CancellationToken ct)
    {
        var screen = await db.Screens.AsNoTracking().FirstOrDefaultAsync(x => x.Id == screenId, ct)
            ?? throw new DomainException("PERMISSION_SCREEN_INVALID", "Màn hình không tồn tại.");
        if (screen.FunctionGroupId == functionGroupId) return;
        var inMembership = await db.FunctionGroupScreens
            .AnyAsync(x => x.FunctionGroupId == functionGroupId && x.ScreenId == screenId, ct);
        if (!inMembership)
            throw new DomainException("PERMISSION_SCREEN_INVALID", "Màn hình không thuộc nhóm chức năng được chọn.");
    }

    private static async Task<List<PermissionDto>> ToDtosAsync(HrmDbContext db, IEnumerable<Permission> rows, CancellationToken ct)
    {
        var list = rows.ToList();
        if (list.Count == 0) return new();
        var fgIds = list.Select(x => x.FunctionGroupId).Distinct().ToList();
        var scIds = list.Select(x => x.ScreenId).Distinct().ToList();
        var fgs = await db.FunctionGroups.AsNoTracking().Where(x => fgIds.Contains(x.Id))
            .Select(x => new AuthRefDto(x.Id, x.Code, x.Name)).ToListAsync(ct);
        var scs = await db.Screens.AsNoTracking().Where(x => scIds.Contains(x.Id))
            .Select(x => new AuthRefDto(x.Id, x.Code, x.Name)).ToListAsync(ct);
        var fgDict = fgs.ToDictionary(x => x.Id);
        var scDict = scs.ToDictionary(x => x.Id);
        return list.Select(x => new PermissionDto(
            x.Id, x.Code, x.Note,
            x.FunctionGroupId, fgDict.GetValueOrDefault(x.FunctionGroupId),
            x.ScreenId, scDict.GetValueOrDefault(x.ScreenId),
            x.CreatedAt, x.UpdatedAt)).ToList();
    }
}
