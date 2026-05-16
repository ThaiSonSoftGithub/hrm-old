import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppShell } from '@/shared/layout/AppShell';
import { RequireAuth } from '@/shared/auth/RequireAuth';
import { LoginPage } from '@/features/auth/LoginPage';
import { DashboardPage } from '@/features/dashboard/DashboardPage';
import { LookupExplorerPage } from '@/features/lookups/LookupExplorerPage';
import { UserListPage } from '@/features/users/UserListPage';
import { OrganizationListPage } from '@/features/organization/OrganizationListPage';
import { EmployeeListPage } from '@/features/employees/EmployeeListPage';
import { EmployeeDetailPage } from '@/features/employees/EmployeeDetailPage';
import { RoleGroupListPage } from '@/features/authorization/RoleGroupListPage';
import { PermissionListPage } from '@/features/authorization/PermissionListPage';
import { FunctionGroupListPage } from '@/features/authorization/FunctionGroupListPage';
import { ScreenListPage } from '@/features/authorization/ScreenListPage';

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  {
    path: '/',
    element: <RequireAuth><AppShell /></RequireAuth>,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'users', element: <UserListPage /> },
      { path: 'lookups', element: <LookupExplorerPage /> },
      { path: 'lookups/:categoryCode', element: <LookupExplorerPage /> },
      { path: 'organization-units', element: <OrganizationListPage /> },
      { path: 'employees', element: <EmployeeListPage /> },
      { path: 'employees/:id', element: <EmployeeDetailPage /> },
      { path: 'role-groups', element: <RoleGroupListPage /> },
      { path: 'permissions', element: <PermissionListPage /> },
      { path: 'function-groups', element: <FunctionGroupListPage /> },
      { path: 'screens', element: <ScreenListPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]);
