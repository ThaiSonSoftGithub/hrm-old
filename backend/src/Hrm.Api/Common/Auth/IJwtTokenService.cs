using Hrm.Api.Features.Auth;

namespace Hrm.Api.Common.Auth;

public interface IJwtTokenService
{
    (string AccessToken, int ExpiresInSeconds) IssueAccessToken(User user);
    string GenerateRefreshToken();
    string HashRefreshToken(string refreshToken);
}
