using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Employees;

/// <summary>Kinh nghiệm làm việc bên ngoài — sublist Tab 08. Lưu month/year dạng "yyyy-MM".</summary>
public sealed class EmployeeWorkExperience : EntityBase
{
    public Guid EmployeeId { get; set; }
    public string FromMonthYear { get; set; } = ""; // "yyyy-MM"
    public string ToMonthYear { get; set; } = "";
    public string WorkplaceName { get; set; } = "";
    public string JobTitleText { get; set; } = "";
    public decimal? SalaryAmount { get; set; }
    public string? JobDescription { get; set; }
    public string? Note { get; set; }
    public string? ReferenceName { get; set; }
    public string? ReferenceJobTitle { get; set; }
    public string? ReferencePhone { get; set; }
    public string? ReferenceEmail { get; set; }
}
