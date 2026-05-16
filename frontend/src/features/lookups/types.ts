export interface LookupCategoryDto {
  code: string;
  name: string;
  group: string;
  description: string | null;
  codePrefix: string | null;
  codePadLength: number | null;
  parentCategoryCode: string | null;
  ref1CategoryCode: string | null;
  ref2CategoryCode: string | null;
}

export interface LookupItemRefDto {
  id: string;
  code: string;
  name: string;
}

export interface LookupItemDto {
  id: string;
  categoryCode: string;
  code: string;
  name: string;
  note: string | null;
  isActive: boolean;
  sortOrder: number;
  parentItemId: string | null;
  parent: LookupItemRefDto | null;
  refItemId1: string | null;
  ref1: LookupItemRefDto | null;
  refItemId2: string | null;
  ref2: LookupItemRefDto | null;
  extra: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface CreateLookupItemRequest {
  code: string | null;
  name: string;
  note: string | null;
  isActive: boolean;
  sortOrder: number;
  parentItemId: string | null;
  refItemId1: string | null;
  refItemId2: string | null;
  extra: string | null;
}

export type UpdateLookupItemRequest = Omit<CreateLookupItemRequest, 'code'>;

export interface LookupListQuery {
  keyword?: string;
  isActive?: boolean;
  parentId?: string;
  refId1?: string;
  refId2?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
