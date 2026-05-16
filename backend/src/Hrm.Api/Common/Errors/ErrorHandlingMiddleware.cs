using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Http;

namespace Hrm.Api.Common.Errors;

public sealed class ErrorHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ErrorHandlingMiddleware> _log;

    public ErrorHandlingMiddleware(RequestDelegate next, ILogger<ErrorHandlingMiddleware> log)
    {
        _next = next;
        _log = log;
    }

    public async Task Invoke(HttpContext ctx)
    {
        try { await _next(ctx); }
        catch (DomainException ex)
        {
            await Write(ctx, ex.StatusCode, new ErrorResponse(ex.Code, ex.Message, ex.Details));
        }
        catch (FluentValidation.ValidationException ex)
        {
            var details = ex.Errors.Select(e => new { field = e.PropertyName, message = e.ErrorMessage });
            await Write(ctx, 400, new ErrorResponse("VALIDATION_ERROR", "Dữ liệu không hợp lệ.", details));
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Unhandled exception");
            await Write(ctx, 500, new ErrorResponse("INTERNAL_ERROR", "Đã có lỗi xảy ra. Vui lòng thử lại."));
        }
    }

    private static Task Write(HttpContext ctx, int status, ErrorResponse body)
    {
        ctx.Response.StatusCode = status;
        ctx.Response.ContentType = "application/json";
        return ctx.Response.WriteAsync(JsonSerializer.Serialize(body, new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase
        }));
    }
}
