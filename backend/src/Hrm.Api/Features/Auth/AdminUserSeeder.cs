using Hrm.Api.Common.Auth;
using Hrm.Api.Common.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Auth;

public sealed class AdminUserSeeder
{
    private readonly HrmDbContext _db;
    private readonly IPasswordHasher _hasher;
    private readonly IConfiguration _config;
    private readonly ILogger<AdminUserSeeder> _log;

    public AdminUserSeeder(HrmDbContext db, IPasswordHasher hasher, IConfiguration config, ILogger<AdminUserSeeder> log)
    {
        _db = db; _hasher = hasher; _config = config; _log = log;
    }

    public async Task SeedAsync(CancellationToken ct)
    {
        var section = _config.GetSection("SeedAdmin");
        var username = section["Username"] ?? "admin";
        var displayName = section["DisplayName"] ?? "System Administrator";
        var password = section["Password"];

        if (string.IsNullOrWhiteSpace(password))
        {
            _log.LogWarning("SeedAdmin:Password not configured; skipping admin seed.");
            return;
        }

        var exists = await _db.Users.AnyAsync(u => u.Username == username, ct);
        if (exists) return;

        _db.Users.Add(new User
        {
            Username = username,
            DisplayName = displayName,
            PasswordHash = _hasher.Hash(password),
            Status = "Active"
        });
        await _db.SaveChangesAsync(ct);
        _log.LogInformation("Seeded admin user '{Username}'.", username);
    }
}
