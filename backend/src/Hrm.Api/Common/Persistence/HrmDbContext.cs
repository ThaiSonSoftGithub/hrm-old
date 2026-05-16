using Hrm.Api.Features.Auth;
using Hrm.Api.Features.Authorization;
using Hrm.Api.Features.Employees;
using Hrm.Api.Features.Lookups;
using Hrm.Api.Features.Organization;
using Microsoft.EntityFrameworkCore;

namespace Hrm.Api.Common.Persistence;

public sealed class HrmDbContext : DbContext
{
    public HrmDbContext(DbContextOptions<HrmDbContext> options) : base(options) { }

    public DbSet<User> Users => Set<User>();
    public DbSet<LookupCategory> LookupCategories => Set<LookupCategory>();
    public DbSet<LookupItem> LookupItems => Set<LookupItem>();
    public DbSet<OrganizationUnit> OrganizationUnits => Set<OrganizationUnit>();
    public DbSet<Employee> Employees => Set<Employee>();
    public DbSet<LaborContract> LaborContracts => Set<LaborContract>();
    public DbSet<EmployeeFamilyMember> EmployeeFamilyMembers => Set<EmployeeFamilyMember>();
    public DbSet<EmployeeDegree> EmployeeDegrees => Set<EmployeeDegree>();
    public DbSet<EmployeeCertificate> EmployeeCertificates => Set<EmployeeCertificate>();
    public DbSet<EmployeeWorkExperience> EmployeeWorkExperiences => Set<EmployeeWorkExperience>();
    public DbSet<EmployeeWorkHistory> EmployeeWorkHistories => Set<EmployeeWorkHistory>();
    public DbSet<EmployeeDocument> EmployeeDocuments => Set<EmployeeDocument>();
    public DbSet<EmployeeDocumentFile> EmployeeDocumentFiles => Set<EmployeeDocumentFile>();
    public DbSet<FunctionGroup> FunctionGroups => Set<FunctionGroup>();
    public DbSet<Screen> Screens => Set<Screen>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<RoleGroup> RoleGroups => Set<RoleGroup>();
    public DbSet<RoleGroupUser> RoleGroupUsers => Set<RoleGroupUser>();
    public DbSet<RoleGroupPermission> RoleGroupPermissions => Set<RoleGroupPermission>();
    public DbSet<FunctionGroupScreen> FunctionGroupScreens => Set<FunctionGroupScreen>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(HrmDbContext).Assembly);
        base.OnModelCreating(modelBuilder);
    }
}
