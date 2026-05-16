using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Pagination;
using Hrm.Api.Common.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Authorization;

public static class RoleGroupEndpoints
{
    public static IEndpointRouteBuilder MapRoleGroupEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/authorization/role-groups").RequireAuthorization();

        group.MapGet("/", List).RequirePermission(AuthPermissions.AuthView);
        group.MapGet("/{id:guid}", GetById).RequirePermission(AuthPermissions.AuthView);
        group.MapPost("/", Create).RequirePermission(AuthPermissions.AuthCreate);
        group.MapPut("/{id:guid}", Update).RequirePermission(AuthPermissions.AuthEdit);
        group.MapDelete("/{id:guid}", Delete).RequirePermission(AuthPermissions.AuthDelete);

        group.MapGet("/{id:guid}/permissions/tree", GetPermissionTree).RequirePermission(AuthPermissions.AuthView);
        group.MapPut("/{id:guid}/permissions", SavePermissions).RequirePermission(AuthPermissions.AuthAssign);

        group.MapGet("/{id:guid}/users", GetUsers).RequirePermission(AuthPermissions.AuthView);
        group.MapPost("/{id:guid}/users", AddUsers).RequirePermission(AuthPermissions.AuthAssign);
        group.MapDelete("/{id:guid}/users", RemoveUsers).RequirePermission(AuthPermissions.AuthAssign);

