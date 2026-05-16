using Hrm.Api.Common.Errors;
using Hrm.Api.Common.Persistence;
using Hrm.Api.Features.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Employees;

/// <summary>
/// Tab 18 — quản lý hồ sơ tài liệu của 1 nhân viên + multi-file attachment.
/// File lưu trên disk dưới root "storage/employee-documents/{employeeId}/{guid}.{ext}".
/// </summary>
public static class EmployeeDocumentEndpoints
{
    private const long MaxFileBytes = 50L * 1024 * 1024; // 50MB
    private const int MaxFilesPerUpload = 20;

    public static IEndpointRouteBuilder MapEmployeeDocumentEndpoints(this IEndpointRouteBuilder routes)
    {
        var group = routes.MapGroup("/api/employees/{employeeId:guid}/documents").RequireAuthorization();

        group.MapGet("/", List).RequirePermission(AuthPermissions.EmpView);
        group.MapPost("/", Create).RequirePermission(AuthPermissions.EmpEdit).DisableAntiforgery();
        group.MapPut("/{documentId:guid}", Update).RequirePermission(AuthPermissions.EmpEdit);
        group.MapDelete("/{documentId:guid}", Delete).RequirePermission(AuthPermissions.EmpEdit);
        group.MapGet("/{documentId:guid}/files", ListFiles).RequirePermission(AuthPermissions.EmpView);
        group.MapPost("/{documentId:guid}/files", UploadFiles).RequirePermission(AuthPermissions.EmpEdit).DisableAntiforgery();
        group.MapGet("/{documentId:guid}/files/{fileId:guid}/download", DownloadFile).RequirePermission(AuthPermissions.EmpView);
        group.MapDelete("/{documentId:guid}/files/{fileId:guid}", DeleteFile).RequirePermission(AuthPermissions.EmpEdit);

        return routes;
    }

    private static string StorageRoot(IWebHostEnvironment env) =>
        Path.Combine(env.ContentRootPath, "storage");

    // ----------------------------------------------------------------- handlers

    private static async Task<IResult> List(Guid employeeId, HrmDbContext db, CancellationToken ct)
    {
        await EnsureEmployeeAsync(db, employeeId, ct);
        var docs = await db.Set<EmployeeDocument>().AsNoTracking()
            .Where(x => x.EmployeeId == employeeId)
            .OrderByDescending(x => x.CreatedAt)
            .ToListAsync(ct);
        var docIds = docs.Select(d => d.Id).ToList();
        var fileCounts = await db.Set<EmployeeDocumentFile>().AsNoTracking()
            .Where(f => docIds.Contains(f.DocumentId))
            .GroupBy(f => f.DocumentId)
            .Select(g => new { DocumentId = g.Key, Count = g.Count(), TotalBytes = g.Sum(x => x.SizeBytes) })
            .ToDictionaryAsync(x => x.DocumentId, ct);

        var items = docs.Select(d =>
        {
            var info = fileCounts.GetValueOrDefault(d.Id);
            return new EmployeeDocumentDto(
                d.Id, d.EmployeeId, d.Name, d.Note,
                info?.Count ?? 0, info?.TotalBytes ?? 0,
                info != null && info.Count > 0,
                d.SubmittedAt ?? d.CreatedAt,
                d.CreatedAt, d.UpdatedAt);
        }).ToList();
        return Results.Ok(items);
    }

    private static async Task<IResult> Create(
        Guid employeeId,
        HttpContext httpContext,
        HrmDbContext db,
        IWebHostEnvironment env,
        CancellationToken ct)
    {
        await EnsureEmployeeAsync(db, employeeId, ct);
        if (!httpContext.Request.HasFormContentType)
            throw new DomainException("EMPLOYEE_DOCUMENT_FORM_REQUIRED", "Yêu cầu multipart/form-data.");

        var form = await httpContext.Request.ReadFormAsync(ct);
        var name = form["name"].ToString().Trim();
        var note = form["note"].ToString().Trim();
        ValidateName(name); ValidateNote(note);

        var files = form.Files.ToList();
        if (files.Count == 0)
            throw new DomainException("EMPLOYEE_DOCUMENT_ATTACHMENT_REQUIRED", "Cần ít nhất 1 file đính kèm.");
        ValidateFiles(files);

        var doc = new EmployeeDocument
        {
            EmployeeId = employeeId, Name = name, Note = note,
            SubmittedAt = DateTime.UtcNow,
        };
        db.Add(doc);
        await db.SaveChangesAsync(ct);

        await SaveFilesAsync(db, env, doc, files, ct);
        await db.SaveChangesAsync(ct);

        return Results.Created($"/api/employees/{employeeId}/documents/{doc.Id}", await GetDtoAsync(db, doc, ct));
    }

