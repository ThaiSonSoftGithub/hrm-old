using Hrm.Api.Common.Persistence;
using Hrm.Api.Features.Auth;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Authorization;

/// <summary>
/// Seed dữ liệu mặc định cho khối phân quyền: 4 nhóm chức năng (Master Data, Organization,
/// Employee, Authorization) + screens + permissions + 3 nhóm quyền chuẩn + assign admin.
/// </summary>
public sealed class AuthorizationSeeder
{
    private readonly HrmDbContext _db;
    private readonly ILogger<AuthorizationSeeder> _log;

    public AuthorizationSeeder(HrmDbContext db, ILogger<AuthorizationSeeder> log)
    {
        _db = db; _log = log;
    }

    private record FgSeed(string Code, string Name, string Note, ScreenSeed[] Screens);
    private record ScreenSeed(string Code, string Name, string Note, PermSeed[] Permissions);
    private record PermSeed(string Code, string Note);

    private static readonly FgSeed[] FunctionGroups =
    {
        new("MASTER_DATA", "Quản lý danh mục", "Các màn hình danh mục dùng chung",
            new[]
            {
                new ScreenSeed("MD_HOME", "Danh mục", "Trang điều hướng các danh mục", new[]
                {
                    new PermSeed(AuthPermissions.MdView, "Xem danh mục"),
                    new PermSeed(AuthPermissions.MdCreate, "Thêm bản ghi danh mục"),
                    new PermSeed(AuthPermissions.MdEdit, "Sửa bản ghi danh mục"),
                    new PermSeed(AuthPermissions.MdDelete, "Xóa bản ghi danh mục"),
                })
            }),
        new("ORGANIZATION", "Cơ cấu tổ chức", "Quản lý đơn vị, phòng ban",
            new[]
            {
                new ScreenSeed("ORG_UNITS", "Đơn vị tổ chức", "Cây + lưới đơn vị", new[]
                {
                    new PermSeed(AuthPermissions.OrgView, "Xem cơ cấu tổ chức"),
                    new PermSeed(AuthPermissions.OrgCreate, "Thêm đơn vị"),
                    new PermSeed(AuthPermissions.OrgEdit, "Sửa đơn vị"),
                    new PermSeed(AuthPermissions.OrgDelete, "Xóa đơn vị"),
                })
            }),
        new("EMPLOYEE", "Hồ sơ nhân sự", "Module hồ sơ nhân sự (Phase 4)",
            new[]
            {
                new ScreenSeed("EMP_PROFILE", "Hồ sơ", "Hồ sơ nhân sự", new[]
                {
                    new PermSeed(AuthPermissions.EmpView, "Xem hồ sơ"),
                    new PermSeed(AuthPermissions.EmpCreate, "Thêm hồ sơ"),
                    new PermSeed(AuthPermissions.EmpEdit, "Sửa hồ sơ"),
                    new PermSeed(AuthPermissions.EmpDelete, "Xóa hồ sơ"),
                })
            }),
        new("AUTHORIZATION", "Phân quyền", "Quản lý nhóm quyền, quyền, nhóm chức năng, màn hình",
            new[]
            {
                new ScreenSeed("AUTH_ROLE_GROUPS", "Nhóm quyền", "Quản lý nhóm quyền", new[]
                {
                    new PermSeed(AuthPermissions.AuthView, "Xem phân quyền"),
                    new PermSeed(AuthPermissions.AuthCreate, "Thêm nhóm/quyền/màn hình"),
                    new PermSeed(AuthPermissions.AuthEdit, "Sửa nhóm/quyền/màn hình"),
                    new PermSeed(AuthPermissions.AuthDelete, "Xóa nhóm/quyền/màn hình"),
                    new PermSeed(AuthPermissions.AuthAssign, "Gán quyền/người dùng"),
                }),
                new ScreenSeed("USER_MANAGEMENT", "Người dùng hệ thống", "Quản lý tài khoản đăng nhập", new[]
                {
                    new PermSeed(AuthPermissions.UserView, "Xem người dùng"),
                    new PermSeed(AuthPermissions.UserCreate, "Thêm người dùng"),
                    new PermSeed(AuthPermissions.UserEdit, "Sửa thông tin người dùng"),
                    new PermSeed(AuthPermissions.UserDelete, "Xóa người dùng"),
                    new PermSeed(AuthPermissions.UserResetPassword, "Đặt lại mật khẩu"),
                    new PermSeed(AuthPermissions.UserLock, "Khoá / mở khoá tài khoản"),
                })
            })
    };

    public async Task SeedAsync(CancellationToken ct)
    {
        await SeedFunctionGroupsAsync(ct);
        await SeedRoleGroupsAsync(ct);
        await AssignAdminAsync(ct);
    }

