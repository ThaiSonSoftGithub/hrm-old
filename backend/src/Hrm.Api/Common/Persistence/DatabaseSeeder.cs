using Hrm.Api.Features.Auth;
using Hrm.Api.Features.Authorization;
using Hrm.Api.Features.Lookups.Seeding;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Common.Persistence;

public sealed class DatabaseSeeder : IHostedService
{
    private readonly IServiceProvider _sp;
    private readonly ILogger<DatabaseSeeder> _log;
    public DatabaseSeeder(IServiceProvider sp, ILogger<DatabaseSeeder> log) { _sp = sp; _log = log; }

    public async Task StartAsync(CancellationToken ct)
    {
        try
        {
            using var scope = _sp.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<HrmDbContext>();
            await db.Database.MigrateAsync(ct);

            await scope.ServiceProvider.GetRequiredService<CategorySeeder>().SeedAsync(ct);
            await scope.ServiceProvider.GetRequiredService<SampleDataSeeder>().SeedAsync(ct);
            await scope.ServiceProvider.GetRequiredService<AdminUserSeeder>().SeedAsync(ct);
            await scope.ServiceProvider.GetRequiredService<AuthorizationSeeder>().SeedAsync(ct);
        }
        catch (Exception ex)
        {
            _log.LogError(ex, "Database seeding failed.");
            throw;
        }
    }

    public Task StopAsync(CancellationToken ct) => Task.CompletedTask;
}
