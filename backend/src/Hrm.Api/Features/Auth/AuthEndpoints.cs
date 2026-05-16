using Hrm.Api.Common.Auth;
using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Persistence;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;

namespace Hrm.Api.Features.Auth;

public static class AuthEndpoints
{
    public static IEndpointRouteBuilder MapAuthEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/auth");

        group.MapPost("/login", Login).AllowAnonymous();
        group.MapPost("/refresh", Refresh).AllowAnonymous();
        group.MapPost("/logout", Logout).RequireAuthorization();
        group.MapGet("/me", Me).RequireAuthorization();

        return routes;
    }

    private static async Task<IResult> Login(
        [FromBody] LoginRequest req,
        HrmDbContext db,
        IPasswordHasher hasher,
        IJwtTokenService jwt,
        IOptions<JwtSettings> settings,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
            throw new DomainException("INVALID_CREDENTIALS", "Tài khoản hoặc mật khẩu không đúng.", 401);

        var user = await db.Users.FirstOrDefaultAsync(u => u.Username == req.Username, ct);
        if (user is null || user.Status != "Active" || !hasher.Verify(req.Password, user.PasswordHash))
            throw new DomainException("INVALID_CREDENTIALS", "Tài khoản hoặc mật khẩu không đúng.", 401);

        return Results.Ok(await IssueTokens(user, db, jwt, settings.Value, ct));
    }

    private static async Task<IResult> Refresh(
        [FromBody] RefreshRequest req,
        HrmDbContext db,
        IJwtTokenService jwt,
        IOptions<JwtSettings> settings,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.RefreshToken))
            throw new DomainException("INVALID_REFRESH_TOKEN", "Refresh token không hợp lệ.", 401);

        var hash = jwt.HashRefreshToken(req.RefreshToken);
        var user = await db.Users.FirstOrDefaultAsync(u =>
            u.RefreshTokenHash == hash &&
            u.RefreshTokenExpiresAt != null &&
            u.RefreshTokenExpiresAt > DateTime.UtcNow &&
            u.Status == "Active", ct);

        if (user is null)
            throw new DomainException("INVALID_REFRESH_TOKEN", "Refresh token không hợp lệ.", 401);

        return Results.Ok(await IssueTokens(user, db, jwt, settings.Value, ct));
    }

    private static async Task<IResult> Logout(
        [FromBody] LogoutRequest req,
        HrmDbContext db,
        IJwtTokenService jwt,
        ICurrentUser current,
        CancellationToken ct)
    {
        if (current.UserId is null) return Results.NoContent();
        var user = await db.Users.FindAsync(new object?[] { current.UserId }, ct);
        if (user is not null)
        {
            user.RefreshTokenHash = null;
            user.RefreshTokenExpiresAt = null;
            await db.SaveChangesAsync(ct);
        }
        return Results.NoContent();
    }

    private static async Task<IResult> Me(HrmDbContext db, ICurrentUser current, CancellationToken ct)
    {
        if (current.UserId is null) return Results.Unauthorized();
        var user = await db.Users.FindAsync(new object?[] { current.UserId }, ct);
        if (user is null) return Results.Unauthorized();
        return Results.Ok(new AuthUserDto(user.Id, user.Username, user.DisplayName, user.Email));
    }

    private static async Task<LoginResponse> IssueTokens(
        User user, HrmDbContext db, IJwtTokenService jwt, JwtSettings settings, CancellationToken ct)
    {
        var (access, expires) = jwt.IssueAccessToken(user);
        var refresh = jwt.GenerateRefreshToken();

        user.RefreshTokenHash = jwt.HashRefreshToken(refresh);
        user.RefreshTokenExpiresAt = DateTime.UtcNow.AddDays(settings.RefreshTokenDays);
        await db.SaveChangesAsync(ct);

        return new LoginResponse(access, refresh, expires,
            new AuthUserDto(user.Id, user.Username, user.DisplayName, user.Email));
    }
}
