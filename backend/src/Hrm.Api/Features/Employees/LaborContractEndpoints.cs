using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Persistence;
using Hrm.Api.Features.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Employees;

/// <summary>
/// Sub-resource hợp đồng lao động của nhân viên (Tab 04). Guard EMP.* tương ứng.
/// </summary>
public static class LaborContractEndpoints
{
    public static IEndpointRouteBuilder MapLaborContractEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/employees/{employeeId:guid}/labor-contracts").RequireAuthorization();

        group.MapGet("/", List).RequirePermission(AuthPermissions.EmpView);
        group.MapPost("/", Create).RequirePermission(AuthPermissions.EmpEdit);
        group.MapPut("/{contractId:guid}", Update).RequirePermission(AuthPermissions.EmpEdit);
        group.MapDelete("/{contractId:guid}", Delete).RequirePermission(AuthPermissions.EmpEdit);
        return routes;
    }

    private static async Task<IResult> List(Guid employeeId, HrmDbContext db, CancellationToken ct)
    {
        var employee = await db.Employees.AsNoTracking().FirstOrDefaultAsync(x => x.Id == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");

        var rows = await db.LaborContracts.AsNoTracking()
            .Where(x => x.EmployeeId == employeeId)
            .OrderByDescending(x => x.EffectiveStartDate)
            .ToListAsync(ct);
        var items = await ToDtosAsync(db, employee, rows, ct);
        return Results.Ok(items);
    }

    private static async Task<IResult> Create(
        Guid employeeId,
        [FromBody] LaborContractInput req,
        HrmDbContext db,
        CancellationToken ct)
    {
        var employee = await db.Employees.AsNoTracking().FirstOrDefaultAsync(x => x.Id == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");

        await ValidateAsync(db, req, ct);

        var entity = new LaborContract
        {
            EmployeeId = employeeId,
            ContractNumber = req.ContractNumber.Trim(),
            ContractTypeId = req.ContractTypeId,
            ContractDurationText = req.ContractDurationText?.Trim(),
            WorkingTypeId = req.WorkingTypeId,
            JobPositionId = req.JobPositionId,
            DepartmentId = req.DepartmentId,
            BaseSalary = req.BaseSalary,
            InsuranceSalary = req.InsuranceSalary,
            SalaryPercent = req.SalaryPercent,
            EffectiveStartDate = req.EffectiveStartDate,
            EffectiveEndDate = req.EffectiveEndDate,
            SignerEmployeeId = req.SignerEmployeeId,
            SignerJobTitleText = req.SignerJobTitleText?.Trim(),
            SignedDate = req.SignedDate,
            Note = req.Note?.Trim(),
        };
        db.LaborContracts.Add(entity);
        await db.SaveChangesAsync(ct);

        var dto = (await ToDtosAsync(db, employee, new[] { entity }, ct)).Single();
        return Results.Created($"/api/employees/{employeeId}/labor-contracts/{entity.Id}", dto);
    }

    private static async Task<IResult> Update(
        Guid employeeId,
        Guid contractId,
        [FromBody] LaborContractInput req,
        HrmDbContext db,
        CancellationToken ct)
    {
        var employee = await db.Employees.AsNoTracking().FirstOrDefaultAsync(x => x.Id == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");
        var entity = await db.LaborContracts.FirstOrDefaultAsync(x => x.Id == contractId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_CONTRACT_NOT_FOUND", "Không tìm thấy hợp đồng.");

        await ValidateAsync(db, req, ct);

        entity.ContractNumber = req.ContractNumber.Trim();
        entity.ContractTypeId = req.ContractTypeId;
        entity.ContractDurationText = req.ContractDurationText?.Trim();
        entity.WorkingTypeId = req.WorkingTypeId;
        entity.JobPositionId = req.JobPositionId;
        entity.DepartmentId = req.DepartmentId;
        entity.BaseSalary = req.BaseSalary;
        entity.InsuranceSalary = req.InsuranceSalary;
        entity.SalaryPercent = req.SalaryPercent;
        entity.EffectiveStartDate = req.EffectiveStartDate;
        entity.EffectiveEndDate = req.EffectiveEndDate;
        entity.SignerEmployeeId = req.SignerEmployeeId;
        entity.SignerJobTitleText = req.SignerJobTitleText?.Trim();
        entity.SignedDate = req.SignedDate;
        entity.Note = req.Note?.Trim();

        await db.SaveChangesAsync(ct);

        var dto = (await ToDtosAsync(db, employee, new[] { entity }, ct)).Single();
        return Results.Ok(dto);
    }

    private static async Task<IResult> Delete(Guid employeeId, Guid contractId, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.LaborContracts.FirstOrDefaultAsync(x => x.Id == contractId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_CONTRACT_NOT_FOUND", "Không tìm thấy hợp đồng.");
        db.LaborContracts.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    // ---------- helpers ----------

    private static async Task ValidateAsync(HrmDbContext db, LaborContractInput req, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.ContractNumber) || req.ContractNumber.Length > 64)
            throw new DomainException("EMPLOYEE_CONTRACT_NUMBER_INVALID", "Số hợp đồng bắt buộc, tối đa 64 ký tự.");
        if (req.ContractTypeId == Guid.Empty)
            throw new DomainException("EMPLOYEE_CONTRACT_TYPE_REQUIRED", "Loại hợp đồng bắt buộc.");
        if (req.JobPositionId == Guid.Empty)
            throw new DomainException("EMPLOYEE_CONTRACT_JOB_POSITION_REQUIRED", "Vị trí công việc bắt buộc.");
        if (req.DepartmentId == Guid.Empty)
            throw new DomainException("EMPLOYEE_CONTRACT_DEPARTMENT_REQUIRED", "Phòng ban bắt buộc.");

        if (req.EffectiveEndDate < req.EffectiveStartDate)
            throw new DomainException("EMPLOYEE_CONTRACT_DATE_INVALID", "Ngày kết thúc không thể trước ngày bắt đầu.");

        if (req.BaseSalary is < 0 or > 10_000_000_000m)
            throw new DomainException("EMPLOYEE_CONTRACT_SALARY_INVALID", "Lương cơ bản không hợp lệ.");
        if (req.InsuranceSalary is < 0 or > 10_000_000_000m)
            throw new DomainException("EMPLOYEE_CONTRACT_SALARY_INVALID", "Lương đóng bảo hiểm không hợp lệ.");
        if (req.SalaryPercent is < 0 or > 200)
            throw new DomainException("EMPLOYEE_CONTRACT_SALARY_INVALID", "% hưởng lương không hợp lệ (0-200).");

        var ct1 = await db.LookupItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == req.ContractTypeId, ct);
        if (ct1 is null || ct1.CategoryCode != "ContractType")
            throw new DomainException("EMPLOYEE_CONTRACT_TYPE_REQUIRED", "Loại hợp đồng không hợp lệ.");

        if (req.WorkingTypeId is not null)
        {
            var w = await db.LookupItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == req.WorkingTypeId, ct);
            if (w is null || w.CategoryCode != "WorkingForm")
                throw new DomainException("EMPLOYEE_CONTRACT_WORKING_TYPE_INVALID", "Hình thức làm việc không hợp lệ.");
        }

        var jp = await db.LookupItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == req.JobPositionId, ct);
        if (jp is null || jp.CategoryCode != "JobPosition")
            throw new DomainException("EMPLOYEE_CONTRACT_JOB_POSITION_REQUIRED", "Vị trí công việc không hợp lệ.");

        if (!await db.OrganizationUnits.AnyAsync(x => x.Id == req.DepartmentId, ct))
            throw new DomainException("EMPLOYEE_CONTRACT_DEPARTMENT_REQUIRED", "Phòng ban không tồn tại.");

        if (req.SignerEmployeeId is not null)
        {
            if (!await db.Employees.AnyAsync(x => x.Id == req.SignerEmployeeId, ct))
                throw new DomainException("EMPLOYEE_CONTRACT_SIGNER_INVALID", "Không tìm thấy người ký.");
        }
    }

    private static async Task<List<LaborContractDto>> ToDtosAsync(
        HrmDbContext db, Employee employee, IReadOnlyList<LaborContract> rows, CancellationToken ct)
    {
        if (rows.Count == 0) return new();

        var lookupIds = new HashSet<Guid>();
        var ouIds = new HashSet<Guid>();
        var signerIds = new HashSet<Guid>();
        foreach (var r in rows)
        {
            lookupIds.Add(r.ContractTypeId);
            lookupIds.Add(r.JobPositionId);
            if (r.WorkingTypeId is not null) lookupIds.Add(r.WorkingTypeId.Value);
            ouIds.Add(r.DepartmentId);
            if (r.SignerEmployeeId is not null) signerIds.Add(r.SignerEmployeeId.Value);
        }

        var lookups = await db.LookupItems.AsNoTracking()
            .Where(x => lookupIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => new EmployeeRefDto(x.Id, x.Code, x.Name), ct);
        var orgs = await db.OrganizationUnits.AsNoTracking()
            .Where(x => ouIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => new EmployeeRefDto(x.Id, x.Code, x.Name), ct);
        var signers = signerIds.Count == 0 ? new Dictionary<Guid, EmployeeRefDto>() :
            await db.Employees.AsNoTracking()
                .Where(x => signerIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => new EmployeeRefDto(x.Id, x.Code, x.FullName), ct);

        var today = DateTime.UtcNow.Date;

        return rows.Select(r =>
        {
            string statusLabel;
            if (r.EffectiveEndDate.Date < today) statusLabel = "Hết hiệu lực";
            else if (r.EffectiveStartDate.Date > today) statusLabel = "Sắp hiệu lực";
            else statusLabel = "Đang hiệu lực";

            return new LaborContractDto(
                r.Id, r.EmployeeId,
                employee.Code, employee.FullName,
                r.ContractNumber,
                r.ContractTypeId, lookups.GetValueOrDefault(r.ContractTypeId),
                r.ContractDurationText,
                r.WorkingTypeId, r.WorkingTypeId is null ? null : lookups.GetValueOrDefault(r.WorkingTypeId.Value),
                r.JobPositionId, lookups.GetValueOrDefault(r.JobPositionId),
                r.DepartmentId, orgs.GetValueOrDefault(r.DepartmentId),
                r.BaseSalary, r.InsuranceSalary, r.SalaryPercent,
                r.EffectiveStartDate, r.EffectiveEndDate, statusLabel,
                r.SignerEmployeeId, r.SignerEmployeeId is null ? null : signers.GetValueOrDefault(r.SignerEmployeeId.Value),
                r.SignerJobTitleText, r.SignedDate,
                r.Note, r.CreatedAt, r.UpdatedAt);
        }).ToList();
    }
}

