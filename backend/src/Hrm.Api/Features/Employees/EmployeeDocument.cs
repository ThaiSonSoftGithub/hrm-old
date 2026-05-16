using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Employees;

/// <summary>
/// Hồ sơ tài liệu — Tab 18. 1 document record có thể chứa nhiều file.
/// </summary>
public sealed class EmployeeDocument : EntityBase
{
    public Guid EmployeeId { get; set; }
    public string Name { get; set; } = "";
    public string Note { get; set; } = "";
    public DateTime? SubmittedAt { get; set; }
}

public sealed class EmployeeDocumentFile : EntityBase
{
    public Guid DocumentId { get; set; }
    public string FileName { get; set; } = "";
    public string ContentType { get; set; } = "";
    public long SizeBytes { get; set; }
    /// <summary>Path tương đối tới root storage (vd "employee-documents/{empId}/{guid}.pdf").</summary>
    public string StoredPath { get; set; } = "";
}
