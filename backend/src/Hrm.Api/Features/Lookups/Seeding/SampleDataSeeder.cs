using Hrm.Api.Common.Persistence;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Features.Lookups.Seeding;

public sealed class SampleDataSeeder
{
    private readonly HrmDbContext _db;
    private readonly ILogger<SampleDataSeeder> _log;
    public SampleDataSeeder(HrmDbContext db, ILogger<SampleDataSeeder> log) { _db = db; _log = log; }

    private static readonly (string Code, string Name)[] Countries =
    {
        ("QG00001","Việt Nam"),("QG00002","Lào"),("QG00003","Campuchia"),
        ("QG00004","Thái Lan"),("QG00005","Trung Quốc"),("QG00006","Singapore"),
        ("QG00007","Nhật Bản"),("QG00008","Hàn Quốc"),("QG00009","Hoa Kỳ"),("QG00010","Anh Quốc")
    };

    private static readonly string[] ProvinceNames =
    {
        "Hà Nội","Hồ Chí Minh","Đà Nẵng","Hải Phòng","Cần Thơ","An Giang","Bà Rịa - Vũng Tàu",
        "Bạc Liêu","Bắc Giang","Bắc Kạn","Bắc Ninh","Bến Tre","Bình Dương","Bình Định",
        "Bình Phước","Bình Thuận","Cà Mau","Cao Bằng","Đắk Lắk","Đắk Nông","Điện Biên",
        "Đồng Nai","Đồng Tháp","Gia Lai","Hà Giang","Hà Nam","Hà Tĩnh","Hải Dương",
        "Hậu Giang","Hòa Bình","Hưng Yên","Khánh Hòa","Kiên Giang","Kon Tum","Lai Châu",
        "Lâm Đồng","Lạng Sơn","Lào Cai","Long An","Nam Định","Nghệ An","Ninh Bình",
        "Ninh Thuận","Phú Thọ","Phú Yên","Quảng Bình","Quảng Nam","Quảng Ngãi","Quảng Ninh",
        "Quảng Trị","Sóc Trăng","Sơn La","Tây Ninh","Thái Bình","Thái Nguyên","Thanh Hóa",
        "Thừa Thiên Huế","Tiền Giang","Trà Vinh","Tuyên Quang","Vĩnh Long","Vĩnh Phúc","Yên Bái"
    };

    public async Task SeedAsync(CancellationToken ct)
    {
        await SeedCountriesAsync(ct);
        await SeedProvincesAsync(ct);
        await SeedFlatAsync("OrganizationLevel", new[]
        {
            "Công ty", "Chi nhánh", "Trung tâm", "Phòng ban", "Tổ", "Nhóm"
        }, ct);
        await SeedFlatAsync("WorkLocation", new[]
        {
            "Trụ sở chính", "Văn phòng Hà Nội", "Văn phòng TP.HCM"
        }, ct);
        await SeedFlatAsync("JobTitle", new[]
        {
            "Nhân viên", "Chuyên viên", "Trưởng nhóm", "Phó phòng",
            "Trưởng phòng", "Giám đốc", "Phó tổng giám đốc", "Tổng giám đốc"
        }, ct);
        await SeedFlatAsync("JobPosition", new[]
        {
            "Chuyên viên nhân sự", "Chuyên viên tuyển dụng", "Chuyên viên C&B",
            "Chuyên viên IT", "Lập trình viên Backend", "Lập trình viên Frontend",
            "Kế toán tổng hợp", "Kế toán thanh toán",
            "Nhân viên kinh doanh", "Trợ lý giám đốc"
        }, ct);
        await SeedFlatAsync("WorkingStatus", new[]
        {
            "Đang làm việc", "Thử việc", "Tập sự", "Nghỉ thai sản",
            "Tạm hoãn HĐLĐ", "Đã nghỉ việc"
        }, ct);
        await SeedFlatAsync("WorkingForm", new[]
        {
            "Toàn thời gian", "Bán thời gian", "Cộng tác viên", "Thực tập sinh"
        }, ct);
        await SeedFlatAsync("ContractType", new[]
        {
            "Hợp đồng thử việc", "Hợp đồng xác định thời hạn 12 tháng",
            "Hợp đồng xác định thời hạn 36 tháng", "Hợp đồng không xác định thời hạn",
            "Hợp đồng cộng tác viên"
        }, ct);
        await SeedFlatAsync("Ethnicity", new[]
        {
            "Kinh", "Tày", "Thái", "Mường", "Hoa", "Khmer", "Nùng", "H'Mông", "Dao", "Khác"
        }, ct);
        await SeedFlatAsync("Religion", new[]
        {
            "Không", "Phật giáo", "Công giáo", "Tin lành", "Cao Đài", "Hòa Hảo", "Hồi giáo"
        }, ct);
        await SeedFlatAsync("MaritalStatus", new[]
        {
            "Độc thân", "Đã kết hôn", "Đã ly hôn", "Góa"
        }, ct);
        await SeedFlatAsync("FamilyRelation", new[]
        {
            "Bố", "Mẹ", "Vợ/Chồng", "Con", "Anh", "Chị", "Em", "Ông", "Bà"
        }, ct);
        await SeedFlatAsync("FamilyBackground", new[]
        {
            "Cán bộ công nhân viên", "Nông dân", "Công nhân", "Trí thức", "Tiểu thương"
        }, ct);
        await SeedFlatAsync("PersonalBackground", new[]
        {
            "Cán bộ", "Công nhân", "Sinh viên", "Học sinh", "Khác"
        }, ct);
        await SeedFlatAsync("EducationLevel", new[]
        {
            "12/12", "Sơ cấp", "Trung cấp", "Cao đẳng", "Đại học", "Thạc sĩ", "Tiến sĩ"
        }, ct);
        await SeedFlatAsync("DegreeRank", new[]
        {
            "Trung bình", "Trung bình khá", "Khá", "Giỏi", "Xuất sắc"
        }, ct);
        await SeedFlatAsync("TrainingMode", new[]
        {
            "Chính quy", "Tại chức", "Liên thông", "Văn bằng 2", "Từ xa"
        }, ct);
        await SeedBanksAsync(ct);
    }

