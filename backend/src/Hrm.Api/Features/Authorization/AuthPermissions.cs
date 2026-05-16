namespace Hrm.Api.Features.Authorization;

/// <summary>
/// Mã quyền chuẩn module-level dùng cho guard middleware.
/// </summary>
public static class AuthPermissions
{
    // Master Data (lookups)
    public const string MdView = "MD.VIEW";
    public const string MdCreate = "MD.CREATE";
    public const string MdEdit = "MD.EDIT";
    public const string MdDelete = "MD.DELETE";

    // Organization Structure
    public const string OrgView = "ORG.VIEW";
    public const string OrgCreate = "ORG.CREATE";
    public const string OrgEdit = "ORG.EDIT";
    public const string OrgDelete = "ORG.DELETE";

    // Employee Profile (Phase 4 placeholder)
    public const string EmpView = "EMP.VIEW";
    public const string EmpCreate = "EMP.CREATE";
    public const string EmpEdit = "EMP.EDIT";
    public const string EmpDelete = "EMP.DELETE";

    // Authorization
    public const string AuthView = "AUTH.VIEW";
    public const string AuthCreate = "AUTH.CREATE";
    public const string AuthEdit = "AUTH.EDIT";
    public const string AuthDelete = "AUTH.DELETE";
    public const string AuthAssign = "AUTH.ASSIGN";

    // User management
    public const string UserView = "USER.VIEW";
    public const string UserCreate = "USER.CREATE";
    public const string UserEdit = "USER.EDIT";
    public const string UserDelete = "USER.DELETE";
    public const string UserResetPassword = "USER.RESET_PASSWORD";
    public const string UserLock = "USER.LOCK";

    public const string SystemAdminRoleCode = "SYSTEM_ADMIN";
    public const string HrAdminRoleCode = "HR_ADMIN";
    public const string EmployeeRoleCode = "EMPLOYEE";

    public static readonly string[] AllForSystemAdmin =
    {
        MdView, MdCreate, MdEdit, MdDelete,
        OrgView, OrgCreate, OrgEdit, OrgDelete,
        EmpView, EmpCreate, EmpEdit, EmpDelete,
        AuthView, AuthCreate, AuthEdit, AuthDelete, AuthAssign,
        UserView, UserCreate, UserEdit, UserDelete, UserResetPassword, UserLock
    };

    public static readonly string[] AllForHrAdmin =
    {
        MdView, MdCreate, MdEdit, MdDelete,
        OrgView, OrgCreate, OrgEdit, OrgDelete,
        EmpView, EmpCreate, EmpEdit, EmpDelete,
        AuthView, UserView
    };

    public static readonly string[] AllForEmployee =
    {
        EmpView
    };
}