    private static async Task<IResult> Update(
        Guid employeeId, Guid documentId,
        [FromBody] UpdateDocumentRequest req,
        HrmDbContext db,
        CancellationToken ct)
    {
        var doc = await db.Set<EmployeeDocument>().FirstOrDefaultAsync(x => x.Id == documentId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_DOCUMENT_NOT_FOUND", "Không tìm thấy tài liệu.");

        ValidateName(req.Name); ValidateNote(req.Note);
        doc.Name = req.Name.Trim();
        doc.Note = req.Note.Trim();
        await db.SaveChangesAsync(ct);
        return Results.Ok(await GetDtoAsync(db, doc, ct));
    }

    private static async Task<IResult> Delete(
        Guid employeeId, Guid documentId,
        HrmDbContext db,
        IWebHostEnvironment env,
        CancellationToken ct)
    {
        var doc = await db.Set<EmployeeDocument>().FirstOrDefaultAsync(x => x.Id == documentId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_DOCUMENT_NOT_FOUND", "Không tìm thấy tài liệu.");
        var files = await db.Set<EmployeeDocumentFile>().Where(f => f.DocumentId == documentId).ToListAsync(ct);
        var root = StorageRoot(env);
        foreach (var f in files) TryDeletePhysicalFile(root, f.StoredPath);
        db.RemoveRange(files);
        db.Remove(doc);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    private static async Task<IResult> ListFiles(Guid employeeId, Guid documentId, HrmDbContext db, CancellationToken ct)
    {
        await EnsureDocumentAsync(db, employeeId, documentId, ct);
        var files = await db.Set<EmployeeDocumentFile>().AsNoTracking()
            .Where(f => f.DocumentId == documentId)
            .OrderByDescending(f => f.CreatedAt)
            .Select(f => new EmployeeDocumentFileDto(
                f.Id, f.DocumentId, f.FileName, f.ContentType, f.SizeBytes,
                f.CreatedAt, f.CreatedBy))
            .ToListAsync(ct);
        return Results.Ok(files);
    }

    private static async Task<IResult> UploadFiles(
        Guid employeeId, Guid documentId,
        HttpContext httpContext,
        HrmDbContext db,
        IWebHostEnvironment env,
        CancellationToken ct)
    {
        var doc = await db.Set<EmployeeDocument>().FirstOrDefaultAsync(x => x.Id == documentId && x.EmployeeId == employeeId, ct)
            ?? throw new NotFoundException("EMPLOYEE_DOCUMENT_NOT_FOUND", "Không tìm thấy tài liệu.");
        if (!httpContext.Request.HasFormContentType)
            throw new DomainException("EMPLOYEE_DOCUMENT_FORM_REQUIRED", "Yêu cầu multipart/form-data.");
        var files = (await httpContext.Request.ReadFormAsync(ct)).Files.ToList();
        if (files.Count == 0)
            throw new DomainException("EMPLOYEE_DOCUMENT_ATTACHMENT_REQUIRED", "Không có file nào.");
        ValidateFiles(files);

        await SaveFilesAsync(db, env, doc, files, ct);
        await db.SaveChangesAsync(ct);

        return Results.Ok(await GetDtoAsync(db, doc, ct));
    }

    private static async Task<IResult> DownloadFile(
        Guid employeeId, Guid documentId, Guid fileId,
        HrmDbContext db,
        IWebHostEnvironment env,
        CancellationToken ct)
    {
        await EnsureDocumentAsync(db, employeeId, documentId, ct);
        var file = await db.Set<EmployeeDocumentFile>().AsNoTracking()
            .FirstOrDefaultAsync(f => f.Id == fileId && f.DocumentId == documentId, ct)
            ?? throw new NotFoundException("EMPLOYEE_DOCUMENT_FILE_NOT_FOUND", "Không tìm thấy file.");
        var fullPath = Path.Combine(StorageRoot(env), file.StoredPath);
        if (!File.Exists(fullPath))
            throw new NotFoundException("EMPLOYEE_DOCUMENT_FILE_NOT_FOUND", "File vật lý không tồn tại.");
        return Results.File(fullPath, file.ContentType, file.FileName);
    }

    private static async Task<IResult> DeleteFile(
        Guid employeeId, Guid documentId, Guid fileId,
        HrmDbContext db,
        IWebHostEnvironment env,
        CancellationToken ct)
    {
        await EnsureDocumentAsync(db, employeeId, documentId, ct);
        var file = await db.Set<EmployeeDocumentFile>().FirstOrDefaultAsync(f => f.Id == fileId && f.DocumentId == documentId, ct)
            ?? throw new NotFoundException("EMPLOYEE_DOCUMENT_FILE_NOT_FOUND", "Không tìm thấy file.");
        TryDeletePhysicalFile(StorageRoot(env), file.StoredPath);
        db.Remove(file);
        await db.SaveChangesAsync(ct);
        return Results.NoContent();
    }

    // ----------------------------------------------------------------- helpers

    private static async Task EnsureEmployeeAsync(HrmDbContext db, Guid id, CancellationToken ct)
    {
        if (!await db.Employees.AsNoTracking().AnyAsync(x => x.Id == id, ct))
            throw new NotFoundException("EMPLOYEE_PROFILE_NOT_FOUND", "Không tìm thấy hồ sơ nhân viên.");
    }

    private static async Task EnsureDocumentAsync(HrmDbContext db, Guid employeeId, Guid documentId, CancellationToken ct)
    {
        if (!await db.Set<EmployeeDocument>().AsNoTracking().AnyAsync(x => x.Id == documentId && x.EmployeeId == employeeId, ct))
            throw new NotFoundException("EMPLOYEE_DOCUMENT_NOT_FOUND", "Không tìm thấy tài liệu.");
    }

    private static void ValidateName(string? name)
    {
        if (string.IsNullOrWhiteSpace(name) || name.Length > 255)
            throw new DomainException("EMPLOYEE_DOCUMENT_NAME_REQUIRED", "Tên tài liệu bắt buộc, tối đa 255 ký tự.");
    }

    private static void ValidateNote(string? note)
    {
        if (string.IsNullOrWhiteSpace(note) || note.Length > 2000)
            throw new DomainException("EMPLOYEE_DOCUMENT_NOTE_REQUIRED", "Ghi chú bắt buộc, tối đa 2000 ký tự.");
    }

    private static void ValidateFiles(IReadOnlyCollection<IFormFile> files)
    {
        if (files.Count > MaxFilesPerUpload)
            throw new DomainException("EMPLOYEE_DOCUMENT_FILE_TOO_MANY", $"Tối đa {MaxFilesPerUpload} file mỗi lượt upload.");
        foreach (var f in files)
        {
            if (f.Length <= 0)
                throw new DomainException("EMPLOYEE_DOCUMENT_FILE_EMPTY", $"File '{f.FileName}' rỗng.");
            if (f.Length > MaxFileBytes)
                throw new DomainException("EMPLOYEE_DOCUMENT_FILE_TOO_LARGE", $"File '{f.FileName}' vượt 50MB.");
        }
    }

    private static async Task SaveFilesAsync(HrmDbContext db, IWebHostEnvironment env,
        EmployeeDocument doc, IReadOnlyCollection<IFormFile> files, CancellationToken ct)
    {
        var root = StorageRoot(env);
        var folder = Path.Combine(root, "employee-documents", doc.EmployeeId.ToString());
        Directory.CreateDirectory(folder);

        foreach (var f in files)
        {
            var ext = Path.GetExtension(f.FileName);
            var fileGuid = Guid.NewGuid();
            var stored = Path.Combine("employee-documents", doc.EmployeeId.ToString(), $"{fileGuid}{ext}");
            var fullPath = Path.Combine(root, stored);

            await using (var fs = File.Create(fullPath))
                await f.CopyToAsync(fs, ct);

            db.Add(new EmployeeDocumentFile
            {
                Id = fileGuid,
                DocumentId = doc.Id,
                FileName = Path.GetFileName(f.FileName),
                ContentType = string.IsNullOrWhiteSpace(f.ContentType) ? "application/octet-stream" : f.ContentType,
                SizeBytes = f.Length,
                StoredPath = stored.Replace('\\', '/'),
            });
        }
    }

    private static void TryDeletePhysicalFile(string root, string storedPath)
    {
        try
        {
            var full = Path.Combine(root, storedPath);
            if (File.Exists(full)) File.Delete(full);
        }
        catch { /* best effort */ }
    }

    private static async Task<EmployeeDocumentDto> GetDtoAsync(HrmDbContext db, EmployeeDocument doc, CancellationToken ct)
    {
        var info = await db.Set<EmployeeDocumentFile>().AsNoTracking()
            .Where(f => f.DocumentId == doc.Id)
            .GroupBy(f => 1)
            .Select(g => new { Count = g.Count(), TotalBytes = g.Sum(x => x.SizeBytes) })
            .FirstOrDefaultAsync(ct);
        return new EmployeeDocumentDto(
            doc.Id, doc.EmployeeId, doc.Name, doc.Note,
            info?.Count ?? 0, info?.TotalBytes ?? 0,
            info != null && info.Count > 0,
            doc.SubmittedAt ?? doc.CreatedAt,
            doc.CreatedAt, doc.UpdatedAt);
    }
}

public sealed record EmployeeDocumentDto(
    Guid Id, Guid EmployeeId,
    string Name, string Note,
    int FileCount, long TotalBytes, bool IsSubmitted,
    DateTime SubmittedAt,
    DateTime CreatedAt, DateTime? UpdatedAt);

public sealed record EmployeeDocumentFileDto(
    Guid Id, Guid DocumentId,
    string FileName, string ContentType, long SizeBytes,
    DateTime UploadedAt, string? UploadedBy);

public sealed record UpdateDocumentRequest(string Name, string Note);
