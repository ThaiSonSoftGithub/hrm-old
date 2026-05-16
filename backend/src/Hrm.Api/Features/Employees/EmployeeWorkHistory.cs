using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Employees;

/// <summary>Quá trình công tác nội bộ — sublist Tab 09.</summary>
public sealed class EmployeeWorkHistory : EntityBase
{
    public Guid EmployeeId { get; set; }
    public DateTime FromDate { get; set; }
    public DateTime? ToDate { get; set; }
    public bool IsCurrent { get; set; }
    public Guid JobPositionId { get; set; }
    public Guid? JobTitleId { get; set; }
    public Guid OrganizationUnitId { get; set; }
    public Guid DepartmentId { get; set; }
    public Guid? DirectManagerEmployeeId { get; set; }
    public string? DecisionNumber { get; set; }
    public DateTime? DecisionDate { get; set; }
    public string? Note { get; set; }
}
