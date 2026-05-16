using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrm.Api.Features.Authorization;

public sealed class FunctionGroupConfiguration : IEntityTypeConfiguration<FunctionGroup>
{
    public void Configure(EntityTypeBuilder<FunctionGroup> b)
    {
        b.ToTable("FunctionGroups");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(64).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Name).HasMaxLength(256).IsRequired();
        b.Property(x => x.Note).HasMaxLength(2000);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);
    }
}

public sealed class ScreenConfiguration : IEntityTypeConfiguration<Screen>
{
    public void Configure(EntityTypeBuilder<Screen> b)
    {
        b.ToTable("Screens");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(64).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Name).HasMaxLength(256).IsRequired();
        b.Property(x => x.Note).HasMaxLength(2000);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);

        b.HasIndex(x => x.FunctionGroupId);
        b.HasOne(x => x.FunctionGroup)
            .WithMany()
            .HasForeignKey(x => x.FunctionGroupId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class PermissionConfiguration : IEntityTypeConfiguration<Permission>
{
    public void Configure(EntityTypeBuilder<Permission> b)
    {
        b.ToTable("Permissions");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(128).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Note).HasMaxLength(2000);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);

        b.HasIndex(x => x.FunctionGroupId);
        b.HasIndex(x => x.ScreenId);
        b.HasOne(x => x.FunctionGroup)
            .WithMany()
            .HasForeignKey(x => x.FunctionGroupId)
            .OnDelete(DeleteBehavior.Restrict);
        b.HasOne(x => x.Screen)
            .WithMany()
            .HasForeignKey(x => x.ScreenId)
            .OnDelete(DeleteBehavior.Restrict);
    }
}

public sealed class RoleGroupConfiguration : IEntityTypeConfiguration<RoleGroup>
{
    public void Configure(EntityTypeBuilder<RoleGroup> b)
    {
        b.ToTable("RoleGroups");
        b.HasKey(x => x.Id);
        b.Property(x => x.Code).HasMaxLength(64).IsRequired();
        b.HasIndex(x => x.Code).IsUnique();
        b.Property(x => x.Name).HasMaxLength(256).IsRequired();
        b.Property(x => x.Note).HasMaxLength(2000);
        b.Property(x => x.IsActive).HasDefaultValue(true);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);
    }
}

public sealed class RoleGroupUserConfiguration : IEntityTypeConfiguration<RoleGroupUser>
{
    public void Configure(EntityTypeBuilder<RoleGroupUser> b)
    {
        b.ToTable("RoleGroupUsers");
        b.HasKey(x => new { x.RoleGroupId, x.UserId });
        b.HasIndex(x => x.UserId);
    }
}

public sealed class RoleGroupPermissionConfiguration : IEntityTypeConfiguration<RoleGroupPermission>
{
    public void Configure(EntityTypeBuilder<RoleGroupPermission> b)
    {
        b.ToTable("RoleGroupPermissions");
        b.HasKey(x => new { x.RoleGroupId, x.PermissionId });
        b.HasIndex(x => x.PermissionId);
    }
}

public sealed class FunctionGroupScreenConfiguration : IEntityTypeConfiguration<FunctionGroupScreen>
{
    public void Configure(EntityTypeBuilder<FunctionGroupScreen> b)
    {
        b.ToTable("FunctionGroupScreens");
        b.HasKey(x => new { x.FunctionGroupId, x.ScreenId });
        b.HasIndex(x => x.ScreenId);
    }
}
