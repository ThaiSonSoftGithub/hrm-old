namespace Hrm.Api.Common.Auth;

public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Username { get; }
}
