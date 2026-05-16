using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Pagination;
using Hrm.Api.Common.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Authorization;

public static class FunctionGroupEndpoints
{
    public static IEndpointRouteBuilder MapFunctionGroupEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/authorization/function-groups").RequireAuthorization();

        group.MapGet("/", List).RequirePermission(AuthPermissions.AuthView);
        group.MapGet("/options", Options).RequirePermission(AuthPermissions.AuthView);
        group.MapGet("/{id:guid}", GetById).RequirePermission(AuthPermissions.AuthView);
        group.MapPost("/", Create).RequirePermission(AuthPermissions.AuthCreate);
        group.MapPut("/{id:guid}", Update).RequirePermission(AuthPermissions.AuthEdit);
        group.MapDelete("/{id:guid}", Delete).RequirePermission(AuthPermissions.AuthDelete);

        group.MapGet("/{id:guid}/screens", ListMembershipScreens).RequirePermission(AuthPermissions.AuthView);
        group.MapPost("/{id:guid}/screens", AddScreens).RequirePermission(AuthPermissions.AuthAssign);
        group.MapDelete("/{id:guid}/screens", RemoveScreens).RequirePermission(AuthPermissions.AuthAssign);

        return routes;
    }

    private static async Task<IResult> List([AsParameters] PagedRequest q, HrmDbContext db, CancellationToken ct)
    {
        var query = db.FunctionGroups.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q.Keyword))
        {
            var k = q.Keyword.Trim();
            query = query.Where(x => x.Code.Contains(k) || x.Name.Contains(k));
        }
        if (q.IsActive is not null) query = query.Where(x => x.IsActive == q.IsActive);

        query = (q.SortBy?.ToLowerInvariant(), q.SortDirection?.ToLowerInvariant()) switch
        {
            ("name", "desc") => query.OrderByDescending(x => x.Name),
            ("name", _)      => query.OrderBy(x => x.Name),
            ("code", "desc") => query.OrderByDescending(x => x.Code),
            _                 => query.OrderBy(x => x.Code)
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(q.Skip).Take(q.Take).ToListAsync(ct);
        var items = rows.Select(ToDto).ToList();
        return Results.Ok(new PagedResult<FunctionGroupDto>(items, q.EffectivePage, q.Take, total));
    }

    private static async Task<IResult> Options(HrmDbContext db, CancellationToken ct)
    {
        var rows = await db.FunctionGroups.AsNoTracking()
            .Where(x => x.IsActive)
            .OrderBy(x => x.Code)
            .Select(x => new AuthRefDto(x.Id, x.Code, x.Name))
            .ToListAsync(ct);
        return Results.Ok(rows);
    }

    private static async Task<IResult> GetById(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.FunctionGroups.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("FUNCTION_GROUP_NOT_FOUND", "Không tìm thấy nhóm chức năng.");
        return Results.Ok(ToDto(entity));
    }

    private static async Task<IResult> Create([FromBody] CreateFunctionGroupRequest req, HrmDbContext db, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Code) || req.Code.Length > 64)
            throw new DomainException("FUNCTION_GROUP_CODE_REQUIRED", "Mã nhóm chức năng bắt buộc và tối đa 64 ký tự.");
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 256)
            throw new DomainException("FUNCTION_GROUP_NAME_REQUIRED", "Tên nhóm chức năng bắt buộc và tối đa 256 ký tự.");
        if (req.Note is { Length: > 2000 })
            throw new DomainException("FUNCTION_GROUP_NAME_REQUIRED", "Ghi chú tối đa 2000 ký tự.");

        if (await db.FunctionGroups.AnyAsync(x => x.Code == req.Code, ct))
            throw new DomainException("FUNCTION_GROUP_CODE_DUPLICATE", "Mã nhóm chức năng đã tồn tại.", 409);

        var entity = new FunctionGroup
        {
            Code = req.Code.Trim(),
            Name = req.Name.Trim(),
            Note = req.Note,
            IsActive = req.IsActive
        };
        db.FunctionGroups.Add(entity);
        await db.SaveChangesAsync(ct);
        return Results.Created($"/api/authorization/function-groups/{entity.Id}", ToDto(entity));
    }

    private static async Task<IResult> Update(Guid id, [FromBody] UpdateFunctionGroupRequest req, HrmDbContext db, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 256)
            throw new DomainException("FUNCTION_GROUP_NAME_REQUIRED", "Tên nhóm chức năng bắt buộc.");
        if (req.Note is { Length: > 2000 })
            throw new DomainException("FUNCTION_GROUP_NAME_REQUIRED", "Ghi chú tối đa 2000 ký tự.");

        var entity = await db.FunctionGroups.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("FUNCTION_GROUP_NOT_FOUND", "Không tìm thấy nhóm chức năng.");
        entity.Name = req.Name.Trim();
        entity.Note = req.Note;
        entity.IsActive = req.IsActive;
        await db.SaveChangesAsync(ct);
        return Results.Ok(ToDto(entity));
    }

    private static async Task<IResult> Delete(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.FunctionGroups.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("FUNCTION_GROUP_NOT_FOUND", "Không tìm thấy nhóm chức năng.");
        if (await db.Screens.AnyAsync(s => s.FunctionGroupId == id, ct))
            throw new DomainException("FUNCTION_GROUP_DELETE_BLOCKED",
                "Không thể xóa: vẫn còn màn hình thuộc nhóm này.", 409);
        if (await db.Permissions.AnyAsync(p => p.FunctionGroupId == id, ct))
            throw new DomainException("FUNCTION_GROUP_DELETE_BLOCKED",
                "Không thể xóa: vẫn còn quyền thuộc nhóm này.", 409);

        var members = db.FunctionGroupScreens.Where(x => x.FunctionGroupId == id);
        db.FunctionGroupScreens.RemoveRange(members);
        db.FunctionGroups.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> ListMembershipScreens(Guid id, HrmDbContext db, CancellationToken ct)
    {
        if (!await db.FunctionGroups.AnyAsync(x => x.Id == id, ct))
            throw new NotFoundException("FUNCTION_GROUP_NOT_FOUND", "Không tìm thấy nhóm chức năng.");

        var screens = await (from m in db.FunctionGroupScreens
                             join s in db.Screens on m.ScreenId equals s.Id
                             where m.FunctionGroupId == id
                             orderby s.Code
                             select new ScreenDto(
                                 s.Id, s.Code, s.Name, s.Note,
                                 s.FunctionGroupId, null,
                                 s.IsActive, s.CreatedAt, s.UpdatedAt))
                            .ToListAsync(ct);
        return Results.Ok(screens);
    }

    private static async Task<IResult> AddScreens(Guid id, [FromBody] AddScreensRequest req, HrmDbContext db, CancellationToken ct)
    {
        if (req.ScreenIds is null || req.ScreenIds.Count == 0)
            throw new DomainException("FUNCTION_GROUP_SCREEN_SELECTION_REQUIRED", "Chưa chọn màn hình nào.");
        if (!await db.FunctionGroups.AnyAsync(x => x.Id == id, ct))
            throw new NotFoundException("FUNCTION_GROUP_NOT_FOUND", "Không tìm thấy nhóm chức năng.");

        var existing = await db.FunctionGroupScreens
            .Where(x => x.FunctionGroupId == id)
            .Select(x => x.ScreenId).ToListAsync(ct);
        var validScreens = await db.Screens.Where(s => req.ScreenIds.Contains(s.Id)).Select(s => s.Id).ToListAsync(ct);
        var toAdd = validScreens.Except(existing).Select(sid => new FunctionGroupScreen { FunctionGroupId = id, ScreenId = sid }).ToList();
        if (toAdd.Count > 0)
        {
            db.FunctionGroupScreens.AddRange(toAdd);
            await db.SaveChangesAsync(ct);
        }
        return Results.NoContent();
    }

    private static async Task<IResult> RemoveScreens(Guid id, [FromBody] RemoveScreensRequest req, HrmDbContext db, CancellationToken ct)
    {
        if (req.ScreenIds is null || req.ScreenIds.Count == 0)
            throw new DomainException("FUNCTION_GROUP_SCREEN_SELECTION_REQUIRED", "Chưa chọn màn hình nào.");
        var members = db.FunctionGroupScreens.Where(x => x.FunctionGroupId == id && req.ScreenIds.Contains(x.ScreenId));
        db.FunctionGroupScreens.RemoveRange(members);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static FunctionGroupDto ToDto(FunctionGroup x) =>
        new(x.Id, x.Code, x.Name, x.Note, x.IsActive, x.CreatedAt, x.UpdatedAt);
}
