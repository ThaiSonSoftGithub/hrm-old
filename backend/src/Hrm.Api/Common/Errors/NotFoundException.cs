namespace Hrm.Api.Common.Errors;

public sealed class NotFoundException : DomainException
{
    public NotFoundException(string code, string message, object? details = null)
        : base(code, message, 404, details) { }
}
