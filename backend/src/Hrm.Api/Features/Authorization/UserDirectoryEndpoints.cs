using Hrm.Api.Common.Pagination;
using Hrm.Api.Common.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Authorization;

/// <summary>
/// Endpoint phụ trợ để chọn user khi gán vào nhóm quyền.
/// Không phải user-management đầy đủ — chỉ trả danh sách user phục vụ Authorization.
/// </summary>
public static class UserDirectoryEndpoints
{
    public static IEndpointRouteBuilder MapAuthorizationUserEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/authorization/users").RequireAuthorization();

        group.MapGet("/", List).RequirePermission(AuthPermissions.AuthView);

        return routes;
    }

    private static async Task<IResult> List([AsParameters] PagedRequest q, HrmDbContext db, CancellationToken ct)
    {
        var query = db.Users.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q.Keyword))
        {
            var k = q.Keyword.Trim();
            query = query.Where(x => x.Username.Contains(k) || x.DisplayName.Contains(k) || (x.Email != null && x.Email.Contains(k)));
        }
        query = query.OrderBy(x => x.Username);

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(q.Skip).Take(q.Take)
            .Select(u => new RoleGroupUserDto(u.Id, u.Username, u.DisplayName, u.Email, u.Status))
            .ToListAsync(ct);
        return Results.Ok(new PagedResult<RoleGroupUserDto>(rows, q.EffectivePage, q.Take, total));
    }
}
