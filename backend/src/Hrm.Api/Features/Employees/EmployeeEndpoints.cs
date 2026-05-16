using System.Text.RegularExpressions;
using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Pagination;
using Hrm.Api.Common.Persistence;
using Hrm.Api.Features.Authorization;
using Hrm.Api.Features.Lookups;
using Hrm.Api.Features.Organization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Employees;

/// <summary>
/// Endpoint Phase 4 — employee-list + employee-detail-shell + Tab 01 General.
/// </summary>
public static class EmployeeEndpoints
{
    private static readonly Regex EmailRegex = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);
    private static readonly string[] AllowedGenders = new[] { "male", "female", "other" };

    public static IEndpointRouteBuilder MapEmployeeEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/employees").RequireAuthorization();

        group.MapGet("/", List).RequirePermission(AuthPermissions.EmpView);
        group.MapPost("/", Create).RequirePermission(AuthPermissions.EmpCreate);
        group.MapDelete("/{id:guid}", Delete).RequirePermission(AuthPermissions.EmpDelete);
        group.MapGet("/{id:guid}/summary", GetSummary).RequirePermission(AuthPermissions.EmpView);
        group.MapGet("/{id:guid}/tabs", GetTabs).RequirePermission(AuthPermissions.EmpView);
        group.MapGet("/{id:guid}/general-info", GetGeneral).RequirePermission(AuthPermissions.EmpView);
        group.MapPut("/{id:guid}/general-info", UpdateGeneral).RequirePermission(AuthPermissions.EmpEdit);
        return routes;
    }

    private static async Task<IResult> List(
        [AsParameters] PagedRequest q,
        [FromQuery] Guid? organizationUnitId,
        [FromQuery] Guid? departmentId,
        [FromQuery] Guid? jobPositionId,
        [FromQuery] Guid? workingStatusId,
        HrmDbContext db,
        CancellationToken ct)
    {
        var query = db.Employees.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q.Keyword))
        {
            var k = q.Keyword.Trim();
            query = query.Where(x => x.Code.Contains(k) || x.FullName.Contains(k));
        }
        if (q.IsActive is not null) query = query.Where(x => x.IsActive == q.IsActive);
        if (organizationUnitId is not null) query = query.Where(x => x.OrganizationUnitId == organizationUnitId);
        if (departmentId is not null) query = query.Where(x => x.DepartmentId == departmentId);
        if (jobPositionId is not null) query = query.Where(x => x.JobPositionId == jobPositionId);
        if (workingStatusId is not null) query = query.Where(x => x.WorkingStatusId == workingStatusId);

        query = (q.SortBy?.ToLowerInvariant(), q.SortDirection?.ToLowerInvariant()) switch
        {
            ("fullname", "desc") => query.OrderByDescending(x => x.FullName),
            ("fullname", _)      => query.OrderBy(x => x.FullName),
            ("code", "desc")     => query.OrderByDescending(x => x.Code),
            _                     => query.OrderBy(x => x.Code)
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(q.Skip).Take(q.Take).ToListAsync(ct);
        var items = await ToListItemsAsync(db, rows, ct);
        return Results.Ok(new PagedResult<EmployeeListItemDto>(items, q.EffectivePage, q.Take, total));
    }

    private static async Task<IResult> Create(
        [FromBody] CreateEmployeeRequest req,
        HrmDbContext db,
        CancellationToken ct)
    {
        ValidateCode(req.Code);
        ValidateFullName(req.FullName);
        ValidateGender(req.Gender, required: true);

        if (await db.Employees.AnyAsync(x => x.Code == req.Code.Trim(), ct))
            throw new DomainException("EMPLOYEE_CODE_DUPLICATE", "Mã nhân viên đã tồn tại.", 409);

        if (req.JobPositionId is null) throw new DomainException("EMPLOYEE_JOB_POSITION_REQUIRED", "Vị trí công việc bắt buộc.");
        if (req.DepartmentId is null) throw new DomainException("EMPLOYEE_DEPARTMENT_REQUIRED", "Phòng ban bắt buộc.");
        if (req.WorkingStatusId is null) throw new DomainException("EMPLOYEE_WORKING_STATUS_REQUIRED", "Trạng thái làm việc bắt buộc.");

        ValidateEmail(req.PersonalEmail);
        ValidateEmail(req.CompanyEmail);
        ValidateDateSequence(req.InternshipStartDate, req.ProbationStartDate, req.OfficialStartDate);

        await RequireLookup(db, req.JobPositionId.Value, "JobPosition", "EMPLOYEE_JOB_POSITION_INVALID", ct);
        if (req.JobTitleId is not null)
            await RequireLookup(db, req.JobTitleId.Value, "JobTitle", "EMPLOYEE_JOB_TITLE_INVALID", ct);
        await RequireLookup(db, req.WorkingStatusId.Value, "WorkingStatus", "EMPLOYEE_WORKING_STATUS_INVALID", ct);
        if (req.WorkLocationId is not null)
            await RequireLookup(db, req.WorkLocationId.Value, "WorkLocation", "EMPLOYEE_WORK_LOCATION_INVALID", ct);
        await RequireOrgUnit(db, req.DepartmentId.Value, "EMPLOYEE_DEPARTMENT_INVALID", ct);
        if (req.OrganizationUnitId is not null)
            await RequireOrgUnit(db, req.OrganizationUnitId.Value, "EMPLOYEE_ORGANIZATION_UNIT_INVALID", ct);
        if (req.DirectManagerEmployeeId is not null)
        {
            var ok = await db.Employees.AnyAsync(x => x.Id == req.DirectManagerEmployeeId, ct);
            if (!ok) throw new DomainException("EMPLOYEE_MANAGER_INVALID", "Không tìm thấy nhân viên quản lý.");
        }

        var mobile = req.MobilePhone?.Trim();
        var company = req.CompanyEmail?.Trim();
        var personal = req.PersonalEmail?.Trim();

        var entity = new Employee
        {
            Code = req.Code.Trim(),
            MiddleName = req.MiddleName?.Trim(),
            FirstName = req.FirstName?.Trim(),
            FullName = req.FullName.Trim(),
            Gender = req.Gender,
            DateOfBirth = req.DateOfBirth,
            AttendanceCode = req.AttendanceCode?.Trim(),
            MobilePhone = mobile,
            CompanyPhone = req.CompanyPhone?.Trim(),
            PersonalEmail = personal,
            CompanyEmail = company,
            Skype = req.Skype?.Trim(),
            JobPositionId = req.JobPositionId,
            JobTitleId = req.JobTitleId,
            DepartmentId = req.DepartmentId,
            OrganizationUnitId = req.OrganizationUnitId ?? req.DepartmentId,
            WorkLocationId = req.WorkLocationId,
            InternshipStartDate = req.InternshipStartDate,
            ProbationStartDate = req.ProbationStartDate,
            OfficialStartDate = req.OfficialStartDate,
            DirectManagerEmployeeId = req.DirectManagerEmployeeId,
            WorkingStatusId = req.WorkingStatusId,
            // Sync nhanh cho list page
            PhoneNumber = mobile ?? req.CompanyPhone?.Trim(),
            Email = company ?? personal,
            IsActive = true,
        };
        db.Employees.Add(entity);
        await db.SaveChangesAsync(ct);
        return Results.Created($"/api/employees/{entity.Id}", new { id = entity.Id });
    }

    private static async Task<IResult> Delete(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.Employees.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");

        var hasManaged = await db.Employees.AnyAsync(x => x.DirectManagerEmployeeId == id, ct);
        if (hasManaged)
            throw new DomainException("EMPLOYEE_DELETE_BLOCKED", "Không thể xóa: nhân viên đang là quản lý trực tiếp.", 409);

        db.Employees.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> GetSummary(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.Employees.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");

        var lookupIds = new HashSet<Guid>();
        if (entity.JobPositionId is not null) lookupIds.Add(entity.JobPositionId.Value);
        if (entity.WorkingStatusId is not null) lookupIds.Add(entity.WorkingStatusId.Value);
        var lookupDict = await LoadLookupRefsAsync(db, lookupIds, ct);

        string? orgLabel = null;
        if (entity.OrganizationUnitId is not null)
        {
            var ou = await db.OrganizationUnits.AsNoTracking()
                .Where(x => x.Id == entity.OrganizationUnitId)
                .Select(x => new { x.Code, x.Name })
                .FirstOrDefaultAsync(ct);
            if (ou is not null) orgLabel = $"{ou.Code} - {ou.Name}";
        }

        return Results.Ok(new EmployeeSummaryDto(
            entity.Id, entity.Code, entity.FullName,
            entity.WorkingStatusId is null ? null : lookupDict.GetValueOrDefault(entity.WorkingStatusId.Value)?.Name,
            entity.JobPositionId is null ? null : lookupDict.GetValueOrDefault(entity.JobPositionId.Value)?.Name,
            orgLabel));
    }

    private static IResult GetTabs(Guid id) => Results.Ok(new EmployeeTabRegistryDto(
        DefaultTabKey: "tab-01-general",
        Tabs: new[]
        {
            new EmployeeTabDto("tab-01-general",         "Thông tin chung",      "ready"),
            new EmployeeTabDto("tab-02-personal",        "Thông tin cá nhân",    "ready"),
            new EmployeeTabDto("tab-03-family",          "Gia đình",             "ready"),
            new EmployeeTabDto("tab-04-labor-contract",  "Hợp đồng lao động",   "ready"),
            new EmployeeTabDto("tab-05-bank-account",    "Tài khoản ngân hàng", "ready"),
            new EmployeeTabDto("tab-06-degree",          "Bằng cấp",             "ready"),
            new EmployeeTabDto("tab-07-certificate",     "Chứng chỉ",            "ready"),
            new EmployeeTabDto("tab-08-work-experience", "Kinh nghiệm làm việc", "ready"),
            new EmployeeTabDto("tab-09-work-history",    "Quá trình công tác",   "ready"),
            new EmployeeTabDto("tab-10-salary",          "Lương",                "future"),
            new EmployeeTabDto("tab-11-benefit",         "Phụ cấp",              "future"),
            new EmployeeTabDto("tab-12-reward",          "Khen thưởng",          "future"),
            new EmployeeTabDto("tab-13-discipline",      "Kỷ luật",              "future"),
            new EmployeeTabDto("tab-14-training-history","Lịch sử đào tạo",     "future"),
            new EmployeeTabDto("tab-15-evaluation",      "Đánh giá",             "future"),
            new EmployeeTabDto("tab-16-asset",           "Tài sản",              "future"),
            new EmployeeTabDto("tab-17-recruitment-history","Lịch sử tuyển dụng", "future"),
            new EmployeeTabDto("tab-18-document-list",   "Hồ sơ tài liệu",      "ready"),
            new EmployeeTabDto("tab-19-change-history",  "Lịch sử thay đổi",    "future"),
        }));

    private static async Task<IResult> GetGeneral(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var e = await db.Employees.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");

        var lookupIds = new HashSet<Guid>();
        foreach (var v in new[] { e.JobPositionId, e.JobTitleId, e.WorkLocationId, e.WorkingStatusId })
            if (v is not null) lookupIds.Add(v.Value);
        var lookupDict = await LoadLookupRefsAsync(db, lookupIds, ct);

        var ouIds = new HashSet<Guid>();
        if (e.OrganizationUnitId is not null) ouIds.Add(e.OrganizationUnitId.Value);
        if (e.DepartmentId is not null) ouIds.Add(e.DepartmentId.Value);
        var ouDict = await LoadOrgRefsAsync(db, ouIds, ct);

        EmployeeRefDto? managerDto = null;
        if (e.DirectManagerEmployeeId is not null)
        {
            var m = await db.Employees.AsNoTracking()
                .Where(x => x.Id == e.DirectManagerEmployeeId)
                .Select(x => new { x.Id, x.Code, x.FullName })
                .FirstOrDefaultAsync(ct);
            if (m is not null) managerDto = new EmployeeRefDto(m.Id, m.Code, m.FullName);
        }

        return Results.Ok(new EmployeeGeneralInfoDto(
            e.Id, e.Code, e.AvatarFileId,
            e.MiddleName, e.FirstName, e.FullName, e.Gender, e.DateOfBirth,
            e.AttendanceCode, e.MobilePhone, e.CompanyPhone,
            e.PersonalEmail, e.CompanyEmail, e.Skype,
            e.JobPositionId, e.JobPositionId is null ? null : lookupDict.GetValueOrDefault(e.JobPositionId.Value),
            e.JobTitleId,    e.JobTitleId    is null ? null : lookupDict.GetValueOrDefault(e.JobTitleId.Value),
            e.OrganizationUnitId, e.OrganizationUnitId is null ? null : ouDict.GetValueOrDefault(e.OrganizationUnitId.Value),
            e.DepartmentId,       e.DepartmentId       is null ? null : ouDict.GetValueOrDefault(e.DepartmentId.Value),
            e.WorkLocationId,     e.WorkLocationId     is null ? null : lookupDict.GetValueOrDefault(e.WorkLocationId.Value),
            e.InternshipStartDate, e.ProbationStartDate, e.OfficialStartDate,
            e.DirectManagerEmployeeId, managerDto,
            e.WorkingStatusId, e.WorkingStatusId is null ? null : lookupDict.GetValueOrDefault(e.WorkingStatusId.Value)
        ));
    }

    private static async Task<IResult> UpdateGeneral(
        Guid id,
        [FromBody] UpdateEmployeeGeneralInfoRequest req,
        HrmDbContext db,
        CancellationToken ct)
    {
        var e = await db.Employees.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");

        ValidateFullName(req.FullName);
        ValidateGender(req.Gender, required: true);
        if (req.JobPositionId is null) throw new DomainException("EMPLOYEE_JOB_POSITION_REQUIRED", "Vị trí công việc bắt buộc.");
        if (req.DepartmentId is null) throw new DomainException("EMPLOYEE_DEPARTMENT_REQUIRED", "Phòng ban bắt buộc.");
        if (req.WorkingStatusId is null) throw new DomainException("EMPLOYEE_WORKING_STATUS_REQUIRED", "Trạng thái làm việc bắt buộc.");

        ValidateEmail(req.PersonalEmail);
        ValidateEmail(req.CompanyEmail);

        if (req.DirectManagerEmployeeId == id)
            throw new DomainException("EMPLOYEE_MANAGER_INVALID", "Quản lý trực tiếp không thể là chính nhân viên.");

        ValidateDateSequence(req.InternshipStartDate, req.ProbationStartDate, req.OfficialStartDate);

        await RequireLookup(db, req.JobPositionId.Value, "JobPosition", "EMPLOYEE_JOB_POSITION_INVALID", ct);
        if (req.JobTitleId is not null)
            await RequireLookup(db, req.JobTitleId.Value, "JobTitle", "EMPLOYEE_JOB_TITLE_INVALID", ct);
        await RequireLookup(db, req.WorkingStatusId.Value, "WorkingStatus", "EMPLOYEE_WORKING_STATUS_INVALID", ct);
        if (req.WorkLocationId is not null)
            await RequireLookup(db, req.WorkLocationId.Value, "WorkLocation", "EMPLOYEE_WORK_LOCATION_INVALID", ct);

        await RequireOrgUnit(db, req.DepartmentId.Value, "EMPLOYEE_DEPARTMENT_INVALID", ct);
        if (req.OrganizationUnitId is not null)
            await RequireOrgUnit(db, req.OrganizationUnitId.Value, "EMPLOYEE_ORGANIZATION_UNIT_INVALID", ct);

        if (req.DirectManagerEmployeeId is not null)
        {
            var ok = await db.Employees.AnyAsync(x => x.Id == req.DirectManagerEmployeeId, ct);
            if (!ok) throw new DomainException("EMPLOYEE_MANAGER_INVALID", "Không tìm thấy nhân viên quản lý.");
        }

        e.MiddleName = req.MiddleName?.Trim();
        e.FirstName = req.FirstName?.Trim();
        e.FullName = req.FullName.Trim();
        e.Gender = req.Gender;
        e.DateOfBirth = req.DateOfBirth;
        e.AttendanceCode = req.AttendanceCode?.Trim();
        e.MobilePhone = req.MobilePhone?.Trim();
        e.CompanyPhone = req.CompanyPhone?.Trim();
        e.PersonalEmail = req.PersonalEmail?.Trim();
        e.CompanyEmail = req.CompanyEmail?.Trim();
        e.Skype = req.Skype?.Trim();
        e.JobPositionId = req.JobPositionId;
        e.JobTitleId = req.JobTitleId;
        e.OrganizationUnitId = req.OrganizationUnitId ?? req.DepartmentId;
        e.DepartmentId = req.DepartmentId;
        e.WorkLocationId = req.WorkLocationId;
        e.InternshipStartDate = req.InternshipStartDate;
        e.ProbationStartDate = req.ProbationStartDate;
        e.OfficialStartDate = req.OfficialStartDate;
        e.DirectManagerEmployeeId = req.DirectManagerEmployeeId;
        e.WorkingStatusId = req.WorkingStatusId;

        // Sync field cho list-page
        e.PhoneNumber = req.MobilePhone?.Trim() ?? req.CompanyPhone?.Trim();
        e.Email = req.CompanyEmail?.Trim() ?? req.PersonalEmail?.Trim();

        await db.SaveChangesAsync(ct);
        return await GetGeneral(id, db, ct);
    }

    // ---------- helpers ----------

    private static void ValidateCode(string? code)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Length > 32)
            throw new DomainException("EMPLOYEE_CODE_REQUIRED", "Mã nhân viên bắt buộc và tối đa 32 ký tự.");
    }

    private static void ValidateFullName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 128)
            throw new DomainException("EMPLOYEE_FULL_NAME_REQUIRED", "Họ tên bắt buộc và tối đa 128 ký tự.");
    }

    private static void ValidateGender(string? g, bool required)
    {
        if (string.IsNullOrEmpty(g))
        {
            if (required) throw new DomainException("EMPLOYEE_GENDER_REQUIRED", "Giới tính bắt buộc.");
            return;
        }
        if (!AllowedGenders.Contains(g))
            throw new DomainException("EMPLOYEE_GENDER_REQUIRED", "Giới tính chỉ nhận male/female/other.");
    }

    private static void ValidateEmail(string? email)
    {
        if (string.IsNullOrWhiteSpace(email)) return;
        if (!EmailRegex.IsMatch(email))
            throw new DomainException("EMPLOYEE_EMAIL_INVALID", "Email không hợp lệ.");
    }

    private static void ValidateDateSequence(DateTime? intern, DateTime? probation, DateTime? official)
    {
        if (probation is not null && intern is not null && probation < intern)
            throw new DomainException("EMPLOYEE_GENERAL_DATE_INVALID", "Ngày thử việc không thể trước ngày tập sự.");
        if (official is not null && probation is not null && official < probation)
            throw new DomainException("EMPLOYEE_GENERAL_DATE_INVALID", "Ngày chính thức không thể trước ngày thử việc.");
    }

    private static async Task RequireLookup(HrmDbContext db, Guid id, string expectedCategoryCode, string errorCode, CancellationToken ct)
    {
        var item = await db.LookupItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (item is null || item.CategoryCode != expectedCategoryCode)
            throw new DomainException(errorCode, $"Bản ghi tham chiếu phải thuộc danh mục '{expectedCategoryCode}'.");
    }

    private static async Task RequireOrgUnit(HrmDbContext db, Guid id, string errorCode, CancellationToken ct)
    {
        if (!await db.OrganizationUnits.AnyAsync(x => x.Id == id, ct))
            throw new DomainException(errorCode, "Đơn vị tổ chức không tồn tại.");
    }

    private static async Task<List<EmployeeListItemDto>> ToListItemsAsync(
        HrmDbContext db, IReadOnlyList<Employee> rows, CancellationToken ct)
    {
        if (rows.Count == 0) return new();

        var lookupIds = new HashSet<Guid>();
        var ouIds = new HashSet<Guid>();
        foreach (var x in rows)
        {
            if (x.JobPositionId is not null) lookupIds.Add(x.JobPositionId.Value);
            if (x.WorkingStatusId is not null) lookupIds.Add(x.WorkingStatusId.Value);
            if (x.DepartmentId is not null) ouIds.Add(x.DepartmentId.Value);
        }
        var lookupDict = await LoadLookupRefsAsync(db, lookupIds, ct);
        var ouDict = await LoadOrgRefsAsync(db, ouIds, ct);

        return rows.Select(x => new EmployeeListItemDto(
            x.Id, x.Code, x.FullName,
            x.Gender, GenderLabel(x.Gender),
            x.DateOfBirth,
            x.JobPositionId,
            x.JobPositionId is null ? null : lookupDict.GetValueOrDefault(x.JobPositionId.Value)?.Name,
            x.DepartmentId,
            x.DepartmentId is null ? null : ouDict.GetValueOrDefault(x.DepartmentId.Value)?.Name,
            x.PhoneNumber, x.Email,
            x.ProbationStartDate, x.OfficialStartDate,
            x.WorkingStatusId,
            x.WorkingStatusId is null ? null : lookupDict.GetValueOrDefault(x.WorkingStatusId.Value)?.Name
        )).ToList();
    }

    private static async Task<Dictionary<Guid, EmployeeRefDto>> LoadLookupRefsAsync(
        HrmDbContext db, ICollection<Guid> ids, CancellationToken ct)
    {
        if (ids.Count == 0) return new();
        return await db.LookupItems.AsNoTracking()
            .Where(x => ids.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => new EmployeeRefDto(x.Id, x.Code, x.Name), ct);
    }

    private static async Task<Dictionary<Guid, EmployeeRefDto>> LoadOrgRefsAsync(
        HrmDbContext db, ICollection<Guid> ids, CancellationToken ct)
    {
        if (ids.Count == 0) return new();
        return await db.OrganizationUnits.AsNoTracking()
            .Where(x => ids.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => new EmployeeRefDto(x.Id, x.Code, x.Name), ct);
    }

    private static string? GenderLabel(string? gender) => gender switch
    {
        "male" => "Nam",
        "female" => "Nữ",
        "other" => "Khác",
        _ => null
    };
}
