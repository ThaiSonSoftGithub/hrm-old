namespace Hrm.Api.Common.Errors;

public sealed class ValidationException : DomainException
{
    public ValidationException(string message, object? details = null)
        : base("VALIDATION_ERROR", message, 400, details) { }
}
