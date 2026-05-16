using System.Text.RegularExpressions;
using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Persistence;
using Hrm.Api.Features.Authorization;
using Hrm.Api.Features.Lookups;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Employees;

/// <summary>
/// Endpoint Tab 02 — Thông tin cá nhân (CCCD, hộ chiếu, đảng/đoàn, trình độ, gia đình, liên hệ, địa chỉ, sức khỏe).
/// </summary>
public static class EmployeePersonalEndpoints
{
    private static readonly Regex EmailRegex = new(@"^[^@\s]+@[^@\s]+\.[^@\s]+$", RegexOptions.Compiled);

    public static IEndpointRouteBuilder MapEmployeePersonalEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/employees").RequireAuthorization();
        group.MapGet("/{id:guid}/personal-info", Get).RequirePermission(AuthPermissions.EmpView);
        group.MapPut("/{id:guid}/personal-info", Update).RequirePermission(AuthPermissions.EmpEdit);
        return routes;
    }

    private static async Task<IResult> Get(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var e = await db.Employees.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");
        return Results.Ok(await BuildDtoAsync(db, e, ct));
    }

    private static async Task<IResult> Update(
        Guid id,
        [FromBody] UpdateEmployeePersonalInfoRequest req,
        HrmDbContext db,
        CancellationToken ct)
    {
        var e = await db.Employees.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");

        // Validate email format các email field
        ValidateEmail(req.PersonalEmail, "EMPLOYEE_PERSONAL_EMAIL_INVALID");
        ValidateEmail(req.OfficeEmail, "EMPLOYEE_PERSONAL_EMAIL_INVALID");
        ValidateEmail(req.OtherEmail, "EMPLOYEE_PERSONAL_EMAIL_INVALID");
        ValidateEmail(req.EmergencyEmail, "EMPLOYEE_PERSONAL_EMAIL_INVALID");

        if (req.GraduationYear is not null && (req.GraduationYear < 1900 || req.GraduationYear > 2100))
            throw new DomainException("EMPLOYEE_PERSONAL_GRADUATION_YEAR_INVALID", "Năm tốt nghiệp không hợp lệ (1900-2100).");

        if (req.IdentityIssueDate is not null && req.IdentityExpiryDate is not null && req.IdentityExpiryDate < req.IdentityIssueDate)
            throw new DomainException("EMPLOYEE_PERSONAL_IDENTITY_DATE_INVALID", "Ngày hết hạn CMND/CCCD không thể trước ngày cấp.");
        if (req.PassportIssueDate is not null && req.PassportExpiryDate is not null && req.PassportExpiryDate < req.PassportIssueDate)
            throw new DomainException("EMPLOYEE_PERSONAL_PASSPORT_DATE_INVALID", "Ngày hết hạn hộ chiếu không thể trước ngày cấp.");

        // Validate lookup category cho từng FK (nếu có id thì phải đúng category).
        await EnsureCategoryAsync(db, req.IdentityIssueProvinceId, "Province", "EMPLOYEE_PERSONAL_ADDRESS_INVALID", ct);
        await EnsureCategoryAsync(db, req.PassportIssueProvinceId, "Province", "EMPLOYEE_PERSONAL_ADDRESS_INVALID", ct);
        await EnsureCategoryAsync(db, req.EducationLevelId, "EducationLevel", "EMPLOYEE_PERSONAL_LOOKUP_INVALID", ct);
        await EnsureCategoryAsync(db, req.EducationPlaceId, "TrainingPlace", "EMPLOYEE_PERSONAL_LOOKUP_INVALID", ct);
        await EnsureCategoryAsync(db, req.EducationFacultyId, "TrainingFaculty", "EMPLOYEE_PERSONAL_LOOKUP_INVALID", ct);
        await EnsureCategoryAsync(db, req.EducationMajorId, "TrainingMajor", "EMPLOYEE_PERSONAL_LOOKUP_INVALID", ct);
        await EnsureCategoryAsync(db, req.DegreeClassificationId, "DegreeRank", "EMPLOYEE_PERSONAL_LOOKUP_INVALID", ct);
        await EnsureCategoryAsync(db, req.MaritalStatusId, "MaritalStatus", "EMPLOYEE_PERSONAL_LOOKUP_INVALID", ct);
        await EnsureCategoryAsync(db, req.FamilyBackgroundId, "FamilyBackground", "EMPLOYEE_PERSONAL_LOOKUP_INVALID", ct);
        await EnsureCategoryAsync(db, req.PersonalBackgroundId, "PersonalBackground", "EMPLOYEE_PERSONAL_LOOKUP_INVALID", ct);
        await EnsureCategoryAsync(db, req.EthnicityId, "Ethnicity", "EMPLOYEE_PERSONAL_LOOKUP_INVALID", ct);
        await EnsureCategoryAsync(db, req.ReligionId, "Religion", "EMPLOYEE_PERSONAL_LOOKUP_INVALID", ct);
        await EnsureCategoryAsync(db, req.NationalityCountryId, "Country", "EMPLOYEE_PERSONAL_LOOKUP_INVALID", ct);
        await EnsureCategoryAsync(db, req.EmergencyRelationId, "FamilyRelation", "EMPLOYEE_PERSONAL_LOOKUP_INVALID", ct);

        await ValidateAddressAsync(db, req.NativePlaceAddress, ct);
        await ValidateAddressAsync(db, req.PermanentResidenceAddress, ct);
        var current = req.SameAsPermanentResidence ? req.PermanentResidenceAddress : req.CurrentResidenceAddress;
        await ValidateAddressAsync(db, current, ct);

        e.IdentityNumber = req.IdentityNumber?.Trim();
        e.IdentityIssueDate = req.IdentityIssueDate;
        e.IdentityIssueProvinceId = req.IdentityIssueProvinceId;
        e.IdentityExpiryDate = req.IdentityExpiryDate;
        e.PassportNumber = req.PassportNumber?.Trim();
        e.PassportIssueDate = req.PassportIssueDate;
        e.PassportIssueProvinceId = req.PassportIssueProvinceId;
        e.PassportExpiryDate = req.PassportExpiryDate;

        e.PartyCardNumber = req.PartyCardNumber?.Trim();
        e.PartyJoinDate = req.PartyJoinDate;
        e.PartyJoinPlace = req.PartyJoinPlace?.Trim();
        e.UnionCardNumber = req.UnionCardNumber?.Trim();
        e.UnionJoinDate = req.UnionJoinDate;
        e.UnionJoinPlace = req.UnionJoinPlace?.Trim();

        e.GeneralEducationLevel = req.GeneralEducationLevel?.Trim();
        e.EducationLevelId = req.EducationLevelId;
        e.EducationPlaceId = req.EducationPlaceId;
        e.EducationFacultyId = req.EducationFacultyId;
        e.EducationMajorId = req.EducationMajorId;
        e.GraduationYear = req.GraduationYear;
        e.DegreeClassificationId = req.DegreeClassificationId;

        e.MaritalStatusId = req.MaritalStatusId;
        e.FamilyBackgroundId = req.FamilyBackgroundId;
        e.PersonalBackgroundId = req.PersonalBackgroundId;
        e.EthnicityId = req.EthnicityId;
        e.ReligionId = req.ReligionId;
        e.NationalityCountryId = req.NationalityCountryId;

        e.MobilePhone = req.MobilePhone?.Trim();
        e.HomePhone = req.HomePhone?.Trim();
        e.OfficePhone = req.OfficePhone?.Trim();
        e.OtherPhone = req.OtherPhone?.Trim();
        e.OfficeEmail = req.OfficeEmail?.Trim();
        e.PersonalEmail = req.PersonalEmail?.Trim();
        e.OtherEmail = req.OtherEmail?.Trim();
        e.Skype = req.Skype?.Trim();
        e.Facebook = req.Facebook?.Trim();

        ApplyAddress(req.NativePlaceAddress,
            (c, p, d, w, l) => { e.NativePlaceCountryId = c; e.NativePlaceProvinceId = p; e.NativePlaceDistrictId = d; e.NativePlaceWardId = w; e.NativePlaceAddressLine = l; });
        e.BirthPlace = req.BirthPlace?.Trim();
        e.HouseholdBookNumber = req.HouseholdBookNumber?.Trim();
        e.FamilyHouseholdCode = req.FamilyHouseholdCode?.Trim();
        e.IsHouseholdHead = req.IsHouseholdHead;

        ApplyAddress(req.PermanentResidenceAddress,
            (c, p, d, w, l) => { e.PermanentResidenceCountryId = c; e.PermanentResidenceProvinceId = p; e.PermanentResidenceDistrictId = d; e.PermanentResidenceWardId = w; e.PermanentResidenceAddressLine = l; });
        e.SameAsPermanentResidence = req.SameAsPermanentResidence;
        ApplyAddress(current,
            (c, p, d, w, l) => { e.CurrentResidenceCountryId = c; e.CurrentResidenceProvinceId = p; e.CurrentResidenceDistrictId = d; e.CurrentResidenceWardId = w; e.CurrentResidenceAddressLine = l; });

        e.EmergencyContactName = req.EmergencyContactName?.Trim();
        e.EmergencyRelationId = req.EmergencyRelationId;
        e.EmergencyMobilePhone = req.EmergencyMobilePhone?.Trim();
        e.EmergencyHomePhone = req.EmergencyHomePhone?.Trim();
        e.EmergencyEmail = req.EmergencyEmail?.Trim();
        e.EmergencyAddress = req.EmergencyAddress?.Trim();

        e.HeightText = req.HeightText?.Trim();
        e.WeightText = req.WeightText?.Trim();
        e.BloodGroupText = req.BloodGroupText?.Trim();
        e.HealthStatusText = req.HealthStatusText?.Trim();

        await db.SaveChangesAsync(ct);
        return Results.Ok(await BuildDtoAsync(db, e, ct));
    }

    // ---------- helpers ----------

    private static void ValidateEmail(string? email, string code)
    {
        if (string.IsNullOrWhiteSpace(email)) return;
        if (!EmailRegex.IsMatch(email))
            throw new DomainException(code, "Email không hợp lệ.");
    }

    private static async Task EnsureCategoryAsync(HrmDbContext db, Guid? id, string expectedCategoryCode, string errorCode, CancellationToken ct)
    {
        if (id is null) return;
        var item = await db.LookupItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == id, ct);
        if (item is null || item.CategoryCode != expectedCategoryCode)
            throw new DomainException(errorCode, $"Bản ghi tham chiếu phải thuộc danh mục '{expectedCategoryCode}'.");
    }

    private static async Task ValidateAddressAsync(HrmDbContext db, EmployeeAddressInput? addr, CancellationToken ct)
    {
        if (addr is null) return;
        await EnsureCategoryAsync(db, addr.CountryId, "Country", "EMPLOYEE_PERSONAL_ADDRESS_INVALID", ct);
        await EnsureCategoryAsync(db, addr.ProvinceId, "Province", "EMPLOYEE_PERSONAL_ADDRESS_INVALID", ct);
        await EnsureCategoryAsync(db, addr.DistrictId, "District", "EMPLOYEE_PERSONAL_ADDRESS_INVALID", ct);
        await EnsureCategoryAsync(db, addr.WardId, "Ward", "EMPLOYEE_PERSONAL_ADDRESS_INVALID", ct);
    }

    private static void ApplyAddress(EmployeeAddressInput? addr, Action<Guid?, Guid?, Guid?, Guid?, string?> assign)
    {
        if (addr is null) { assign(null, null, null, null, null); return; }
        assign(addr.CountryId, addr.ProvinceId, addr.DistrictId, addr.WardId, addr.AddressLine?.Trim());
    }

    private static async Task<EmployeePersonalInfoDto> BuildDtoAsync(HrmDbContext db, Employee e, CancellationToken ct)
    {
        var ids = new HashSet<Guid>();
        void Add(Guid? id) { if (id is not null) ids.Add(id.Value); }
        Add(e.IdentityIssueProvinceId); Add(e.PassportIssueProvinceId);
        Add(e.EducationLevelId); Add(e.EducationPlaceId); Add(e.EducationFacultyId); Add(e.EducationMajorId); Add(e.DegreeClassificationId);
        Add(e.MaritalStatusId); Add(e.FamilyBackgroundId); Add(e.PersonalBackgroundId);
        Add(e.EthnicityId); Add(e.ReligionId); Add(e.NationalityCountryId);
        Add(e.EmergencyRelationId);
        Add(e.NativePlaceCountryId); Add(e.NativePlaceProvinceId); Add(e.NativePlaceDistrictId); Add(e.NativePlaceWardId);
        Add(e.PermanentResidenceCountryId); Add(e.PermanentResidenceProvinceId); Add(e.PermanentResidenceDistrictId); Add(e.PermanentResidenceWardId);
        Add(e.CurrentResidenceCountryId); Add(e.CurrentResidenceProvinceId); Add(e.CurrentResidenceDistrictId); Add(e.CurrentResidenceWardId);

        var dict = ids.Count == 0
            ? new Dictionary<Guid, EmployeeRefDto>()
            : await db.LookupItems.AsNoTracking().Where(x => ids.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => new EmployeeRefDto(x.Id, x.Code, x.Name), ct);

        EmployeeRefDto? Ref(Guid? id) => id is null ? null : dict.GetValueOrDefault(id.Value);

        EmployeeAddressDto Addr(Guid? c, Guid? p, Guid? d, Guid? w, string? line) =>
            new(c, Ref(c), p, Ref(p), d, Ref(d), w, Ref(w), line);

        return new EmployeePersonalInfoDto(
            e.Id, e.Code,
            e.IdentityNumber, e.IdentityIssueDate, e.IdentityIssueProvinceId, Ref(e.IdentityIssueProvinceId), e.IdentityExpiryDate,
            e.PassportNumber, e.PassportIssueDate, e.PassportIssueProvinceId, Ref(e.PassportIssueProvinceId), e.PassportExpiryDate,
            e.PartyCardNumber, e.PartyJoinDate, e.PartyJoinPlace,
            e.UnionCardNumber, e.UnionJoinDate, e.UnionJoinPlace,
            e.GeneralEducationLevel,
            e.EducationLevelId, Ref(e.EducationLevelId),
            e.EducationPlaceId, Ref(e.EducationPlaceId),
            e.EducationFacultyId, Ref(e.EducationFacultyId),
            e.EducationMajorId, Ref(e.EducationMajorId),
            e.GraduationYear,
            e.DegreeClassificationId, Ref(e.DegreeClassificationId),
            e.MaritalStatusId, Ref(e.MaritalStatusId),
            e.FamilyBackgroundId, Ref(e.FamilyBackgroundId),
            e.PersonalBackgroundId, Ref(e.PersonalBackgroundId),
            e.EthnicityId, Ref(e.EthnicityId),
            e.ReligionId, Ref(e.ReligionId),
            e.NationalityCountryId, Ref(e.NationalityCountryId),
            e.MobilePhone, e.HomePhone, e.OfficePhone, e.OtherPhone,
            e.OfficeEmail, e.PersonalEmail, e.OtherEmail, e.Skype, e.Facebook,
            Addr(e.NativePlaceCountryId, e.NativePlaceProvinceId, e.NativePlaceDistrictId, e.NativePlaceWardId, e.NativePlaceAddressLine),
            e.BirthPlace, e.HouseholdBookNumber, e.FamilyHouseholdCode, e.IsHouseholdHead,
            Addr(e.PermanentResidenceCountryId, e.PermanentResidenceProvinceId, e.PermanentResidenceDistrictId, e.PermanentResidenceWardId, e.PermanentResidenceAddressLine),
            Addr(e.CurrentResidenceCountryId, e.CurrentResidenceProvinceId, e.CurrentResidenceDistrictId, e.CurrentResidenceWardId, e.CurrentResidenceAddressLine),
            e.SameAsPermanentResidence,
            e.EmergencyContactName, e.EmergencyRelationId, Ref(e.EmergencyRelationId),
            e.EmergencyMobilePhone, e.EmergencyHomePhone, e.EmergencyEmail, e.EmergencyAddress,
            e.HeightText, e.WeightText, e.BloodGroupText, e.HealthStatusText
        );
    }
}
