using Hrm.Api.Common.Errors;

namespace Hrm.Api.Features.Authorization;

public static class RequirePermissionExtensions
{
    /// <summary>
    /// Yêu cầu user đang đăng nhập có quyền `code`. Trả 403 khi thiếu.
    /// </summary>
    public static TBuilder RequirePermission<TBuilder>(this TBuilder builder, string code)
        where TBuilder : IEndpointConventionBuilder
    {
        builder.Add(b =>
        {
            b.Metadata.Add(new RequiredPermissionMetadata(code));
        });
        builder.AddEndpointFilter(async (ctx, next) =>
        {
            var perm = ctx.HttpContext.RequestServices.GetRequiredService<IPermissionService>();
            if (!await perm.HasAsync(code, ctx.HttpContext.RequestAborted))
            {
                ctx.HttpContext.Response.StatusCode = StatusCodes.Status403Forbidden;
                ctx.HttpContext.Response.ContentType = "application/json";
                await ctx.HttpContext.Response.WriteAsync(System.Text.Json.JsonSerializer.Serialize(
                    new ErrorResponse("FORBIDDEN", $"Bạn không có quyền '{code}'.", null),
                    new System.Text.Json.JsonSerializerOptions { PropertyNamingPolicy = System.Text.Json.JsonNamingPolicy.CamelCase }));
                return null;
            }
            return await next(ctx);
        });
        return builder;
    }
}

public sealed record RequiredPermissionMetadata(string Code);
