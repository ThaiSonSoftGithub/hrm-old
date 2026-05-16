import { api } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  CreateLookupItemRequest,
  LookupCategoryDto,
  LookupItemDto,
  LookupListQuery,
  UpdateLookupItemRequest,
} from './types';

export const lookupApi = {
  listCategories: () => api<LookupCategoryDto[]>('/lookups/categories'),

  listItems: (categoryCode: string, q: LookupListQuery) =>
    api<PagedResult<LookupItemDto>>(`/lookups/${encodeURIComponent(categoryCode)}`, { query: { ...q } }),

  getItem: (categoryCode: string, id: string) =>
    api<LookupItemDto>(`/lookups/${encodeURIComponent(categoryCode)}/${id}`),

  createItem: (categoryCode: string, body: CreateLookupItemRequest) =>
    api<LookupItemDto>(`/lookups/${encodeURIComponent(categoryCode)}`, { method: 'POST', body }),

  updateItem: (categoryCode: string, id: string, body: UpdateLookupItemRequest) =>
    api<LookupItemDto>(`/lookups/${encodeURIComponent(categoryCode)}/${id}`, { method: 'PUT', body }),

  deleteItem: (categoryCode: string, id: string) =>
    api<void>(`/lookups/${encodeURIComponent(categoryCode)}/${id}`, { method: 'DELETE' }),
};