public sealed record LaborContractDto(
    Guid Id, Guid EmployeeId,
    string EmployeeCode, string EmployeeFullName,
    string ContractNumber,
    Guid ContractTypeId, EmployeeRefDto? ContractType,
    string? ContractDurationText,
    Guid? WorkingTypeId, EmployeeRefDto? WorkingType,
    Guid JobPositionId, EmployeeRefDto? JobPosition,
    Guid DepartmentId, EmployeeRefDto? Department,
    decimal? BaseSalary, decimal? InsuranceSalary, decimal? SalaryPercent,
    DateTime EffectiveStartDate, DateTime EffectiveEndDate, string ContractStatusLabel,
    Guid? SignerEmployeeId, EmployeeRefDto? Signer,
    string? SignerJobTitleText, DateTime? SignedDate,
    string? Note, DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record LaborContractInput(
    string ContractNumber,
    Guid ContractTypeId,
    string? ContractDurationText,
    Guid? WorkingTypeId,
    Guid JobPositionId,
    Guid DepartmentId,
    decimal? BaseSalary,
    decimal? InsuranceSalary,
    decimal? SalaryPercent,
    DateTime EffectiveStartDate,
    DateTime EffectiveEndDate,
    Guid? SignerEmployeeId,
    string? SignerJobTitleText,
    DateTime? SignedDate,
    string? Note);