        return routes;
    }

    private static async Task<IResult> List([AsParameters] PagedRequest q, HrmDbContext db, CancellationToken ct)
    {
        var query = db.RoleGroups.AsNoTracking().AsQueryable();
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
        var items = await ToDtosAsync(db, rows, ct);
        return Results.Ok(new PagedResult<RoleGroupDto>(items, q.EffectivePage, q.Take, total));
    }

    private static async Task<IResult> GetById(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.RoleGroups.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("ROLE_GROUP_NOT_FOUND", "Không tìm thấy nhóm quyền.");
        return Results.Ok((await ToDtosAsync(db, new[] { entity }, ct)).Single());
    }

    private static async Task<IResult> Create([FromBody] CreateRoleGroupRequest req, HrmDbContext db, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Code) || req.Code.Length > 64)
            throw new DomainException("ROLE_GROUP_CODE_REQUIRED", "Mã nhóm quyền bắt buộc và tối đa 64 ký tự.");
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 256)
            throw new DomainException("ROLE_GROUP_NAME_REQUIRED", "Tên nhóm quyền bắt buộc và tối đa 256 ký tự.");
        if (req.Note is { Length: > 2000 })
            throw new DomainException("ROLE_GROUP_NAME_REQUIRED", "Ghi chú tối đa 2000 ký tự.");

        if (await db.RoleGroups.AnyAsync(x => x.Code == req.Code, ct))
            throw new DomainException("ROLE_GROUP_CODE_DUPLICATE", "Mã nhóm quyền đã tồn tại.", 409);

        var entity = new RoleGroup
        {
            Code = req.Code.Trim(),
            Name = req.Name.Trim(),
            Note = req.Note,
            IsActive = req.IsActive
        };
        db.RoleGroups.Add(entity);
        await db.SaveChangesAsync(ct);
        var dto = (await ToDtosAsync(db, new[] { entity }, ct)).Single();
        return Results.Created($"/api/authorization/role-groups/{entity.Id}", dto);
    }

    private static async Task<IResult> Update(Guid id, [FromBody] UpdateRoleGroupRequest req, HrmDbContext db, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 256)
            throw new DomainException("ROLE_GROUP_NAME_REQUIRED", "Tên nhóm quyền bắt buộc.");
        if (req.Note is { Length: > 2000 })
            throw new DomainException("ROLE_GROUP_NAME_REQUIRED", "Ghi chú tối đa 2000 ký tự.");

        var entity = await db.RoleGroups.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("ROLE_GROUP_NOT_FOUND", "Không tìm thấy nhóm quyền.");
        entity.Name = req.Name.Trim();
        entity.Note = req.Note;
        entity.IsActive = req.IsActive;
        await db.SaveChangesAsync(ct);
        var dto = (await ToDtosAsync(db, new[] { entity }, ct)).Single();
        return Results.Ok(dto);
    }

    private static async Task<IResult> Delete(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.RoleGroups.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("ROLE_GROUP_NOT_FOUND", "Không tìm thấy nhóm quyền.");

        var hasUsers = await db.RoleGroupUsers.AnyAsync(x => x.RoleGroupId == id, ct);
        if (hasUsers)
            throw new DomainException("ROLE_GROUP_DELETE_BLOCKED",
                "Không thể xóa: nhóm quyền đang có người dùng.", 409);

        var perms = db.RoleGroupPermissions.Where(x => x.RoleGroupId == id);
        db.RoleGroupPermissions.RemoveRange(perms);
        db.RoleGroups.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> GetPermissionTree(Guid id, HrmDbContext db, CancellationToken ct)
    {
        if (!await db.RoleGroups.AnyAsync(x => x.Id == id, ct))
            throw new NotFoundException("ROLE_GROUP_NOT_FOUND", "Không tìm thấy nhóm quyền.");

        var selectedList = await db.RoleGroupPermissions
            .Where(x => x.RoleGroupId == id)
            .Select(x => x.PermissionId)
            .ToListAsync(ct);
        var selected = selectedList.ToHashSet();

        var fgs = await db.FunctionGroups.AsNoTracking().OrderBy(x => x.Code).ToListAsync(ct);
        var screens = await db.Screens.AsNoTracking().OrderBy(x => x.Code).ToListAsync(ct);
        var perms = await db.Permissions.AsNoTracking().OrderBy(x => x.Code).ToListAsync(ct);

        var screensByFg = screens.GroupBy(x => x.FunctionGroupId).ToDictionary(g => g.Key, g => g.ToList());
        var permsByScreen = perms.GroupBy(x => x.ScreenId).ToDictionary(g => g.Key, g => g.ToList());

        var tree = fgs.Select(fg =>
        {
            var fgScreens = screensByFg.GetValueOrDefault(fg.Id, new List<Screen>());
            var screenNodes = fgScreens.Select(sc =>
            {
                var leaves = permsByScreen.GetValueOrDefault(sc.Id, new List<Permission>())
                    .Select(p => new PermissionTreeLeafDto(p.Id, p.Code, p.Note, selected.Contains(p.Id)))
                    .ToList();
                return new PermissionTreeScreenDto(sc.Id, sc.Code, sc.Name, leaves);
            }).ToList();
            return new PermissionTreeNodeDto(fg.Id, fg.Code, fg.Name, screenNodes);
        }).ToList();

        return Results.Ok(tree);
    }

    private static async Task<IResult> SavePermissions(Guid id, [FromBody] SavePermissionsRequest req, HrmDbContext db, CancellationToken ct)
    {
        if (!await db.RoleGroups.AnyAsync(x => x.Id == id, ct))
            throw new NotFoundException("ROLE_GROUP_NOT_FOUND", "Không tìm thấy nhóm quyền.");

        var ids = req.PermissionIds?.Distinct().ToList() ?? new List<Guid>();
        var validIds = ids.Count == 0 ? new List<Guid>() :
            await db.Permissions.Where(p => ids.Contains(p.Id)).Select(p => p.Id).ToListAsync(ct);

        var existing = db.RoleGroupPermissions.Where(x => x.RoleGroupId == id);
        db.RoleGroupPermissions.RemoveRange(existing);
        if (validIds.Count > 0)
        {
            db.RoleGroupPermissions.AddRange(validIds.Select(pid =>
                new RoleGroupPermission { RoleGroupId = id, PermissionId = pid }));
        }
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> GetUsers(Guid id, HrmDbContext db, CancellationToken ct)
    {
        if (!await db.RoleGroups.AnyAsync(x => x.Id == id, ct))
            throw new NotFoundException("ROLE_GROUP_NOT_FOUND", "Không tìm thấy nhóm quyền.");

        var users = await (from m in db.RoleGroupUsers
                           join u in db.Users on m.UserId equals u.Id
                           where m.RoleGroupId == id
                           orderby u.Username
                           select new RoleGroupUserDto(u.Id, u.Username, u.DisplayName, u.Email, u.Status))
                          .ToListAsync(ct);
        return Results.Ok(users);
    }

    private static async Task<IResult> AddUsers(Guid id, [FromBody] AddUsersRequest req, HrmDbContext db, CancellationToken ct)
    {
        if (req.UserIds is null || req.UserIds.Count == 0)
            throw new DomainException("ROLE_GROUP_USER_SELECTION_REQUIRED", "Chưa chọn người dùng nào.");
        if (!await db.RoleGroups.AnyAsync(x => x.Id == id, ct))
            throw new NotFoundException("ROLE_GROUP_NOT_FOUND", "Không tìm thấy nhóm quyền.");

        var validUserIds = await db.Users.Where(u => req.UserIds.Contains(u.Id)).Select(u => u.Id).ToListAsync(ct);
        var existing = await db.RoleGroupUsers.Where(x => x.RoleGroupId == id).Select(x => x.UserId).ToListAsync(ct);
        var toAdd = validUserIds.Except(existing).ToList();
        if (toAdd.Count > 0)
        {
            db.RoleGroupUsers.AddRange(toAdd.Select(uid => new RoleGroupUser { RoleGroupId = id, UserId = uid }));
            await db.SaveChangesAsync(ct);
        }
        return Results.NoContent();
    }

    private static async Task<IResult> RemoveUsers(Guid id, [FromBody] RemoveUsersRequest req, HrmDbContext db, CancellationToken ct)
    {
        if (req.UserIds is null || req.UserIds.Count == 0)
            throw new DomainException("ROLE_GROUP_USER_SELECTION_REQUIRED", "Chưa chọn người dùng nào.");
        var members = db.RoleGroupUsers.Where(x => x.RoleGroupId == id && req.UserIds.Contains(x.UserId));
        db.RoleGroupUsers.RemoveRange(members);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<List<RoleGroupDto>> ToDtosAsync(HrmDbContext db, IEnumerable<RoleGroup> rows, CancellationToken ct)
    {
        var list = rows.ToList();
        if (list.Count == 0) return new();
        var ids = list.Select(x => x.Id).ToList();
        var userCounts = await db.RoleGroupUsers.Where(x => ids.Contains(x.RoleGroupId))
            .GroupBy(x => x.RoleGroupId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToListAsync(ct);
        var permCounts = await db.RoleGroupPermissions.Where(x => ids.Contains(x.RoleGroupId))
            .GroupBy(x => x.RoleGroupId)
            .Select(g => new { Id = g.Key, Count = g.Count() })
            .ToListAsync(ct);
        var uMap = userCounts.ToDictionary(x => x.Id, x => x.Count);
        var pMap = permCounts.ToDictionary(x => x.Id, x => x.Count);
        return list.Select(x => new RoleGroupDto(
            x.Id, x.Code, x.Name, x.Note, x.IsActive,
            uMap.GetValueOrDefault(x.Id), pMap.GetValueOrDefault(x.Id),
            x.CreatedAt, x.UpdatedAt)).ToList();
    }
}
