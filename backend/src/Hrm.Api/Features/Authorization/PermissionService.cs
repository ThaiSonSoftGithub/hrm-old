using Hrm.Api.Common.Auth;
using Hrm.Api.Common.Persistence;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Authorization;

public interface IPermissionService
{
    Task<bool> HasAsync(string code, CancellationToken ct);
    Task<IReadOnlySet<string>> GetEffectiveAsync(CancellationToken ct);
    Task<bool> IsSystemAdminAsync(CancellationToken ct);
}

/// <summary>
/// Resolve permission codes của user đang đăng nhập, cache trong scope của request.
/// </summary>
public sealed class PermissionService : IPermissionService
{
    private readonly HrmDbContext _db;
    private readonly ICurrentUser _current;
    private readonly IHttpContextAccessor _accessor;

    private const string CacheKey = "hrm.permissionCodes";
    private const string SysAdminKey = "hrm.isSystemAdmin";

    public PermissionService(HrmDbContext db, ICurrentUser current, IHttpContextAccessor accessor)
    {
        _db = db;
        _current = current;
        _accessor = accessor;
    }

    public async Task<bool> IsSystemAdminAsync(CancellationToken ct)
    {
        var ctx = _accessor.HttpContext;
        if (ctx is not null && ctx.Items.TryGetValue(SysAdminKey, out var cached) && cached is bool b)
            return b;

        var userId = _current.UserId;
        if (userId is null) return Cache(false);

        var isAdmin = await (from m in _db.RoleGroupUsers
                             join r in _db.RoleGroups on m.RoleGroupId equals r.Id
                             where m.UserId == userId && r.Code == AuthPermissions.SystemAdminRoleCode && r.IsActive
                             select r.Id).AnyAsync(ct);
        return Cache(isAdmin);

        bool Cache(bool v)
        {
            if (ctx is not null) ctx.Items[SysAdminKey] = v;
            return v;
        }
    }

    public async Task<IReadOnlySet<string>> GetEffectiveAsync(CancellationToken ct)
    {
        var ctx = _accessor.HttpContext;
        if (ctx is not null && ctx.Items.TryGetValue(CacheKey, out var cached) && cached is HashSet<string> set)
            return set;

        var userId = _current.UserId;
        if (userId is null) return Cache(new HashSet<string>(StringComparer.OrdinalIgnoreCase));

        if (await IsSystemAdminAsync(ct))
            return Cache(new HashSet<string>(AuthPermissions.AllForSystemAdmin, StringComparer.OrdinalIgnoreCase));

        var codes = await (from m in _db.RoleGroupUsers
                           join r in _db.RoleGroups on m.RoleGroupId equals r.Id
                           join rp in _db.RoleGroupPermissions on r.Id equals rp.RoleGroupId
                           join p in _db.Permissions on rp.PermissionId equals p.Id
                           where m.UserId == userId && r.IsActive
                           select p.Code)
                          .Distinct()
                          .ToListAsync(ct);
        return Cache(new HashSet<string>(codes, StringComparer.OrdinalIgnoreCase));

        IReadOnlySet<string> Cache(HashSet<string> v)
        {
            if (ctx is not null) ctx.Items[CacheKey] = v;
            return v;
        }
    }

    public async Task<bool> HasAsync(string code, CancellationToken ct)
    {
        if (await IsSystemAdminAsync(ct)) return true;
        var set = await GetEffectiveAsync(ct);
        return set.Contains(code);
    }
}
