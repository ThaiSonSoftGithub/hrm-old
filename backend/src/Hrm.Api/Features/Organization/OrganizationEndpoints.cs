using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Pagination;
using Hrm.Api.Common.Persistence;
using Hrm.Api.Features.Authorization;
using Hrm.Api.Features.Lookups;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Organization;

public static class OrganizationEndpoints
{
    public static IEndpointRouteBuilder MapOrganizationEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/organization-units").RequireAuthorization();

        group.MapGet("/", List).RequirePermission(AuthPermissions.OrgView);
        group.MapGet("/tree", Tree).RequirePermission(AuthPermissions.OrgView);
        group.MapGet("/{id:guid}", GetById).RequirePermission(AuthPermissions.OrgView);
        group.MapPost("/", Create).RequirePermission(AuthPermissions.OrgCreate);
        group.MapPut("/{id:guid}", Update).RequirePermission(AuthPermissions.OrgEdit);
        group.MapDelete("/{id:guid}", Delete).RequirePermission(AuthPermissions.OrgDelete);
        return routes;
    }

    private static async Task<LookupItem> RequireLookup(HrmDbContext db, Guid id, string expectedCategoryCode, string errorCode, CancellationToken ct)
    {
        var item = await db.LookupItems.FirstOrDefaultAsync(x => x.Id == id, ct);
        if (item is null || item.CategoryCode != expectedCategoryCode)
            throw new DomainException(errorCode, $"Bản ghi tham chiếu phải thuộc danh mục '{expectedCategoryCode}'.");
        return item;
    }

    private static async Task<IResult> List(
        [AsParameters] PagedRequest q,
        [FromQuery] Guid? parentUnitId,
        [FromQuery] Guid? organizationLevelId,
        HrmDbContext db,
        CancellationToken ct)
    {
        var query = db.OrganizationUnits.AsNoTracking().AsQueryable();
        if (!string.IsNullOrWhiteSpace(q.Keyword))
        {
            var k = q.Keyword.Trim();
            query = query.Where(x => x.Code.Contains(k) || x.Name.Contains(k));
        }
        if (q.IsActive is not null) query = query.Where(x => x.IsActive == q.IsActive);
        if (parentUnitId is not null) query = query.Where(x => x.ParentUnitId == parentUnitId);
        if (organizationLevelId is not null) query = query.Where(x => x.OrganizationLevelId == organizationLevelId);

        query = (q.SortBy?.ToLowerInvariant(), q.SortDirection?.ToLowerInvariant()) switch
        {
            ("name", "desc") => query.OrderByDescending(x => x.Name),
            ("name", _)      => query.OrderBy(x => x.Name),
            ("code", "desc") => query.OrderByDescending(x => x.Code),
            _                 => query.OrderBy(x => x.Code)
        };

        var total = await query.CountAsync(ct);
        var rows = await query.Skip(q.Skip).Take(q.Take).ToListAsync(ct);
        var items = await ToDtosAsync(db, rows, ct);
        return Results.Ok(new PagedResult<OrganizationUnitDto>(items, q.EffectivePage, q.Take, total));
    }

    private static async Task<IResult> Tree(HrmDbContext db, CancellationToken ct)
    {
        var all = await db.OrganizationUnits.AsNoTracking()
            .OrderBy(x => x.Code)
            .Select(x => new { x.Id, x.Code, x.Name, x.IsActive, x.ParentUnitId })
            .ToListAsync(ct);

        var nodesById = all.ToDictionary(
            x => x.Id,
            x => new OrganizationUnitTreeNodeDto(x.Id, x.Code, x.Name, x.IsActive, x.ParentUnitId, new List<OrganizationUnitTreeNodeDto>()));

        var roots = new List<OrganizationUnitTreeNodeDto>();
        foreach (var x in all)
        {
            var node = nodesById[x.Id];
            if (x.ParentUnitId is null || !nodesById.ContainsKey(x.ParentUnitId.Value))
                roots.Add(node);
            else
                nodesById[x.ParentUnitId.Value].Children.Add(node);
        }
        return Results.Ok(roots);
    }

    private static async Task<IResult> GetById(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.OrganizationUnits.AsNoTracking()
            .FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("ORGANIZATION_UNIT_NOT_FOUND", "Không tìm thấy đơn vị.");
        var dto = (await ToDtosAsync(db, new[] { entity }, ct)).Single();
        return Results.Ok(dto);
    }

    private static async Task<IResult> Create(
        [FromBody] CreateOrganizationUnitRequest req,
        HrmDbContext db,
        CancellationToken ct)
    {
        Validate(req.Code, req.Name, req.OrganizationLevelId, req.Note);

        if (await db.OrganizationUnits.AnyAsync(x => x.Code == req.Code, ct))
            throw new DomainException("ORGANIZATION_UNIT_CODE_DUPLICATE", "Mã đơn vị đã tồn tại.", 409);

        await RequireLookup(db, req.OrganizationLevelId, "OrganizationLevel", "ORGANIZATION_LEVEL_INVALID", ct);
        if (req.WorkLocationId is not null)
            await RequireLookup(db, req.WorkLocationId.Value, "WorkLocation", "WORK_LOCATION_INVALID", ct);

        if (req.ParentUnitId is not null)
        {
            if (!await db.OrganizationUnits.AnyAsync(x => x.Id == req.ParentUnitId, ct))
                throw new DomainException("ORGANIZATION_UNIT_PARENT_INVALID", "Đơn vị cha không tồn tại.");
        }

        ValidateDates(req.EstablishedDate, req.LicenseIssuedDate);

        var entity = new OrganizationUnit
        {
            Code = req.Code.Trim(),
            Name = req.Name.Trim(),
            ParentUnitId = req.ParentUnitId,
            OrganizationLevelId = req.OrganizationLevelId,
            WorkLocationId = req.WorkLocationId,
            EstablishedDate = req.EstablishedDate,
            BusinessRegistrationNumber = req.BusinessRegistrationNumber,
            LicenseIssuedDate = req.LicenseIssuedDate,
            LicenseIssuedPlace = req.LicenseIssuedPlace,
            RepresentativeName = req.RepresentativeName,
            Phone = req.Phone,
            Fax = req.Fax,
            Email = req.Email,
            Note = req.Note,
            IsActive = req.IsActive
        };
        db.OrganizationUnits.Add(entity);
        await db.SaveChangesAsync(ct);

        var dto = (await ToDtosAsync(db, new[] { entity }, ct)).Single();
        return Results.Created($"/api/organization-units/{entity.Id}", dto);
    }

    private static async Task<IResult> Update(
        Guid id,
        [FromBody] UpdateOrganizationUnitRequest req,
        HrmDbContext db,
        CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(req.Name) || req.Name.Length > 256)
            throw new ValidationException("Tên đơn vị bắt buộc và tối đa 256 ký tự.");
        if (req.Note is { Length: > 2000 })
            throw new ValidationException("Ghi chú tối đa 2000 ký tự.");

        var entity = await db.OrganizationUnits.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("ORGANIZATION_UNIT_NOT_FOUND", "Không tìm thấy đơn vị.");

        await RequireLookup(db, req.OrganizationLevelId, "OrganizationLevel", "ORGANIZATION_LEVEL_INVALID", ct);
        if (req.WorkLocationId is not null)
            await RequireLookup(db, req.WorkLocationId.Value, "WorkLocation", "WORK_LOCATION_INVALID", ct);

        if (req.ParentUnitId is not null)
        {
            if (req.ParentUnitId == id)
                throw new DomainException("ORGANIZATION_UNIT_PARENT_INVALID", "Đơn vị không thể là cha của chính nó.");

            if (!await db.OrganizationUnits.AnyAsync(x => x.Id == req.ParentUnitId, ct))
                throw new DomainException("ORGANIZATION_UNIT_PARENT_INVALID", "Đơn vị cha không tồn tại.");

            await EnsureNoCycleAsync(db, id, req.ParentUnitId.Value, ct);
        }

        ValidateDates(req.EstablishedDate, req.LicenseIssuedDate);

        entity.Name = req.Name.Trim();
        entity.ParentUnitId = req.ParentUnitId;
        entity.OrganizationLevelId = req.OrganizationLevelId;
        entity.WorkLocationId = req.WorkLocationId;
        entity.EstablishedDate = req.EstablishedDate;
        entity.BusinessRegistrationNumber = req.BusinessRegistrationNumber;
        entity.LicenseIssuedDate = req.LicenseIssuedDate;
        entity.LicenseIssuedPlace = req.LicenseIssuedPlace;
        entity.RepresentativeName = req.RepresentativeName;
        entity.Phone = req.Phone;
        entity.Fax = req.Fax;
        entity.Email = req.Email;
        entity.Note = req.Note;
        entity.IsActive = req.IsActive;
        await db.SaveChangesAsync(ct);

        var dto = (await ToDtosAsync(db, new[] { entity }, ct)).Single();
        return Results.Ok(dto);
    }

    private static async Task<IResult> Delete(Guid id, HrmDbContext db, CancellationToken ct)
    {
        var entity = await db.OrganizationUnits.FirstOrDefaultAsync(x => x.Id == id, ct)
            ?? throw new NotFoundException("ORGANIZATION_UNIT_NOT_FOUND", "Không tìm thấy đơn vị.");

        var hasChildren = await db.OrganizationUnits.AnyAsync(x => x.ParentUnitId == id, ct);
        if (hasChildren)
            throw new DomainException("ORGANIZATION_DELETE_BLOCKED",
                "Không thể xóa: đơn vị đang có đơn vị con.", 409);

        // Future: also block when employees reference this unit (Phase 4).

        db.OrganizationUnits.Remove(entity);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static void Validate(string code, string name, Guid orgLevelId, string? note)
    {
        if (string.IsNullOrWhiteSpace(code) || code.Length > 64)
            throw new ValidationException("Mã đơn vị bắt buộc và tối đa 64 ký tự.");
        if (string.IsNullOrWhiteSpace(name) || name.Length > 256)
            throw new ValidationException("Tên đơn vị bắt buộc và tối đa 256 ký tự.");
        if (orgLevelId == Guid.Empty)
            throw new ValidationException("Cấp tổ chức bắt buộc.");
        if (note is { Length: > 2000 })
            throw new ValidationException("Ghi chú tối đa 2000 ký tự.");
    }

    private static void ValidateDates(DateTime? established, DateTime? licenseIssued)
    {
        if (established is not null && licenseIssued is not null && licenseIssued < established)
            throw new ValidationException("Ngày cấp giấy phép không thể nhỏ hơn ngày thành lập.");
    }

    private static async Task EnsureNoCycleAsync(HrmDbContext db, Guid currentId, Guid newParentId, CancellationToken ct)
    {
        var visited = new HashSet<Guid>();
        var cursor = (Guid?)newParentId;
        while (cursor is not null)
        {
            if (cursor == currentId)
                throw new DomainException("ORGANIZATION_UNIT_HIERARCHY_CYCLE",
                    "Cấu trúc cây không hợp lệ: tạo vòng lặp.");
            if (!visited.Add(cursor.Value)) return;
            cursor = await db.OrganizationUnits
                .Where(x => x.Id == cursor)
                .Select(x => x.ParentUnitId)
                .FirstOrDefaultAsync(ct);
        }
    }

    private static async Task<List<OrganizationUnitDto>> ToDtosAsync(HrmDbContext db, IEnumerable<OrganizationUnit> entities, CancellationToken ct)
    {
        var list = entities as IList<OrganizationUnit> ?? entities.ToList();
        if (list.Count == 0) return new();

        var parentIds = list.Where(x => x.ParentUnitId.HasValue).Select(x => x.ParentUnitId!.Value).ToHashSet();
        var levelIds = list.Select(x => x.OrganizationLevelId).ToHashSet();
        var workLocIds = list.Where(x => x.WorkLocationId.HasValue).Select(x => x.WorkLocationId!.Value).ToHashSet();
        var lookupIds = levelIds.Concat(workLocIds).ToHashSet();

        var parents = parentIds.Count == 0 ? new List<OrganizationUnit>() :
            await db.OrganizationUnits.AsNoTracking()
                .Where(x => parentIds.Contains(x.Id))
                .Select(x => new OrganizationUnit { Id = x.Id, Code = x.Code, Name = x.Name })
                .ToListAsync(ct);

        var lookups = lookupIds.Count == 0 ? new List<LookupItem>() :
            await db.LookupItems.AsNoTracking()
                .Where(x => lookupIds.Contains(x.Id))
                .Select(x => new LookupItem { Id = x.Id, Code = x.Code, Name = x.Name })
                .ToListAsync(ct);

        var parentDict = parents.ToDictionary(p => p.Id, p => new OrganizationLookupRefDto(p.Id, p.Code, p.Name));
        var lookupDict = lookups.ToDictionary(l => l.Id, l => new OrganizationLookupRefDto(l.Id, l.Code, l.Name));

        return list.Select(x => new OrganizationUnitDto(
            x.Id, x.Code, x.Name,
            x.ParentUnitId,
            x.ParentUnitId is null ? null : parentDict.GetValueOrDefault(x.ParentUnitId.Value),
            x.OrganizationLevelId,
            lookupDict.GetValueOrDefault(x.OrganizationLevelId),
            x.WorkLocationId,
            x.WorkLocationId is null ? null : lookupDict.GetValueOrDefault(x.WorkLocationId.Value),
            x.EstablishedDate, x.BusinessRegistrationNumber, x.LicenseIssuedDate, x.LicenseIssuedPlace,
            x.RepresentativeName, x.Phone, x.Fax, x.Email, x.Note, x.IsActive, x.CreatedAt, x.UpdatedAt
        )).ToList();
    }
}
