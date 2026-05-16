export interface OrgLookupRefDto {
  id: string;
  code: string;
  name: string;
}

export interface OrganizationUnitDto {
  id: string;
  code: string;
  name: string;
  parentUnitId: string | null;
  parent: OrgLookupRefDto | null;
  organizationLevelId: string;
  organizationLevel: OrgLookupRefDto | null;
  workLocationId: string | null;
  workLocation: OrgLookupRefDto | null;
  establishedDate: string | null;
  businessRegistrationNumber: string | null;
  licenseIssuedDate: string | null;
  licenseIssuedPlace: string | null;
  representativeName: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  note: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string | null;
}

export interface OrganizationUnitTreeNode {
  id: string;
  code: string;
  name: string;
  isActive: boolean;
  parentUnitId: string | null;
  children: OrganizationUnitTreeNode[];
}

export interface CreateOrganizationUnitRequest {
  code: string;
  name: string;
  parentUnitId: string | null;
  organizationLevelId: string;
  workLocationId: string | null;
  establishedDate: string | null;
  businessRegistrationNumber: string | null;
  licenseIssuedDate: string | null;
  licenseIssuedPlace: string | null;
  representativeName: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  note: string | null;
  isActive: boolean;
}

export type UpdateOrganizationUnitRequest = Omit<CreateOrganizationUnitRequest, 'code'>;

export interface OrgListQuery {
  keyword?: string;
  isActive?: boolean;
  parentUnitId?: string;
  organizationLevelId?: string;
  page: number;
  pageSize: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