    private async Task SeedFunctionGroupsAsync(CancellationToken ct)
    {
        var existingFgs = await _db.FunctionGroups.ToDictionaryAsync(x => x.Code, ct);
        var existingScreens = await _db.Screens.ToDictionaryAsync(x => x.Code, ct);
        var existingPerms = await _db.Permissions.ToDictionaryAsync(x => x.Code, ct);
        var existingMembership = await _db.FunctionGroupScreens
            .ToDictionaryAsync(x => (x.FunctionGroupId, x.ScreenId), x => x, ct);

        foreach (var fg in FunctionGroups)
        {
            if (!existingFgs.TryGetValue(fg.Code, out var fgEntity))
            {
                fgEntity = new FunctionGroup { Code = fg.Code, Name = fg.Name, Note = fg.Note, IsActive = true };
                _db.FunctionGroups.Add(fgEntity);
                await _db.SaveChangesAsync(ct);
                existingFgs[fg.Code] = fgEntity;
                _log.LogInformation("Seeded FunctionGroup '{Code}'.", fg.Code);
            }

            foreach (var sc in fg.Screens)
            {
                if (!existingScreens.TryGetValue(sc.Code, out var scEntity))
                {
                    scEntity = new Screen
                    {
                        Code = sc.Code, Name = sc.Name, Note = sc.Note,
                        FunctionGroupId = fgEntity.Id, IsActive = true
                    };
                    _db.Screens.Add(scEntity);
                    await _db.SaveChangesAsync(ct);
                    existingScreens[sc.Code] = scEntity;
                }

                if (!existingMembership.ContainsKey((fgEntity.Id, scEntity.Id)))
                {
                    var fgs = new FunctionGroupScreen { FunctionGroupId = fgEntity.Id, ScreenId = scEntity.Id };
                    _db.FunctionGroupScreens.Add(fgs);
                    existingMembership[(fgEntity.Id, scEntity.Id)] = fgs;
                }

                foreach (var p in sc.Permissions)
                {
                    if (!existingPerms.ContainsKey(p.Code))
                    {
                        var permEntity = new Permission
                        {
                            Code = p.Code, Note = p.Note,
                            FunctionGroupId = fgEntity.Id, ScreenId = scEntity.Id
                        };
                        _db.Permissions.Add(permEntity);
                        existingPerms[p.Code] = permEntity;
                    }
                }
                await _db.SaveChangesAsync(ct);
            }
        }
    }

    private async Task SeedRoleGroupsAsync(CancellationToken ct)
    {
        var existing = await _db.RoleGroups.ToDictionaryAsync(x => x.Code, ct);

        var defs = new (string Code, string Name, string Note, string[] PermCodes)[]
        {
            (AuthPermissions.SystemAdminRoleCode, "System Admin", "Toàn quyền hệ thống", AuthPermissions.AllForSystemAdmin),
            (AuthPermissions.HrAdminRoleCode, "HR Admin", "Quản trị nhân sự", AuthPermissions.AllForHrAdmin),
            (AuthPermissions.EmployeeRoleCode, "Nhân viên", "Truy cập tự phục vụ", AuthPermissions.AllForEmployee),
        };

        foreach (var (code, name, note, permCodes) in defs)
        {
            if (!existing.TryGetValue(code, out var role))
            {
                role = new RoleGroup { Code = code, Name = name, Note = note, IsActive = true };
                _db.RoleGroups.Add(role);
                await _db.SaveChangesAsync(ct);
                existing[code] = role;
                _log.LogInformation("Seeded RoleGroup '{Code}'.", code);
            }

            var permIds = await _db.Permissions
                .Where(p => permCodes.Contains(p.Code))
                .Select(p => p.Id).ToListAsync(ct);
            var existingLinks = await _db.RoleGroupPermissions
                .Where(x => x.RoleGroupId == role.Id)
                .Select(x => x.PermissionId).ToListAsync(ct);
            var toAdd = permIds.Except(existingLinks).ToList();
            if (toAdd.Count > 0)
            {
                _db.RoleGroupPermissions.AddRange(toAdd.Select(pid =>
                    new RoleGroupPermission { RoleGroupId = role.Id, PermissionId = pid }));
                await _db.SaveChangesAsync(ct);
            }
        }
    }

    private async Task AssignAdminAsync(CancellationToken ct)
    {
        var admin = await _db.Users.FirstOrDefaultAsync(u => u.Username == "admin", ct);
        if (admin is null) return;
        var sysAdmin = await _db.RoleGroups.FirstOrDefaultAsync(r => r.Code == AuthPermissions.SystemAdminRoleCode, ct);
        if (sysAdmin is null) return;
        var exists = await _db.RoleGroupUsers.AnyAsync(x => x.RoleGroupId == sysAdmin.Id && x.UserId == admin.Id, ct);
        if (!exists)
        {
            _db.RoleGroupUsers.Add(new RoleGroupUser { RoleGroupId = sysAdmin.Id, UserId = admin.Id });
            await _db.SaveChangesAsync(ct);
            _log.LogInformation("Assigned admin user to '{Code}'.", AuthPermissions.SystemAdminRoleCode);
        }
    }
}
