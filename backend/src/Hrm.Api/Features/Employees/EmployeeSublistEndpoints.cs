using System.Text.RegularExpressions;
using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Persistence;
using Hrm.Api.Features.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Employees;

/// <summary>
/// Endpoints cho 4 sublist Tab 06/07/08/09 — Bằng cấp, Chứng chỉ, Kinh nghiệm làm việc, Quá trình công tác.
/// Gom 1 file để tránh phình thư mục Features (không có bussiness logic chia sẻ giữa 4 nhóm).
/// </summary>
public static class EmployeeSublistEndpoints
{
    private static readonly Regex EmailRegex = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);
    private static readonly Regex MonthYearRegex = new(@"^\d{4}-(0[1-9]|1[0-2])$", RegexOptions.Compiled);

    public static IEndpointRouteBuilder MapEmployeeSublistEndpoints(this IEndpointRouteBuilder routes)
    {
        // ------- Tab 06: Degrees -------
        var dg = routes.MapGroup("/api/employees/{employeeId:guid}/degrees").RequireAuthorization();
        dg.MapGet("/", ListDegrees).RequirePermission(AuthPermissions.EmpView);
        dg.MapPost("/", CreateDegree).RequirePermission(AuthPermissions.EmpEdit);
        dg.MapPut("/{degreeId:guid}", UpdateDegree).RequirePermission(AuthPermissions.EmpEdit);
        dg.MapDelete("/{degreeId:guid}", DeleteDegree).RequirePermission(AuthPermissions.EmpEdit);

        // ------- Tab 07: Certificates -------
        var ct = routes.MapGroup("/api/employees/{employeeId:guid}/certificates").RequireAuthorization();
        ct.MapGet("/", ListCertificates).RequirePermission(AuthPermissions.EmpView);
        ct.MapPost("/", CreateCertificate).RequirePermission(AuthPermissions.EmpEdit);
        ct.MapPut("/{certificateId:guid}", UpdateCertificate).RequirePermission(AuthPermissions.EmpEdit);
        ct.MapDelete("/{certificateId:guid}", DeleteCertificate).RequirePermission(AuthPermissions.EmpEdit);

        // ------- Tab 08: Work Experiences -------
        var we = routes.MapGroup("/api/employees/{employeeId:guid}/work-experiences").RequireAuthorization();
        we.MapGet("/", ListExperiences).RequirePermission(AuthPermissions.EmpView);
        we.MapPost("/", CreateExperience).RequirePermission(AuthPermissions.EmpEdit);
        we.MapPut("/{experienceId:guid}", UpdateExperience).RequirePermission(AuthPermissions.EmpEdit);
        we.MapDelete("/{experienceId:guid}", DeleteExperience).RequirePermission(AuthPermissions.EmpEdit);

        // ------- Tab 09: Work Histories -------
        var wh = routes.MapGroup("/api/employees/{employeeId:guid}/work-histories").RequireAuthorization();
        wh.MapGet("/", ListHistories).RequirePermission(AuthPermissions.EmpView);
        wh.MapPost("/", CreateHistory).RequirePermission(AuthPermissions.EmpEdit);
        wh.MapPut("/{historyId:guid}", UpdateHistory).RequirePermission(AuthPermissions.EmpEdit);
        wh.MapDelete("/{historyId:guid}", DeleteHistory).RequirePermission(AuthPermissions.EmpEdit);

        return routes;
    }

    // =================================================================
    // TAB 06 — Degrees
    // =================================================================
    private static async Task<IResult> ListDegrees(Guid employeeId, HrmDbContext db, CancellationToken ct)
    {
        await EnsureEmployeeAsync(db, employeeId, ct);
        var rows = await db.Set<EmployeeDegree>().AsNoTracking()
            .Where(x => x.EmployeeId == employeeId)
            .OrderByDescending(x => x.GraduationYear ?? x.ToYear ?? x.FromYear ?? 0)
            .ToListAsync(ct);
        return Results.Ok(await ToDegreeDtosAsync(db, rows, ct));
    }
    private static async Task<IResult> CreateDegree(Guid employeeId, [FromBody] DegreeInput req, HrmDbContext db, CancellationToken ct)
    {
        await EnsureEmployeeAsync(db, employeeId, ct);
        await ValidateDegreeAsync(db, req, ct);
        var e = MapDegree(new EmployeeDegree { EmployeeId = employeeId }, req);
        db.Add(e); await db.SaveChangesAsync(ct);
        var dto = (await ToDegreeDtosAsync(db, new[] { e }, ct)).Single();
        return Results.Created($"/api/employees/{employeeId}/degrees/{e.Id}", dto);
    }
    private static async Task<IResult> UpdateDegree(Guid employeeId, Guid degreeId, [FromBody] DegreeInput req, HrmDbContext db, CancellationToken ct)
    {
        var e = await db.Set<EmployeeDegree>().FirstOrDefaultAsync(x => x.Id == degreeId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_DEGREE_NOT_FOUND", "Không tìm thấy bằng cấp.");
        await ValidateDegreeAsync(db, req, ct);
        MapDegree(e, req);
        await db.SaveChangesAsync(ct);
        return Results.Ok((await ToDegreeDtosAsync(db, new[] { e }, ct)).Single());
    }
    private static async Task<IResult> DeleteDegree(Guid employeeId, Guid degreeId, HrmDbContext db, CancellationToken ct)
    {
        var e = await db.Set<EmployeeDegree>().FirstOrDefaultAsync(x => x.Id == degreeId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_DEGREE_NOT_FOUND", "Không tìm thấy bằng cấp.");
        db.Remove(e); await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }
    private static EmployeeDegree MapDegree(EmployeeDegree e, DegreeInput r)
    {
        e.EducationPlaceId = r.EducationPlaceId;
        e.FromYear = r.FromYear; e.ToYear = r.ToYear;
        e.EducationFacultyId = r.EducationFacultyId; e.EducationMajorId = r.EducationMajorId;
        e.EducationLevelId = r.EducationLevelId; e.EducationMethodId = r.EducationMethodId;
        e.DegreeClassificationId = r.DegreeClassificationId; e.GraduationYear = r.GraduationYear;
        e.Note = r.Note?.Trim();
        return e;
    }
    private static async Task ValidateDegreeAsync(HrmDbContext db, DegreeInput r, CancellationToken ct)
    {
        if (r.EducationPlaceId == Guid.Empty)
            throw new DomainException("EMPLOYEE_DEGREE_PLACE_REQUIRED", "Nơi đào tạo bắt buộc.");
        ValidateYear(r.FromYear); ValidateYear(r.ToYear); ValidateYear(r.GraduationYear);
        if (r.FromYear is not null && r.ToYear is not null && r.ToYear < r.FromYear)
            throw new DomainException("EMPLOYEE_DEGREE_YEAR_RANGE_INVALID", "Đến năm phải >= Từ năm.");
        if (r.FromYear is not null && r.GraduationYear is not null && r.GraduationYear < r.FromYear)
            throw new DomainException("EMPLOYEE_DEGREE_YEAR_RANGE_INVALID", "Năm tốt nghiệp phải >= Từ năm.");

        await EnsureLookupAsync(db, r.EducationPlaceId, "TrainingPlace", "EMPLOYEE_DEGREE_PLACE_REQUIRED", ct);
        await EnsureLookupOrNullAsync(db, r.EducationFacultyId, "TrainingFaculty", "EMPLOYEE_DEGREE_FACULTY_INVALID", ct);
        await EnsureLookupOrNullAsync(db, r.EducationMajorId, "TrainingMajor", "EMPLOYEE_DEGREE_MAJOR_INVALID", ct);
        await EnsureLookupOrNullAsync(db, r.EducationLevelId, "EducationLevel", "EMPLOYEE_DEGREE_LOOKUP_INVALID", ct);
        await EnsureLookupOrNullAsync(db, r.EducationMethodId, "TrainingMode", "EMPLOYEE_DEGREE_LOOKUP_INVALID", ct);
        await EnsureLookupOrNullAsync(db, r.DegreeClassificationId, "DegreeRank", "EMPLOYEE_DEGREE_LOOKUP_INVALID", ct);
    }
    private static async Task<List<DegreeDto>> ToDegreeDtosAsync(HrmDbContext db, IReadOnlyList<EmployeeDegree> rows, CancellationToken ct)
    {
        if (rows.Count == 0) return new();
        var ids = new HashSet<Guid>();
        foreach (var r in rows)
        {
            ids.Add(r.EducationPlaceId);
            void Add(Guid? id) { if (id is not null) ids.Add(id.Value); }
            Add(r.EducationFacultyId); Add(r.EducationMajorId); Add(r.EducationLevelId);
            Add(r.EducationMethodId); Add(r.DegreeClassificationId);
        }
        var dict = await LoadLookupRefsAsync(db, ids, ct);
        EmployeeRefDto? Ref(Guid? id) => id is null ? null : dict.GetValueOrDefault(id.Value);
        return rows.Select(r => new DegreeDto(
            r.Id, r.EmployeeId,
            r.EducationPlaceId, Ref(r.EducationPlaceId),
            r.FromYear, r.ToYear,
            r.EducationFacultyId, Ref(r.EducationFacultyId),
            r.EducationMajorId, Ref(r.EducationMajorId),
            r.EducationLevelId, Ref(r.EducationLevelId),
            r.EducationMethodId, Ref(r.EducationMethodId),
            r.DegreeClassificationId, Ref(r.DegreeClassificationId),
            r.GraduationYear, r.Note, r.CreatedAt, r.UpdatedAt)).ToList();
    }

    // =================================================================
    // TAB 07 — Certificates
    // =================================================================
    private static async Task<IResult> ListCertificates(Guid employeeId, HrmDbContext db, CancellationToken ct)
    {
        await EnsureEmployeeAsync(db, employeeId, ct);
        var rows = await db.Set<EmployeeCertificate>().AsNoTracking()
            .Where(x => x.EmployeeId == employeeId)
            .OrderByDescending(x => x.IssuedDate ?? DateTime.MinValue)
            .ToListAsync(ct);
        return Results.Ok(await ToCertificateDtosAsync(db, rows, ct));
    }
    private static async Task<IResult> CreateCertificate(Guid employeeId, [FromBody] CertificateInput req, HrmDbContext db, CancellationToken ct)
    {
        await EnsureEmployeeAsync(db, employeeId, ct);
        await ValidateCertificateAsync(db, req, ct);
        var e = MapCertificate(new EmployeeCertificate { EmployeeId = employeeId }, req);
        db.Add(e); await db.SaveChangesAsync(ct);
        return Results.Created($"/api/employees/{employeeId}/certificates/{e.Id}",
            (await ToCertificateDtosAsync(db, new[] { e }, ct)).Single());
    }
    private static async Task<IResult> UpdateCertificate(Guid employeeId, Guid certificateId, [FromBody] CertificateInput req, HrmDbContext db, CancellationToken ct)
    {
        var e = await db.Set<EmployeeCertificate>().FirstOrDefaultAsync(x => x.Id == certificateId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_CERTIFICATE_NOT_FOUND", "Không tìm thấy chứng chỉ.");
        await ValidateCertificateAsync(db, req, ct);
        MapCertificate(e, req);
        await db.SaveChangesAsync(ct);
        return Results.Ok((await ToCertificateDtosAsync(db, new[] { e }, ct)).Single());
    }
    private static async Task<IResult> DeleteCertificate(Guid employeeId, Guid certificateId, HrmDbContext db, CancellationToken ct)
    {
        var e = await db.Set<EmployeeCertificate>().FirstOrDefaultAsync(x => x.Id == certificateId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_CERTIFICATE_NOT_FOUND", "Không tìm thấy chứng chỉ.");
        db.Remove(e); await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }
    private static EmployeeCertificate MapCertificate(EmployeeCertificate e, CertificateInput r)
    {
        e.CertificateTypeId = r.CertificateTypeId;
        e.CertificateName = r.CertificateName.Trim();
        e.CertificateNumber = r.CertificateNumber?.Trim();
        e.EducationLevelId = r.EducationLevelId;
        e.IssuedDate = r.IssuedDate; e.ExpiryDate = r.ExpiryDate;
        e.IssuedPlace = r.IssuedPlace?.Trim();
        e.CertificateClassificationId = r.CertificateClassificationId;
        e.Note = r.Note?.Trim();
        return e;
    }
    private static async Task ValidateCertificateAsync(HrmDbContext db, CertificateInput r, CancellationToken ct)
    {
        if (r.CertificateTypeId == Guid.Empty)
            throw new DomainException("EMPLOYEE_CERTIFICATE_TYPE_REQUIRED", "Nhóm chứng chỉ bắt buộc.");
        if (string.IsNullOrWhiteSpace(r.CertificateName) || r.CertificateName.Length > 255)
            throw new DomainException("EMPLOYEE_CERTIFICATE_NAME_REQUIRED", "Tên chứng chỉ bắt buộc, tối đa 255 ký tự.");
        if (r.IssuedDate is not null && r.ExpiryDate is not null && r.ExpiryDate < r.IssuedDate)
            throw new DomainException("EMPLOYEE_CERTIFICATE_DATE_INVALID", "Ngày hết hạn phải >= ngày cấp.");

        await EnsureLookupAsync(db, r.CertificateTypeId, "CertificateType", "EMPLOYEE_CERTIFICATE_TYPE_REQUIRED", ct);
        await EnsureLookupOrNullAsync(db, r.EducationLevelId, "EducationLevel", "EMPLOYEE_CERTIFICATE_LOOKUP_INVALID", ct);
        await EnsureLookupOrNullAsync(db, r.CertificateClassificationId, "CertificateRank", "EMPLOYEE_CERTIFICATE_LOOKUP_INVALID", ct);
    }
    private static async Task<List<CertificateDto>> ToCertificateDtosAsync(HrmDbContext db, IReadOnlyList<EmployeeCertificate> rows, CancellationToken ct)
    {
        if (rows.Count == 0) return new();
        var ids = new HashSet<Guid>();
        foreach (var r in rows)
        {
            ids.Add(r.CertificateTypeId);
            void Add(Guid? id) { if (id is not null) ids.Add(id.Value); }
            Add(r.EducationLevelId); Add(r.CertificateClassificationId);
        }
        var dict = await LoadLookupRefsAsync(db, ids, ct);
        EmployeeRefDto? Ref(Guid? id) => id is null ? null : dict.GetValueOrDefault(id.Value);

        var today = DateTime.UtcNow.Date;
        return rows.Select(r =>
        {
            string? statusLabel = null;
            if (r.ExpiryDate is not null) statusLabel = r.ExpiryDate.Value.Date < today ? "Hết hạn" : "Còn hiệu lực";
            return new CertificateDto(
                r.Id, r.EmployeeId,
                r.CertificateTypeId, Ref(r.CertificateTypeId),
                r.CertificateName, r.CertificateNumber,
                r.EducationLevelId, Ref(r.EducationLevelId),
                r.IssuedDate, r.ExpiryDate, r.IssuedPlace,
                r.CertificateClassificationId, Ref(r.CertificateClassificationId),
                statusLabel, r.Note, r.CreatedAt, r.UpdatedAt);
        }).ToList();
    }

    // =================================================================
    // TAB 08 — Work Experiences
    // =================================================================
    private static async Task<IResult> ListExperiences(Guid employeeId, HrmDbContext db, CancellationToken ct)
    {
        await EnsureEmployeeAsync(db, employeeId, ct);
        var rows = await db.Set<EmployeeWorkExperience>().AsNoTracking()
            .Where(x => x.EmployeeId == employeeId)
            .OrderByDescending(x => x.FromMonthYear)
            .ToListAsync(ct);
        return Results.Ok(rows.Select(ToExperienceDto).ToList());
    }
    private static async Task<IResult> CreateExperience(Guid employeeId, [FromBody] WorkExperienceInput req, HrmDbContext db, CancellationToken ct)
    {
        await EnsureEmployeeAsync(db, employeeId, ct);
        ValidateExperience(req);
        var e = MapExperience(new EmployeeWorkExperience { EmployeeId = employeeId }, req);
        db.Add(e); await db.SaveChangesAsync(ct);
        return Results.Created($"/api/employees/{employeeId}/work-experiences/{e.Id}", ToExperienceDto(e));
    }
    private static async Task<IResult> UpdateExperience(Guid employeeId, Guid experienceId, [FromBody] WorkExperienceInput req, HrmDbContext db, CancellationToken ct)
    {
        var e = await db.Set<EmployeeWorkExperience>().FirstOrDefaultAsync(x => x.Id == experienceId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_WORK_EXPERIENCE_NOT_FOUND", "Không tìm thấy kinh nghiệm.");
        ValidateExperience(req);
        MapExperience(e, req);
        await db.SaveChangesAsync(ct);
        return Results.Ok(ToExperienceDto(e));
    }
    private static async Task<IResult> DeleteExperience(Guid employeeId, Guid experienceId, HrmDbContext db, CancellationToken ct)
    {
        var e = await db.Set<EmployeeWorkExperience>().FirstOrDefaultAsync(x => x.Id == experienceId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_WORK_EXPERIENCE_NOT_FOUND", "Không tìm thấy kinh nghiệm.");
        db.Remove(e); await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }
    private static EmployeeWorkExperience MapExperience(EmployeeWorkExperience e, WorkExperienceInput r)
    {
        e.FromMonthYear = r.FromMonthYear; e.ToMonthYear = r.ToMonthYear;
        e.WorkplaceName = r.WorkplaceName.Trim(); e.JobTitleText = r.JobTitleText.Trim();
        e.SalaryAmount = r.SalaryAmount;
        e.JobDescription = r.JobDescription?.Trim(); e.Note = r.Note?.Trim();
        e.ReferenceName = r.ReferenceName?.Trim(); e.ReferenceJobTitle = r.ReferenceJobTitle?.Trim();
        e.ReferencePhone = r.ReferencePhone?.Trim(); e.ReferenceEmail = r.ReferenceEmail?.Trim();
        return e;
    }
    private static void ValidateExperience(WorkExperienceInput r)
    {
        if (string.IsNullOrWhiteSpace(r.FromMonthYear) || !MonthYearRegex.IsMatch(r.FromMonthYear))
            throw new DomainException("EMPLOYEE_WORK_EXPERIENCE_FROM_REQUIRED", "Từ tháng/năm bắt buộc, dạng yyyy-MM.");
        if (string.IsNullOrWhiteSpace(r.ToMonthYear) || !MonthYearRegex.IsMatch(r.ToMonthYear))
            throw new DomainException("EMPLOYEE_WORK_EXPERIENCE_TO_REQUIRED", "Đến tháng/năm bắt buộc, dạng yyyy-MM.");
        if (string.Compare(r.ToMonthYear, r.FromMonthYear, StringComparison.Ordinal) < 0)
            throw new DomainException("EMPLOYEE_WORK_EXPERIENCE_PERIOD_INVALID", "Đến tháng/năm phải >= Từ tháng/năm.");
        if (string.IsNullOrWhiteSpace(r.WorkplaceName) || r.WorkplaceName.Length > 255)
            throw new DomainException("EMPLOYEE_WORK_EXPERIENCE_WORKPLACE_REQUIRED", "Nơi làm việc bắt buộc.");
        if (string.IsNullOrWhiteSpace(r.JobTitleText) || r.JobTitleText.Length > 255)
            throw new DomainException("EMPLOYEE_WORK_EXPERIENCE_POSITION_REQUIRED", "Vị trí công việc bắt buộc.");
        if (!string.IsNullOrWhiteSpace(r.ReferenceEmail) && !EmailRegex.IsMatch(r.ReferenceEmail))
            throw new DomainException("EMPLOYEE_WORK_EXPERIENCE_REFERENCE_EMAIL_INVALID", "Email tham chiếu không hợp lệ.");
        if (r.SalaryAmount is < 0 or > 10_000_000_000m)
            throw new DomainException("EMPLOYEE_WORK_EXPERIENCE_SALARY_INVALID", "Mức lương không hợp lệ.");
    }
    private static WorkExperienceDto ToExperienceDto(EmployeeWorkExperience r) => new(
        r.Id, r.EmployeeId,
        r.FromMonthYear, r.ToMonthYear,
        r.WorkplaceName, r.JobTitleText,
        r.SalaryAmount, r.JobDescription, r.Note,
        r.ReferenceName, r.ReferenceJobTitle, r.ReferencePhone, r.ReferenceEmail,
        r.CreatedAt, r.UpdatedAt);

    // =================================================================
    // TAB 09 — Work Histories
    // =================================================================
    private static async Task<IResult> ListHistories(Guid employeeId, HrmDbContext db, CancellationToken ct)
    {
        await EnsureEmployeeAsync(db, employeeId, ct);
        var rows = await db.Set<EmployeeWorkHistory>().AsNoTracking()
            .Where(x => x.EmployeeId == employeeId)
            .OrderByDescending(x => x.FromDate)
            .ToListAsync(ct);
        return Results.Ok(await ToHistoryDtosAsync(db, rows, ct));
    }
    private static async Task<IResult> CreateHistory(Guid employeeId, [FromBody] WorkHistoryInput req, HrmDbContext db, CancellationToken ct)
    {
        await EnsureEmployeeAsync(db, employeeId, ct);
        await ValidateHistoryAsync(db, req, employeeId, ct);
        var e = MapHistory(new EmployeeWorkHistory { EmployeeId = employeeId }, req);
        db.Add(e); await db.SaveChangesAsync(ct);
        return Results.Created($"/api/employees/{employeeId}/work-histories/{e.Id}",
            (await ToHistoryDtosAsync(db, new[] { e }, ct)).Single());
    }
    private static async Task<IResult> UpdateHistory(Guid employeeId, Guid historyId, [FromBody] WorkHistoryInput req, HrmDbContext db, CancellationToken ct)
    {
        var e = await db.Set<EmployeeWorkHistory>().FirstOrDefaultAsync(x => x.Id == historyId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_WORK_HISTORY_NOT_FOUND", "Không tìm thấy quá trình công tác.");
        await ValidateHistoryAsync(db, req, employeeId, ct);
        MapHistory(e, req);
        await db.SaveChangesAsync(ct);
        return Results.Ok((await ToHistoryDtosAsync(db, new[] { e }, ct)).Single());
    }
    private static async Task<IResult> DeleteHistory(Guid employeeId, Guid historyId, HrmDbContext db, CancellationToken ct)
    {
        var e = await db.Set<EmployeeWorkHistory>().FirstOrDefaultAsync(x => x.Id == historyId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_WORK_HISTORY_NOT_FOUND", "Không tìm thấy quá trình công tác.");
        db.Remove(e); await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }
    private static EmployeeWorkHistory MapHistory(EmployeeWorkHistory e, WorkHistoryInput r)
    {
        e.FromDate = r.FromDate;
        e.IsCurrent = r.IsCurrent;
        e.ToDate = r.IsCurrent ? null : r.ToDate;
        e.JobPositionId = r.JobPositionId; e.JobTitleId = r.JobTitleId;
        e.OrganizationUnitId = r.OrganizationUnitId; e.DepartmentId = r.DepartmentId;
        e.DirectManagerEmployeeId = r.DirectManagerEmployeeId;
        e.DecisionNumber = r.DecisionNumber?.Trim(); e.DecisionDate = r.DecisionDate;
        e.Note = r.Note?.Trim();
        return e;
    }
    private static async Task ValidateHistoryAsync(HrmDbContext db, WorkHistoryInput r, Guid currentEmployeeId, CancellationToken ct)
    {
        if (r.JobPositionId == Guid.Empty)
            throw new DomainException("EMPLOYEE_WORK_HISTORY_POSITION_REQUIRED", "Vị trí công việc bắt buộc.");
        if (r.OrganizationUnitId == Guid.Empty)
            throw new DomainException("EMPLOYEE_WORK_HISTORY_ORG_UNIT_REQUIRED", "Đơn vị công tác bắt buộc.");
        if (r.DepartmentId == Guid.Empty)
            throw new DomainException("EMPLOYEE_WORK_HISTORY_DEPARTMENT_REQUIRED", "Phòng ban bắt buộc.");
        if (!r.IsCurrent && r.ToDate is not null && r.ToDate < r.FromDate)
            throw new DomainException("EMPLOYEE_WORK_HISTORY_DATE_INVALID", "Đến ngày phải >= Từ ngày.");
        if (r.DirectManagerEmployeeId == currentEmployeeId)
            throw new DomainException("EMPLOYEE_WORK_HISTORY_MANAGER_INVALID", "Quản lý trực tiếp không thể là chính nhân viên.");

        await EnsureLookupAsync(db, r.JobPositionId, "JobPosition", "EMPLOYEE_WORK_HISTORY_POSITION_REQUIRED", ct);
        await EnsureLookupOrNullAsync(db, r.JobTitleId, "JobTitle", "EMPLOYEE_WORK_HISTORY_LOOKUP_INVALID", ct);
        if (!await db.OrganizationUnits.AnyAsync(x => x.Id == r.OrganizationUnitId, ct))
            throw new DomainException("EMPLOYEE_WORK_HISTORY_ORG_UNIT_REQUIRED", "Đơn vị không tồn tại.");
        if (!await db.OrganizationUnits.AnyAsync(x => x.Id == r.DepartmentId, ct))
            throw new DomainException("EMPLOYEE_WORK_HISTORY_DEPARTMENT_REQUIRED", "Phòng ban không tồn tại.");
        if (r.DirectManagerEmployeeId is not null
            && !await db.Employees.AnyAsync(x => x.Id == r.DirectManagerEmployeeId, ct))
            throw new DomainException("EMPLOYEE_WORK_HISTORY_MANAGER_INVALID", "Không tìm thấy quản lý.");
    }
    private static async Task<List<WorkHistoryDto>> ToHistoryDtosAsync(HrmDbContext db, IReadOnlyList<EmployeeWorkHistory> rows, CancellationToken ct)
    {
        if (rows.Count == 0) return new();

        var lkIds = new HashSet<Guid>();
        var ouIds = new HashSet<Guid>();
        var empIds = new HashSet<Guid>();
        foreach (var r in rows)
        {
            lkIds.Add(r.JobPositionId);
            if (r.JobTitleId is not null) lkIds.Add(r.JobTitleId.Value);
            ouIds.Add(r.OrganizationUnitId); ouIds.Add(r.DepartmentId);
            if (r.DirectManagerEmployeeId is not null) empIds.Add(r.DirectManagerEmployeeId.Value);
        }
        var lookups = await LoadLookupRefsAsync(db, lkIds, ct);
        var orgs = await db.OrganizationUnits.AsNoTracking()
            .Where(x => ouIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => new EmployeeRefDto(x.Id, x.Code, x.Name), ct);
        var emps = empIds.Count == 0 ? new Dictionary<Guid, EmployeeRefDto>() :
            await db.Employees.AsNoTracking()
                .Where(x => empIds.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => new EmployeeRefDto(x.Id, x.Code, x.FullName), ct);

        var today = DateTime.UtcNow.Date;
        return rows.Select(r =>
        {
            string statusLabel;
            if (r.IsCurrent) statusLabel = "Đang công tác";
            else if (r.ToDate is not null && r.ToDate.Value.Date < today) statusLabel = "Đã kết thúc";
            else statusLabel = "Đang công tác";

            return new WorkHistoryDto(
                r.Id, r.EmployeeId,
                r.FromDate, r.ToDate, r.IsCurrent,
                r.JobPositionId, lookups.GetValueOrDefault(r.JobPositionId),
                r.JobTitleId, r.JobTitleId is null ? null : lookups.GetValueOrDefault(r.JobTitleId.Value),
                r.OrganizationUnitId, orgs.GetValueOrDefault(r.OrganizationUnitId),
                r.DepartmentId, orgs.GetValueOrDefault(r.DepartmentId),
                r.DirectManagerEmployeeId, r.DirectManagerEmployeeId is null ? null : emps.GetValueOrDefault(r.DirectManagerEmployeeId.Value),
                r.DecisionNumber, r.DecisionDate, statusLabel,
                r.Note, r.CreatedAt, r.UpdatedAt);
        }).ToList();
    }

    // ----------------------------------------------------------------- helpers
    private static async Task EnsureEmployeeAsync(HrmDbContext db, Guid id, CancellationToken ct)
    {
        if (!await db.Employees.AsNoTracking().AnyAsync(x => x.Id == id, ct))
            throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");
    }
    private static async Task EnsureLookupAsync(HrmDbContext db, Guid id, string category, string errorCode, CancellationToken ct)
    {
        var item = await db.LookupItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (item is null || item.CategoryCode != category)
            throw new DomainException(errorCode, $"Bản ghi tham chiếu phải thuộc danh mục '{category}'.");
    }
    private static async Task EnsureLookupOrNullAsync(HrmDbContext db, Guid? id, string category, string errorCode, CancellationToken ct)
    {
        if (id is null) return;
        await EnsureLookupAsync(db, id.Value, category, errorCode, ct);
    }
    private static void ValidateYear(int? year)
    {
        if (year is null) return;
        if (year < 1900 || year > 2100)
            throw new DomainException("EMPLOYEE_DEGREE_YEAR_INVALID", "Năm không hợp lệ (1900-2100).");
    }
    private static async Task<Dictionary<Guid, EmployeeRefDto>> LoadLookupRefsAsync(HrmDbContext db, ICollection<Guid> ids, CancellationToken ct)
    {
        if (ids.Count == 0) return new();
        return await db.LookupItems.AsNoTracking()
            .Where(x => ids.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => new EmployeeRefDto(x.Id, x.Code, x.Name), ct);
    }
}

// ===== DTOs =====
public sealed record DegreeDto(
    Guid Id, Guid EmployeeId,
    Guid EducationPlaceId, EmployeeRefDto? EducationPlace,
    int? FromYear, int? ToYear,
    Guid? EducationFacultyId, EmployeeRefDto? EducationFaculty,
    Guid? EducationMajorId, EmployeeRefDto? EducationMajor,
    Guid? EducationLevelId, EmployeeRefDto? EducationLevel,
    Guid? EducationMethodId, EmployeeRefDto? EducationMethod,
    Guid? DegreeClassificationId, EmployeeRefDto? DegreeClassification,
    int? GraduationYear, string? Note, DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record DegreeInput(
    Guid EducationPlaceId, int? FromYear, int? ToYear,
    Guid? EducationFacultyId, Guid? EducationMajorId,
    Guid? EducationLevelId, Guid? EducationMethodId,
    Guid? DegreeClassificationId, int? GraduationYear, string? Note);

public sealed record CertificateDto(
    Guid Id, Guid EmployeeId,
    Guid CertificateTypeId, EmployeeRefDto? CertificateType,
    string CertificateName, string? CertificateNumber,
    Guid? EducationLevelId, EmployeeRefDto? EducationLevel,
    DateTime? IssuedDate, DateTime? ExpiryDate, string? IssuedPlace,
    Guid? CertificateClassificationId, EmployeeRefDto? CertificateClassification,
    string? StatusLabel, string? Note, DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record CertificateInput(
    Guid CertificateTypeId, string CertificateName, string? CertificateNumber,
    Guid? EducationLevelId, DateTime? IssuedDate, DateTime? ExpiryDate, string? IssuedPlace,
    Guid? CertificateClassificationId, string? Note);

public sealed record WorkExperienceDto(
    Guid Id, Guid EmployeeId,
    string FromMonthYear, string ToMonthYear,
    string WorkplaceName, string JobTitleText,
    decimal? SalaryAmount, string? JobDescription, string? Note,
    string? ReferenceName, string? ReferenceJobTitle, string? ReferencePhone, string? ReferenceEmail,
    DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record WorkExperienceInput(
    string FromMonthYear, string ToMonthYear,
    string WorkplaceName, string JobTitleText,
    decimal? SalaryAmount, string? JobDescription, string? Note,
    string? ReferenceName, string? ReferenceJobTitle, string? ReferencePhone, string? ReferenceEmail);

public sealed record WorkHistoryDto(
    Guid Id, Guid EmployeeId,
    DateTime FromDate, DateTime? ToDate, bool IsCurrent,
    Guid JobPositionId, EmployeeRefDto? JobPosition,
    Guid? JobTitleId, EmployeeRefDto? JobTitle,
    Guid OrganizationUnitId, EmployeeRefDto? OrganizationUnit,
    Guid DepartmentId, EmployeeRefDto? Department,
    Guid? DirectManagerEmployeeId, EmployeeRefDto? DirectManager,
    string? DecisionNumber, DateTime? DecisionDate, string StatusLabel,
    string? Note, DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record WorkHistoryInput(
    DateTime FromDate, DateTime? ToDate, bool IsCurrent,
    Guid JobPositionId, Guid? JobTitleId,
    Guid OrganizationUnitId, Guid DepartmentId,
    Guid? DirectManagerEmployeeId,
    string? DecisionNumber, DateTime? DecisionDate, string? Note);
