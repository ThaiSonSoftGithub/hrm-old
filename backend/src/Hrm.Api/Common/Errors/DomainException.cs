namespace Hrm.Api.Common.Errors;

public class DomainException : Exception
{
    public string Code { get; }
    public int StatusCode { get; }
    public object? Details { get; }

    public DomainException(string code, string message, int statusCode = 400, object? details = null)
        : base(message)
    {
        Code = code;
        StatusCode = statusCode;
        Details = details;
    }
}
