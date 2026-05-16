import { api } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  CreateOrganizationUnitRequest,
  OrgListQuery,
  OrganizationUnitDto,
  OrganizationUnitTreeNode,
  UpdateOrganizationUnitRequest,
} from './types';

export const organizationApi = {
  list: (q: OrgListQuery) =>
    api<PagedResult<OrganizationUnitDto>>('/organization-units', { query: { ...q } }),
  tree: () => api<OrganizationUnitTreeNode[]>('/organization-units/tree'),
  get: (id: string) => api<OrganizationUnitDto>(`/organization-units/${id}`),
  create: (body: CreateOrganizationUnitRequest) =>
    api<OrganizationUnitDto>('/organization-units', { method: 'POST', body }),
  update: (id: string, body: UpdateOrganizationUnitRequest) =>
    api<OrganizationUnitDto>(`/organization-units/${id}`, { method: 'PUT', body }),
  remove: (id: string) =>
    api<void>(`/organization-units/${id}`, { method: 'DELETE' }),
};
