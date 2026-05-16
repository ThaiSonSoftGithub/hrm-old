using Hrm.Api.Common.Persistence;

namespace Hrm.Api.Features.Employees;

/// <summary>
/// Hợp đồng lao động — sublist child của Employee. Phase 4 Tab 04.
/// </summary>
public sealed class LaborContract : EntityBase
{
    public Guid EmployeeId { get; set; }

    public string ContractNumber { get; set; } = "";
    public Guid ContractTypeId { get; set; }
    /// <summary>Auto-fill từ contract type (vd: "12 tháng", "Không xác định"). FE chỉ lưu text snapshot.</summary>
    public string? ContractDurationText { get; set; }
    public Guid? WorkingTypeId { get; set; } // FK lookup WorkingForm

    public Guid JobPositionId { get; set; }
    public Guid DepartmentId { get; set; }

    public decimal? BaseSalary { get; set; }
    public decimal? InsuranceSalary { get; set; }
    public decimal? SalaryPercent { get; set; }

    public DateTime EffectiveStartDate { get; set; }
    public DateTime EffectiveEndDate { get; set; }

    public Guid? SignerEmployeeId { get; set; }
    /// <summary>Snapshot chức danh người ký (auto-fill từ signer).</summary>
    public string? SignerJobTitleText { get; set; }
    public DateTime? SignedDate { get; set; }

    public string? Note { get; set; }
}
