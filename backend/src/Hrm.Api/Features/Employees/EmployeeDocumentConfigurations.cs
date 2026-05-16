using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrm.Api.Features.Employees;

public sealed class EmployeeDocumentConfiguration : IEntityTypeConfiguration<EmployeeDocument>
{
    public void Configure(EntityTypeBuilder<EmployeeDocument> b)
    {
        b.ToTable("EmployeeDocuments");
        b.HasKey(x => x.Id);
        b.Property(x => x.Name).HasMaxLength(255).IsRequired();
        b.Property(x => x.Note).HasMaxLength(2000).IsRequired();
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);
        b.HasIndex(x => x.EmployeeId);
    }
}

public sealed class EmployeeDocumentFileConfiguration : IEntityTypeConfiguration<EmployeeDocumentFile>
{
    public void Configure(EntityTypeBuilder<EmployeeDocumentFile> b)
    {
        b.ToTable("EmployeeDocumentFiles");
        b.HasKey(x => x.Id);
        b.Property(x => x.FileName).HasMaxLength(256).IsRequired();
        b.Property(x => x.ContentType).HasMaxLength(128).IsRequired();
        b.Property(x => x.StoredPath).HasMaxLength(512).IsRequired();
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.HasIndex(x => x.DocumentId);
    }
}
