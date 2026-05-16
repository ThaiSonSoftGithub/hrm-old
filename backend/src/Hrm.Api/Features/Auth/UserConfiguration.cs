using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Hrm.Api.Features.Auth;

public sealed class UserConfiguration : IEntityTypeConfiguration<User>
{
    public void Configure(EntityTypeBuilder<User> b)
    {
        b.ToTable("Users");
        b.HasKey(x => x.Id);
        b.Property(x => x.Username).HasMaxLength(64).IsRequired();
        b.HasIndex(x => x.Username).IsUnique();
        b.Property(x => x.PasswordHash).HasMaxLength(256).IsRequired();
        b.Property(x => x.DisplayName).HasMaxLength(128).IsRequired();
        b.Property(x => x.Email).HasMaxLength(256);
        b.HasIndex(x => x.Email).IsUnique().HasFilter("[Email] IS NOT NULL");
        b.Property(x => x.Status).HasMaxLength(16).HasDefaultValue("Active").IsRequired();
        b.Property(x => x.RefreshTokenHash).HasMaxLength(256);
        b.Property(x => x.CreatedBy).HasMaxLength(64);
        b.Property(x => x.UpdatedBy).HasMaxLength(64);
    }
}
