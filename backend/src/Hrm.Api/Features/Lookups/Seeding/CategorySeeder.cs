using Hrm.Api.Common.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Lookups.Seeding;

public sealed class CategorySeeder
{
    private readonly HrmDbContext _db;
    private readonly ILogger<CategorySeeder> _log;
    public CategorySeeder(HrmDbContext db, ILogger<CategorySeeder> log) { _db = db; _log = log; }

    private static readonly LookupCategory[] Defaults =
    {
        New("Country",            "Quốc gia",                 "Administrative", "QG", 5),
        New("Province",           "Tỉnh / Thành phố",         "Administrative", "TT", 5, parent: "Country"),
        New("District",           "Quận / Huyện",             "Administrative", "QH", 5, parent: "Province", ref1: "Country"),
        New("Ward",               "Phường / Xã",              "Administrative", "PX", 5, parent: "District", ref1: "Province", ref2: "Country"),
        New("Ethnicity",          "Dân tộc",                  "Personal",       "DT", 3),
        New("Religion",           "Tôn giáo",                 "Personal",       "TG", 3),
        New("MaritalStatus",      "Tình trạng hôn nhân",      "Personal"),
        New("FamilyBackground",   "Thành phần gia đình",      "Personal"),
        New("PersonalBackground", "Thành phần bản thân",      "Personal"),
        New("FamilyRelation",     "Quan hệ gia đình",         "Personal"),
        New("EducationLevel",     "Trình độ học vấn",         "Education"),
        New("TrainingPlace",      "Nơi đào tạo",              "Education"),
        New("TrainingFaculty",    "Khoa đào tạo",             "Education", parent: "TrainingPlace"),
        New("TrainingMajor",      "Chuyên ngành đào tạo",     "Education", parent: "TrainingFaculty", ref1: "TrainingPlace"),
        New("TrainingMode",       "Hình thức đào tạo",        "Education"),
        New("DegreeRank",         "Xếp loại bằng cấp",        "Education"),
        New("CertificateType",    "Loại chứng chỉ",           "Education"),
        New("CertificateRank",    "Xếp loại chứng chỉ",       "Education"),
        New("Bank",               "Ngân hàng",                "Bank"),
        New("BankBranch",         "Chi nhánh ngân hàng",      "Bank", parent: "Bank"),
        New("ContractType",       "Loại hợp đồng",            "Labor"),
        New("JobPosition",        "Vị trí công việc",         "Labor", ref1: "JobTitle"),
        New("JobTitle",           "Chức danh",                "Labor"),
        New("WorkingStatus",      "Trạng thái làm việc",      "Labor"),
        New("WorkingForm",        "Hình thức làm việc",       "Labor"),
        New("OrganizationLevel",  "Cấp tổ chức",              "Organization"),
        New("WorkLocation",       "Địa điểm làm việc",        "Organization")
    };

    private static LookupCategory New(
        string code, string name, string group,
        string? prefix = null, int? padLength = null,
        string? parent = null, string? ref1 = null, string? ref2 = null) =>
        new()
        {
            Code = code,
            Name = name,
            Group = group,
            CodePrefix = prefix,
            CodePadLength = padLength,
            ParentCategoryCode = parent,
            Ref1CategoryCode = ref1,
            Ref2CategoryCode = ref2,
            IsSystem = true
        };

    public async Task SeedAsync(CancellationToken ct)
    {
        var existing = await _db.LookupCategories.ToDictionaryAsync(c => c.Code, ct);
        var added = 0;
        var updated = 0;
        foreach (var def in Defaults)
        {
            if (existing.TryGetValue(def.Code, out var current))
            {
                if (current.Name != def.Name || current.Group != def.Group ||
                    current.CodePrefix != def.CodePrefix || current.CodePadLength != def.CodePadLength ||
                    current.ParentCategoryCode != def.ParentCategoryCode ||
                    current.Ref1CategoryCode != def.Ref1CategoryCode ||
                    current.Ref2CategoryCode != def.Ref2CategoryCode)
                {
                    current.Name = def.Name;
                    current.Group = def.Group;
                    current.CodePrefix = def.CodePrefix;
                    current.CodePadLength = def.CodePadLength;
                    current.ParentCategoryCode = def.ParentCategoryCode;
                    current.Ref1CategoryCode = def.Ref1CategoryCode;
                    current.Ref2CategoryCode = def.Ref2CategoryCode;
                    updated++;
                }
            }
            else
            {
                _db.LookupCategories.Add(def);
                added++;
            }
        }
        if (added > 0 || updated > 0) await _db.SaveChangesAsync(ct);
        _log.LogInformation("Categories seeded. added={Added} updated={Updated}", added, updated);
    }
}
