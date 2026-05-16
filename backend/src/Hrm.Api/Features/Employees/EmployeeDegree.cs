using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Employees;

/// <summary>Bằng cấp / quá trình đào tạo — sublist Tab 06.</summary>
public sealed class EmployeeDegree : EntityBase
{
    public Guid EmployeeId { get; set; }
    public Guid EducationPlaceId { get; set; }
    public int? FromYear { get; set; }
    public int? ToYear { get; set; }
    public Guid? EducationFacultyId { get; set; }
    public Guid? EducationMajorId { get; set; }
    public Guid? EducationLevelId { get; set; }
    /// <summary>Hình thức đào tạo (TrainingMode lookup).</summary>
    public Guid? EducationMethodId { get; set; }
    /// <summary>Xếp loại bằng cấp (DegreeRank lookup).</summary>
    public Guid? DegreeClassificationId { get; set; }
    public int? GraduationYear { get; set; }
    public string? Note { get; set; }
}
