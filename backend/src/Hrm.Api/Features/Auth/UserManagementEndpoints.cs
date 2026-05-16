using System.Text.RegularExpressions;
using Hrm.Api.Common.Auth;
using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Pagination;
using Hrm.Api.Common.Persistence;
using Hrm.Api.Features.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Auth;

/// <summary>
/// Endpoint quản lý người dùng đăng nhập hệ thống — tách biệt hoàn toàn với UserDirectoryEndpoints
/// (chỉ là picker phụ trợ).
/// </summary>
public static class UserManagementEndpoints
{
    private static readonly Regex EmailRegex = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);
    private static readonly string[] StatusValues = new[] { "Active", "Locked" };

    public static IEndpointRouteBuilder MapUserManagementEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/users").RequireAuthorization();

        group.MapGet("/", List).RequirePermission(AuthPermissions.UserView);
        group.MapGet("/{id:guid}", Get).RequirePermission(AuthPermissions.UserView);
        group.MapPost("/", Create).RequirePermission(AuthPermissions.UserCreate);
        group.MapPut("/{id:guid}", Update).RequirePermission(AuthPermissions.UserEdit);
        group.MapDelete("/{id:guid}", Delete).RequirePermission(AuthPermissions.UserDelete);
        group.MapPost("/{id:guid}/reset-password", ResetPassword).RequirePermission(AuthPermissions.UserResetPassword);
        group.MapPost("/{id:guid}/lock", Lock).RequirePermission(AuthPermissions.UserLock);
        group.MapPost("/{id:guid}/unlock", Unlock).RequirePermission(AuthPermissions.UserLock);
        return routes;
    }

    private static async Task<IResult> List(
        [AsParameters] PagedRequest q,
        [FromQuery] string? status,
        HrmDbContext db,
        CancellationToken ct)
    {
        var query = db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q.Keyword))
        {
            var k = q.Keyword.Trim();
            query = query.Where(x => x.Username.Contains(k) || x.DisplayName.Contains(k) || (x.Email != null && x.Email.Contains(k)));
        }
        if (!string.IsNullOrWhiteSpace(status)) query = query.Where(x => x.Status == status);
        query = query.OrderBy(x => x.Username);

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(q.Skip).Take(q.Take).ToListAsync(ct);
        var ids = rows.Select(r => r.Id).ToList();

        var memberships = await db.RoleGroupUsers.AsNoTracking()
            .Where(x => ids.Contains(x.UserId))
            .Join(db.RoleGroups.AsNoTracking(), m => m.RoleGroupId, g => g.Id, (m, g) => new { m.UserId, g.Id, g.Code, g.Name })
            .ToListAsync(ct);

        var items = rows.Select(r => new UserDto(
            r.Id, r.Username, r.DisplayName, r.Email, r.Status,
            memberships.Where(m => m.UserId == r.Id)
                .Select(m => new UserRoleGroupRefDto(m.Id, m.Code, m.Name))
                .ToArray(),
            r.CreatedAt, r.UpdatedAt
        )).ToList();
        return Results.Ok(new PagedResult<UserDto>(items, q.EffectivePage, q.Take, total));
    }

    private static async Task<IResult> Get(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var u = await db.Users.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy người dùng.");
        var roles = await db.RoleGroupUsers.AsNoTracking()
            .Where(x => x.UserId == id)
            .Join(db.RoleGroups.AsNoTracking(), m => m.RoleGroupId, g => g.Id, (m, g) => new UserRoleGroupRefDto(g.Id, g.Code, g.Name))
            .ToArrayAsync(ct);
        return Results.Ok(new UserDto(u.Id, u.Username, u.DisplayName, u.Email, u.Status, roles, u.CreatedAt, u.UpdatedAt));
    }

    private static async Task<IResult> Create(
        [FromBody] CreateUserRequest req,
        HrmDbContext db,
        IPasswordHasher hasher,
        CancellationToken ct)
    {
        ValidateUsername(req.Username);
        ValidateDisplayName(req.DisplayName);
        ValidatePassword(req.Password);
        ValidateEmail(req.Email);

        if (await db.Users.AnyAsync(x => x.Username == req.Username.Trim(), ct))
            throw new DomainException("USER_USERNAME_DUPLICATE", "Tên đăng nhập đã tồn tại.", 409);

        var user = new User
        {
            Username = req.Username.Trim(),
            DisplayName = req.DisplayName.Trim(),
            Email = req.Email?.Trim(),
            PasswordHash = hasher.Hash(req.Password),
            Status = "Active",
        };
        db.Users.Add(user);
        await db.SaveChangesAsync(ct);

        if (req.RoleGroupIds is { Length: > 0 })
        {
            await SetRolesAsync(db, user.Id, req.RoleGroupIds, ct);
            await db.SaveChangesAsync(ct);
        }

        return Results.Created($"/api/users/{user.Id}", new { id = user.Id });
    }

    private static async Task<IResult> Update(
        Guid id,
        [FromBody] UpdateUserRequest req,
        HrmDbContext db,
        CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy người dùng.");

        ValidateDisplayName(req.DisplayName);
        ValidateEmail(req.Email);

        user.DisplayName = req.DisplayName.Trim();
        user.Email = req.Email?.Trim();

        await SetRolesAsync(db, user.Id, req.RoleGroupIds ?? Array.Empty<Guid>(), ct);
        await db.SaveChangesAsync(ct);

        return await Get(id, db, ct);
    }

    private static async Task<IResult> Delete(Guid id, HrmDbContext db, ICurrentUser current, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy người dùng.");
        if (current.UserId == user.Id)
            throw new DomainException("USER_DELETE_BLOCKED", "Không thể tự xóa tài khoản của chính mình.", 409);

        var memberships = await db.RoleGroupUsers.Where(x => x.UserId == id).ToListAsync(ct);
        db.RoleGroupUsers.RemoveRange(memberships);
        db.Users.Remove(user);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> ResetPassword(
        Guid id,
        [FromBody] ResetPasswordRequest req,
        HrmDbContext db,
        IPasswordHasher hasher,
        CancellationToken ct)
    {
        ValidatePassword(req.NewPassword);

        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy người dùng.");
        user.PasswordHash = hasher.Hash(req.NewPassword);
        user.RefreshTokenHash = null;
        user.RefreshTokenExpiresAt = null;
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { message = "Đã đặt lại mật khẩu." });
    }

    private static async Task<IResult> Lock(Guid id, HrmDbContext db, ICurrentUser current, CancellationToken ct)
    {
        if (current.UserId == id)
            throw new DomainException("USER_LOCK_BLOCKED", "Không thể tự khoá tài khoản của chính mình.", 409);
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy người dùng.");
        user.Status = "Locked";
        user.RefreshTokenHash = null;
        user.RefreshTokenExpiresAt = null;
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { status = user.Status });
    }

    private static async Task<IResult> Unlock(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var user = await db.Users.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("USER_NOT_FOUND", "Không tìm thấy người dùng.");
        user.Status = "Active";
        await db.SaveChangesAsync(ct);
        return Results.Ok(new { status = user.Status });
    }

    // -------- helpers --------

    private static async Task SetRolesAsync(HrmDbContext db, Guid userId, IReadOnlyCollection<Guid> roleIds, CancellationToken ct)
    {
        var validIds = roleIds.Count == 0 ? new List<Guid>() :
            await db.RoleGroups.AsNoTracking().Where(r => roleIds.Contains(r.Id)).Select(r => r.Id).ToListAsync(ct);
        if (validIds.Count != roleIds.Count)
            throw new DomainException("USER_ROLE_GROUP_INVALID", "Có nhóm quyền không tồn tại.");

        var existing = await db.RoleGroupUsers.Where(x => x.UserId == userId).ToListAsync(ct);
        var existingIds = existing.Select(x => x.RoleGroupId).ToHashSet();
        var newSet = validIds.ToHashSet();

        var toRemove = existing.Where(x => !newSet.Contains(x.RoleGroupId)).ToList();
        var toAdd = validIds.Where(id => !existingIds.Contains(id))
            .Select(id => new RoleGroupUser { RoleGroupId = id, UserId = userId })
            .ToList();

        db.RoleGroupUsers.RemoveRange(toRemove);
        db.RoleGroupUsers.AddRange(toAdd);
    }

    private static void ValidateUsername(string? v)
    {
        if (string.IsNullOrWhiteSpace(v) || v.Length is < 3 or > 64)
            throw new DomainException("USER_USERNAME_REQUIRED", "Tên đăng nhập 3-64 ký tự.");
        if (!Regex.IsMatch(v, "^[a-zA-Z0-9._-]+$"))
            throw new DomainException("USER_USERNAME_INVALID", "Tên đăng nhập chỉ chứa chữ, số, '.', '_', '-'.");
    }

    private static void ValidateDisplayName(string? v)
    {
        if (string.IsNullOrWhiteSpace(v) || v.Length > 128)
            throw new DomainException("USER_DISPLAY_NAME_REQUIRED", "Tên hiển thị bắt buộc, tối đa 128 ký tự.");
    }

    private static void ValidatePassword(string? v)
    {
        if (string.IsNullOrEmpty(v) || v.Length < 6 || v.Length > 128)
            throw new DomainException("USER_PASSWORD_INVALID", "Mật khẩu cần 6-128 ký tự.");
    }

    private static void ValidateEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return;
        if (!EmailRegex.IsMatch(email))
            throw new DomainException("USER_EMAIL_INVALID", "Email không hợp lệ.");
    }
}

public sealed record UserRoleGroupRefDto(Guid Id, string Code, string Name);

public sealed record UserDto(
    Guid Id, string Username, string DisplayName, string? Email, string Status,
    UserRoleGroupRefDto[] RoleGroups,
    DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record CreateUserRequest(
    string Username, string Password, string DisplayName, string? Email,
    Guid[]? RoleGroupIds);

public sealed record UpdateUserRequest(
    string DisplayName, string? Email,
    Guid[]? RoleGroupIds);

public sealed record ResetPasswordRequest(string NewPassword);
