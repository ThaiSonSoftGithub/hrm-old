using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Auth;

public sealed class User : EntityBase
{
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public string? Email { get; set; }
    public string Status { get; set; } = "Active";
    public string? RefreshTokenHash { get; set; }
    public DateTime? RefreshTokenExpiresAt { get; set; }
}
