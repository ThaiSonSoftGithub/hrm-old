using Hrm.Api.Common.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Lookups;

public sealed class LookupCodeGenerator
{
    private readonly HrmDbContext _db;
    public LookupCodeGenerator(HrmDbContext db) => _db = db;

    public async Task<string> NextCodeAsync(LookupCategory category, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(category.CodePrefix) || category.CodePadLength is null or <= 0)
            throw new InvalidOperationException($"Category '{category.Code}' has no auto-code rule.");

        var prefix = category.CodePrefix;
        var pad = category.CodePadLength.Value;

        var maxNumeric = await _db.LookupItems
            .Where(x => x.CategoryCode == category.Code && x.Code.StartsWith(prefix))
            .Select(x => x.Code.Substring(prefix.Length))
            .ToListAsync(ct);

        var max = 0;
        foreach (var tail in maxNumeric)
        {
            if (int.TryParse(tail, out var n) && n > max) max = n;
        }
        return prefix + (max + 1).ToString(new string('0', pad));
    }
}