    private static readonly (string Code, string Name, string[] Branches)[] Banks =
    {
        ("VCB", "Vietcombank", new[] { "Chi nhánh Hà Nội", "Chi nhánh Hồ Chí Minh", "Chi nhánh Đà Nẵng", "Chi nhánh Hai Bà Trưng" }),
        ("BIDV", "BIDV", new[] { "Chi nhánh Hà Nội", "Chi nhánh Hồ Chí Minh", "Chi nhánh Hà Thành" }),
        ("VTB", "VietinBank", new[] { "Chi nhánh Hà Nội", "Chi nhánh Hồ Chí Minh", "Chi nhánh Đống Đa" }),
        ("ACB", "ACB", new[] { "Chi nhánh Hà Nội", "Chi nhánh Hồ Chí Minh" }),
        ("TCB", "Techcombank", new[] { "Chi nhánh Hà Nội", "Chi nhánh Hồ Chí Minh", "Chi nhánh Cầu Giấy" }),
        ("MB", "MB Bank", new[] { "Chi nhánh Hà Nội", "Chi nhánh Hồ Chí Minh" }),
        ("VPB", "VPBank", new[] { "Chi nhánh Hà Nội", "Chi nhánh Hồ Chí Minh" }),
        ("TPB", "TPBank", new[] { "Chi nhánh Hà Nội" }),
    };

    private async Task SeedBanksAsync(CancellationToken ct)
    {
        var existingBanks = await _db.LookupItems
            .Where(x => x.CategoryCode == "Bank")
            .ToDictionaryAsync(x => x.Code, ct);

        var sortBank = 1;
        foreach (var (code, name, _) in Banks)
        {
            if (existingBanks.ContainsKey(code)) { sortBank++; continue; }
            var b = new LookupItem
            {
                CategoryCode = "Bank", Code = code, Name = name,
                IsActive = true, SortOrder = sortBank++,
            };
            _db.LookupItems.Add(b);
            existingBanks[code] = b;
        }
        await _db.SaveChangesAsync(ct);

        var existingBranches = await _db.LookupItems
            .Where(x => x.CategoryCode == "BankBranch")
            .Select(x => x.Code)
            .ToListAsync(ct);
        var branchSet = existingBranches.ToHashSet();

        foreach (var (code, _, branches) in Banks)
        {
            var bank = existingBanks[code];
            for (var i = 0; i < branches.Length; i++)
            {
                var branchCode = $"{code}-{(i + 1).ToString("D2")}";
                if (branchSet.Contains(branchCode)) continue;
                _db.LookupItems.Add(new LookupItem
                {
                    CategoryCode = "BankBranch",
                    Code = branchCode, Name = branches[i],
                    ParentItemId = bank.Id,
                    IsActive = true, SortOrder = i + 1,
                });
            }
        }
        await _db.SaveChangesAsync(ct);
    }

    private async Task SeedFlatAsync(string categoryCode, string[] names, CancellationToken ct)
    {
        var existing = await _db.LookupItems
            .Where(x => x.CategoryCode == categoryCode)
            .Select(x => x.Code)
            .ToListAsync(ct);
        var set = existing.ToHashSet();
        for (var i = 0; i < names.Length; i++)
        {
            var code = $"{categoryCode}-{(i + 1).ToString("D3")}";
            if (set.Contains(code)) continue;
            _db.LookupItems.Add(new LookupItem
            {
                CategoryCode = categoryCode,
                Code = code,
                Name = names[i],
                IsActive = true,
                SortOrder = i + 1
            });
        }
        await _db.SaveChangesAsync(ct);
    }

    private async Task SeedCountriesAsync(CancellationToken ct)
    {
        var existing = await _db.LookupItems
            .Where(x => x.CategoryCode == "Country")
            .Select(x => x.Code)
            .ToListAsync(ct);
        var set = existing.ToHashSet();
        var sortOrder = 1;
        foreach (var c in Countries)
        {
            if (set.Contains(c.Code)) { sortOrder++; continue; }
            _db.LookupItems.Add(new LookupItem
            {
                CategoryCode = "Country",
                Code = c.Code,
                Name = c.Name,
                IsActive = true,
                SortOrder = sortOrder++
            });
        }
        await _db.SaveChangesAsync(ct);
    }

    private async Task SeedProvincesAsync(CancellationToken ct)
    {
        var vn = await _db.LookupItems.FirstOrDefaultAsync(
            x => x.CategoryCode == "Country" && x.Code == "QG00001", ct);
        if (vn is null) { _log.LogWarning("Country QG00001 not found; skipping province seed."); return; }

        var existing = await _db.LookupItems
            .Where(x => x.CategoryCode == "Province")
            .Select(x => x.Code)
            .ToListAsync(ct);
        var set = existing.ToHashSet();

        var sortOrder = 1;
        for (var i = 0; i < ProvinceNames.Length; i++)
        {
            var code = $"TT{(i + 1).ToString("D5")}";
            if (set.Contains(code)) { sortOrder++; continue; }
            _db.LookupItems.Add(new LookupItem
            {
                CategoryCode = "Province",
                Code = code,
                Name = ProvinceNames[i],
                IsActive = true,
                SortOrder = sortOrder++,
                ParentItemId = vn.Id
            });
        }
        await _db.SaveChangesAsync(ct);
    }
}
