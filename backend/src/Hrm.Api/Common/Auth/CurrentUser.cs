using System.Security.Claims;
using Microsoft.AspNetCore.Http;

namespace Hrm.Api.Common.Auth;

public sealed class CurrentUser : ICurrentUser
{
    private readonly IHttpContextAccessor _accessor;
    public CurrentUser(IHttpContextAccessor accessor) => _accessor = accessor;

    public Guid? UserId
    {
        get
        {
            var sub = _accessor.HttpContext?.User.FindFirstValue(ClaimTypes.NameIdentifier)
                      ?? _accessor.HttpContext?.User.FindFirstValue("sub");
            return Guid.TryParse(sub, out var id) ? id : null;
        }
    }

    public string? Username =>
        _accessor.HttpContext?.User.FindFirstValue("username")
        ?? _accessor.HttpContext?.User.Identity?.Name;
}
