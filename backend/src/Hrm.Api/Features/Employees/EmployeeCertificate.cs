using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Employees;

/// <summary>Chứng chỉ — sublist Tab 07.</summary>
public sealed class EmployeeCertificate : EntityBase
{
    public Guid EmployeeId { get; set; }
    public Guid CertificateTypeId { get; set; }
    public string CertificateName { get; set; } = "";
    public string? CertificateNumber { get; set; }
    public Guid? EducationLevelId { get; set; }
    public DateTime? IssuedDate { get; set; }
    public DateTime? ExpiryDate { get; set; }
    public string? IssuedPlace { get; set; }
    /// <summary>Xếp loại chứng chỉ (CertificateRank lookup).</summary>
    public Guid? CertificateClassificationId { get; set; }
    public string? Note { get; set; }
}
