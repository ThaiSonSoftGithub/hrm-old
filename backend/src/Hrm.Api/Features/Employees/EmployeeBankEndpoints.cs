using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Persistence;
using Hrm.Api.Features.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Employees;

public static class EmployeeBankEndpoints
{
    public static IEndpointRouteBuilder MapEmployeeBankEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/employees/{employeeId:guid}/bank-account").RequireAuthorization();
        group.MapGet("/", Get).RequirePermission(AuthPermissions.EmpView);
        group.MapPut("/", Update).RequirePermission(AuthPermissions.EmpEdit);
        return routes;
    }

    private static async Task<IResult> Get(Guid employeeId, HrmDbContext db, CancellationToken ct)
    {
        var e = await db.Employees.AsNoTracking().FirstOrDefaultAsync(x => x.Id == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");
        return Results.Ok(await BuildDtoAsync(db, e, ct));
    }

    private static async Task<IResult> Update(
        Guid employeeId,
        [FromBody] BankAccountInput req,
        HrmDbContext db,
        CancellationToken ct)
    {
        var e = await db.Employees.FirstOrDefaultAsync(x => x.Id == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");

        if (req.Note is { Length: > 2000 })
            throw new DomainException("EMPLOYEE_BANK_NOTE_INVALID", "Ghi chú tối đa 2000 ký tự.");
        if (req.BankBranchId is not null && req.BankId is null)
            throw new DomainException("EMPLOYEE_BANK_BRANCH_REQUIRES_BANK", "Phải chọn ngân hàng trước khi chọn chi nhánh.");

        if (req.BankId is not null)
        {
            var bank = await db.LookupItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == req.BankId, ct);
            if (bank is null || bank.CategoryCode != "Bank")
                throw new DomainException("EMPLOYEE_BANK_INVALID", "Ngân hàng không hợp lệ.");
        }
        if (req.BankBranchId is not null)
        {
            var branch = await db.LookupItems.AsNoTracking().FirstOrDefaultAsync(x => x.Id == req.BankBranchId, ct);
            if (branch is null || branch.CategoryCode != "BankBranch" || branch.ParentItemId != req.BankId)
                throw new DomainException("EMPLOYEE_BANK_BRANCH_INVALID", "Chi nhánh không thuộc ngân hàng đã chọn.");
        }

        e.BankAccountNumber = req.AccountNumber?.Trim();
        e.BankAccountHolderName = req.AccountHolderName?.Trim();
        e.BankId = req.BankId;
        e.BankBranchId = req.BankBranchId;
        e.BankAccountNote = req.Note?.Trim();

        await db.SaveChangesAsync(ct);
        return Results.Ok(await BuildDtoAsync(db, e, ct));
    }

    private static async Task<BankAccountDto> BuildDtoAsync(HrmDbContext db, Employee e, CancellationToken ct)
    {
        var ids = new HashSet<Guid>();
        if (e.BankId is not null) ids.Add(e.BankId.Value);
        if (e.BankBranchId is not null) ids.Add(e.BankBranchId.Value);
        var lookups = ids.Count == 0
            ? new Dictionary<Guid, EmployeeRefDto>()
            : await db.LookupItems.AsNoTracking()
                .Where(x => ids.Contains(x.Id))
                .ToDictionaryAsync(x => x.Id, x => new EmployeeRefDto(x.Id, x.Code, x.Name), ct);
        return new BankAccountDto(
            e.Id, e.Code,
            e.BankAccountNumber, e.BankAccountHolderName,
            e.BankId, e.BankId is null ? null : lookups.GetValueOrDefault(e.BankId.Value),
            e.BankBranchId, e.BankBranchId is null ? null : lookups.GetValueOrDefault(e.BankBranchId.Value),
            e.BankAccountNote
        );
    }
}

public sealed record BankAccountDto(
    Guid EmployeeId, string EmployeeCode,
    string? AccountNumber, string? AccountHolderName,
    Guid? BankId, EmployeeRefDto? Bank,
    Guid? BankBranchId, EmployeeRefDto? BankBranch,
    string? Note);

public sealed record BankAccountInput(
    string? AccountNumber,
    string? AccountHolderName,
    Guid? BankId,
    Guid? BankBranchId,
    string? Note);
