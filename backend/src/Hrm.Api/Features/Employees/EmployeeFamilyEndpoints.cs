using System.Text.RegularExpressions;
using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Persistence;
using Hrm.Api.Features.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Employees;

public static class EmployeeFamilyEndpoints
{
    private static readonly Regex EmailRegex = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);
    private static readonly string[] AllowedGenders = new[] { "male", "female", "other" };

    public static IEndpointRouteBuilder MapEmployeeFamilyEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/employees/{employeeId:guid}/family-members").RequireAuthorization();

        group.MapGet("/", List).RequirePermission(AuthPermissions.EmpView);
        group.MapPost("/", Create).RequirePermission(AuthPermissions.EmpEdit);
        group.MapPut("/{familyMemberId:guid}", Update).RequirePermission(AuthPermissions.EmpEdit);
        group.MapDelete("/{familyMemberId:guid}", Delete).RequirePermission(AuthPermissions.EmpEdit);
        return routes;
    }

    private static async Task<IResult> List(Guid employeeId, HrmDbContext db, CancellationToken ct)
    {
        if (!await db.Employees.AsNoTracking().AnyAsync(x => x.Id == employeeId, ct))
            throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");
        var rows = await db.Set<EmployeeFamilyMember>().AsNoTracking()
            .Where(x => x.EmployeeId == employeeId)
            .OrderBy(x => x.RelationId).ThenBy(x => x.FullName)
            .ToListAsync(ct);
        return Results.Ok(await ToDtosAsync(db, rows, ct));
    }

    private static async Task<IResult> Create(
        Guid employeeId,
        [FromBody] FamilyMemberInput req,
        HrmDbContext db,
        CancellationToken ct)
    {
        if (!await db.Employees.AsNoTracking().AnyAsync(x => x.Id == employeeId, ct))
            throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");
        await ValidateAsync(db, req, ct);

        var entity = MapToEntity(new EmployeeFamilyMember { EmployeeId = employeeId }, req);
        db.Add(entity);
        await db.SaveChangesAsync(ct);

        var dto = (await ToDtosAsync(db, new[] { entity }, ct)).Single();
        return Results.Created($"/api/employees/{employeeId}/family-members/{entity.Id}", dto);
    }

    private static async Task<IResult> Update(
        Guid employeeId, Guid familyMemberId,
        [FromBody] FamilyMemberInput req,
        HrmDbContext db,
        CancellationToken ct)
    {
        var entity = await db.Set<EmployeeFamilyMember>()
            .FirstOrDefaultAsync(x => x.Id == familyMemberId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_FAMILY_MEMBER_NOT_FOUND", "Không tìm thấy thành viên gia đình.");

        await ValidateAsync(db, req, ct);
        MapToEntity(entity, req);
        await db.SaveChangesAsync(ct);

        var dto = (await ToDtosAsync(db, new[] { entity }, ct)).Single();
        return Results.Ok(dto);
    }

    private static async Task<IResult> Delete(Guid employeeId, Guid familyMemberId, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.Set<EmployeeFamilyMember>()
            .FirstOrDefaultAsync(x => x.Id == familyMemberId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_FAMILY_MEMBER_NOT_FOUND", "Không tìm thấy thành viên gia đình.");
        db.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    // ---- helpers ----

    private static EmployeeFamilyMember MapToEntity(EmployeeFamilyMember entity, FamilyMemberInput req)
    {
        entity.RelationId = req.RelationId;
        entity.FullName = req.FullName.Trim();
        entity.Gender = req.Gender!;
        entity.DateOfBirth = req.DateOfBirth;
        entity.BirthYearOnly = req.BirthYearOnly;
        entity.NationalityCountryId = req.NationalityCountryId;
        entity.IdentityOrPassportNumber = req.IdentityOrPassportNumber?.Trim();
        entity.Address = req.Address?.Trim();
        entity.MobilePhone = req.MobilePhone?.Trim();
        entity.HomePhone = req.HomePhone?.Trim();
        entity.Email = req.Email?.Trim();
        entity.Occupation = req.Occupation?.Trim();
        entity.PersonalTaxCode = req.PersonalTaxCode?.Trim();
        entity.Workplace = req.Workplace?.Trim();
        entity.SameHouseholdBook = req.SameHouseholdBook;
        entity.IsHouseholdHead = req.IsHouseholdHead;
        entity.IsDependent = req.IsDependent;
        entity.IsDeceased = req.IsDeceased;
        entity.Note = req.Note?.Trim();
        return entity;
    }

    private static async Task ValidateAsync(HrmDbContext db, FamilyMemberInput req, CancellationToken ct)
    {
        if (req.RelationId == Guid.Empty)
            throw new DomainException("EMPLOYEE_FAMILY_RELATION_REQUIRED", "Quan hệ bắt buộc.");
        if (string.IsNullOrWhiteSpace(req.FullName) || req.FullName.Length > 255)
            throw new DomainException("EMPLOYEE_FAMILY_NAME_REQUIRED", "Họ tên bắt buộc, tối đa 255 ký tự.");
        if (string.IsNullOrEmpty(req.Gender) || !AllowedGenders.Contains(req.Gender))
            throw new DomainException("EMPLOYEE_FAMILY_GENDER_REQUIRED", "Giới tính bắt buộc (male/female/other).");
        if (!string.IsNullOrWhiteSpace(req.Email) && !EmailRegex.IsMatch(req.Email))
            throw new DomainException("EMPLOYEE_FAMILY_EMAIL_INVALID", "Email không hợp lệ.");

        var rel = await db.LookupItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == req.RelationId, ct);
        if (rel is null || rel.CategoryCode != "FamilyRelation")
            throw new DomainException("EMPLOYEE_FAMILY_RELATION_REQUIRED", "Quan hệ không hợp lệ.");

        if (req.NationalityCountryId is not null)
        {
            var c = await db.LookupItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == req.NationalityCountryId, ct);
            if (c is null || c.CategoryCode != "Country")
                throw new DomainException("EMPLOYEE_FAMILY_NATIONALITY_INVALID", "Quốc tịch không hợp lệ.");
        }
    }

    private static async Task<List<FamilyMemberDto>> ToDtosAsync(
        HrmDbContext db, IReadOnlyList<EmployeeFamilyMember> rows, CancellationToken ct)
    {
        if (rows.Count == 0) return new();
        var lkIds = new HashSet<Guid>();
        foreach (var r in rows)
        {
            lkIds.Add(r.RelationId);
            if (r.NationalityCountryId is not null) lkIds.Add(r.NationalityCountryId.Value);
        }
        var lookups = await db.LookupItems.AsNoTracking()
            .Where(x => lkIds.Contains(x.Id))
            .ToDictionaryAsync(x => x.Id, x => new EmployeeRefDto(x.Id, x.Code, x.Name), ct);

        return rows.Select(r => new FamilyMemberDto(
            r.Id, r.EmployeeId,
            r.RelationId, lookups.GetValueOrDefault(r.RelationId),
            r.FullName, r.Gender, GenderLabel(r.Gender),
            r.DateOfBirth, r.BirthYearOnly,
            r.NationalityCountryId, r.NationalityCountryId is null ? null : lookups.GetValueOrDefault(r.NationalityCountryId.Value),
            r.IdentityOrPassportNumber, r.Address,
            r.MobilePhone, r.HomePhone, r.Email,
            r.Occupation, r.PersonalTaxCode, r.Workplace,
            r.SameHouseholdBook, r.IsHouseholdHead, r.IsDependent, r.IsDeceased,
            r.Note, r.CreatedAt, r.UpdatedAt
        )).ToList();
    }

    private static string? GenderLabel(string? g) => g switch
    {
        "male" => "Nam",
        "female" => "Nữ",
        "other" => "Khác",
        _ => null,
    };
}

public sealed record FamilyMemberDto(
    Guid Id, Guid EmployeeId,
    Guid RelationId, EmployeeRefDto? Relation,
    string FullName, string Gender, string? GenderLabel,
    DateTime? DateOfBirth, bool BirthYearOnly,
    Guid? NationalityCountryId, EmployeeRefDto? NationalityCountry,
    string? IdentityOrPassportNumber, string? Address,
    string? MobilePhone, string? HomePhone, string? Email,
    string? Occupation, string? PersonalTaxCode, string? Workplace,
    bool SameHouseholdBook, bool IsHouseholdHead, bool IsDependent, bool IsDeceased,
    string? Note, DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record FamilyMemberInput(
    Guid RelationId,
    string FullName,
    string Gender,
    DateTime? DateOfBirth,
    bool BirthYearOnly,
    Guid? NationalityCountryId,
    string? IdentityOrPassportNumber,
    string? Address,
    string? MobilePhone,
    string? HomePhone,
    string? Email,
    string? Occupation,
    string? PersonalTaxCode,
    string? Workplace,
    bool SameHouseholdBook,
    bool IsHouseholdHead,
    bool IsDependent,
    bool IsDeceased,
    string? Note);
