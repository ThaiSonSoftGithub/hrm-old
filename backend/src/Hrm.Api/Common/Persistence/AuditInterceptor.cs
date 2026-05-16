using Hrm.Api.Common.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Microsoft.EntityFrameworkCore.Diagnostics;

namespace Hrm.Api.Common.Persistence;

public sealed class AuditInterceptor : SaveChangesInterceptor
{
    private readonly ICurrentUser _currentUser;
    public AuditInterceptor(ICurrentUser currentUser) => _currentUser = currentUser;

    public override ValueTask<InterceptionResult<int>> SavingChangesAsync(
        DbContextEventData eventData, InterceptionResult<int> result, CancellationToken ct = default)
    {
        if (eventData.Context is not null)
        {
            var now = DateTime.UtcNow;
            var who = _currentUser.Username ?? "system";
            foreach (EntityEntry<EntityBase> entry in eventData.Context.ChangeTracker.Entries<EntityBase>())
            {
                if (entry.State == EntityState.Added)
                {
                    entry.Entity.CreatedAt = now;
                    entry.Entity.CreatedBy = who;
                }
                else if (entry.State == EntityState.Modified)
                {
                    entry.Entity.UpdatedAt = now;
                    entry.Entity.UpdatedBy = who;
                }
            }
        }
        return base.SavingChangesAsync(eventData, result, ct);
    }
}
