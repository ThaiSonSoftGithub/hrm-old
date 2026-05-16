namespace Hrm.Api.Common.Errors;

public sealed record ErrorResponse(string Code, string Message, object? Details = null);
