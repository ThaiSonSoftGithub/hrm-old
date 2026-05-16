import { api } from '@/shared/api/httpClient';
import type { PagedResult } from '@/shared/api/types';
import type {
  BankAccountDto,
  BankAccountInput,
  CertificateDto,
  CertificateInput,
  CreateEmployeeRequest,
  DegreeDto,
  DegreeInput,
  EmployeeDocumentDto,
  EmployeeDocumentFileDto,
  EmployeeGeneralInfoDto,
  EmployeeListItemDto,
  EmployeeListQuery,
  EmployeePersonalInfoDto,
  EmployeeSummaryDto,
  EmployeeTabRegistryDto,
  FamilyMemberDto,
  FamilyMemberInput,
  LaborContractDto,
  LaborContractInput,
  UpdateEmployeeGeneralInfoRequest,
  UpdateEmployeePersonalInfoRequest,
  WorkExperienceDto,
  WorkExperienceInput,
  WorkHistoryDto,
  WorkHistoryInput,
} from './types';

export const employeeApi = {
  list: (q: EmployeeListQuery) =>
    api<PagedResult<EmployeeListItemDto>>('/employees', { query: { ...q } }),
  create: (body: CreateEmployeeRequest) =>
    api<{ id: string }>('/employees', { method: 'POST', body }),
  remove: (id: string) =>
    api<void>(`/employees/${id}`, { method: 'DELETE' }),
  summary: (id: string) => api<EmployeeSummaryDto>(`/employees/${id}/summary`),
  tabs: (id: string) => api<EmployeeTabRegistryDto>(`/employees/${id}/tabs`),
  getGeneral: (id: string) => api<EmployeeGeneralInfoDto>(`/employees/${id}/general-info`),
  updateGeneral: (id: string, body: UpdateEmployeeGeneralInfoRequest) =>
    api<EmployeeGeneralInfoDto>(`/employees/${id}/general-info`, { method: 'PUT', body }),
  getPersonal: (id: string) => api<EmployeePersonalInfoDto>(`/employees/${id}/personal-info`),
  updatePersonal: (id: string, body: UpdateEmployeePersonalInfoRequest) =>
    api<EmployeePersonalInfoDto>(`/employees/${id}/personal-info`, { method: 'PUT', body }),

  listContracts: (employeeId: string) =>
    api<LaborContractDto[]>(`/employees/${employeeId}/labor-contracts`),
  createContract: (employeeId: string, body: LaborContractInput) =>
    api<LaborContractDto>(`/employees/${employeeId}/labor-contracts`, { method: 'POST', body }),
  updateContract: (employeeId: string, contractId: string, body: LaborContractInput) =>
    api<LaborContractDto>(`/employees/${employeeId}/labor-contracts/${contractId}`, { method: 'PUT', body }),
  removeContract: (employeeId: string, contractId: string) =>
    api<void>(`/employees/${employeeId}/labor-contracts/${contractId}`, { method: 'DELETE' }),

  listFamily: (employeeId: string) =>
    api<FamilyMemberDto[]>(`/employees/${employeeId}/family-members`),
  createFamily: (employeeId: string, body: FamilyMemberInput) =>
    api<FamilyMemberDto>(`/employees/${employeeId}/family-members`, { method: 'POST', body }),
  updateFamily: (employeeId: string, memberId: string, body: FamilyMemberInput) =>
    api<FamilyMemberDto>(`/employees/${employeeId}/family-members/${memberId}`, { method: 'PUT', body }),
  removeFamily: (employeeId: string, memberId: string) =>
    api<void>(`/employees/${employeeId}/family-members/${memberId}`, { method: 'DELETE' }),

  getBankAccount: (employeeId: string) =>
    api<BankAccountDto>(`/employees/${employeeId}/bank-account`),
  updateBankAccount: (employeeId: string, body: BankAccountInput) =>
    api<BankAccountDto>(`/employees/${employeeId}/bank-account`, { method: 'PUT', body }),

  listDegrees: (employeeId: string) => api<DegreeDto[]>(`/employees/${employeeId}/degrees`),
  createDegree: (employeeId: string, body: DegreeInput) =>
    api<DegreeDto>(`/employees/${employeeId}/degrees`, { method: 'POST', body }),
  updateDegree: (employeeId: string, id: string, body: DegreeInput) =>
    api<DegreeDto>(`/employees/${employeeId}/degrees/${id}`, { method: 'PUT', body }),
  removeDegree: (employeeId: string, id: string) =>
    api<void>(`/employees/${employeeId}/degrees/${id}`, { method: 'DELETE' }),

  listCertificates: (employeeId: string) => api<CertificateDto[]>(`/employees/${employeeId}/certificates`),
  createCertificate: (employeeId: string, body: CertificateInput) =>
    api<CertificateDto>(`/employees/${employeeId}/certificates`, { method: 'POST', body }),
  updateCertificate: (employeeId: string, id: string, body: CertificateInput) =>
    api<CertificateDto>(`/employees/${employeeId}/certificates/${id}`, { method: 'PUT', body }),
  removeCertificate: (employeeId: string, id: string) =>
    api<void>(`/employees/${employeeId}/certificates/${id}`, { method: 'DELETE' }),

  listExperiences: (employeeId: string) => api<WorkExperienceDto[]>(`/employees/${employeeId}/work-experiences`),
  createExperience: (employeeId: string, body: WorkExperienceInput) =>
    api<WorkExperienceDto>(`/employees/${employeeId}/work-experiences`, { method: 'POST', body }),
  updateExperience: (employeeId: string, id: string, body: WorkExperienceInput) =>
    api<WorkExperienceDto>(`/employees/${employeeId}/work-experiences/${id}`, { method: 'PUT', body }),
  removeExperience: (employeeId: string, id: string) =>
    api<void>(`/employees/${employeeId}/work-experiences/${id}`, { method: 'DELETE' }),

  listHistories: (employeeId: string) => api<WorkHistoryDto[]>(`/employees/${employeeId}/work-histories`),
  createHistory: (employeeId: string, body: WorkHistoryInput) =>
    api<WorkHistoryDto>(`/employees/${employeeId}/work-histories`, { method: 'POST', body }),
  updateHistory: (employeeId: string, id: string, body: WorkHistoryInput) =>
    api<WorkHistoryDto>(`/employees/${employeeId}/work-histories/${id}`, { method: 'PUT', body }),
  removeHistory: (employeeId: string, id: string) =>
    api<void>(`/employees/${employeeId}/work-histories/${id}`, { method: 'DELETE' }),

  listDocuments: (employeeId: string) => api<EmployeeDocumentDto[]>(`/employees/${employeeId}/documents`),
  /** Tạo document mới với multi-file upload (multipart). */
  createDocument: async (employeeId: string, name: string, note: string, files: File[]) => {
    const fd = new FormData();
    fd.append('name', name); fd.append('note', note);
    files.forEach((f) => fd.append('files', f, f.name));
    return await uploadMultipart<EmployeeDocumentDto>(`/employees/${employeeId}/documents`, fd, 'POST');
  },
  updateDocument: (employeeId: string, documentId: string, name: string, note: string) =>
    api<EmployeeDocumentDto>(`/employees/${employeeId}/documents/${documentId}`, {
      method: 'PUT', body: { name, note },
    }),
  removeDocument: (employeeId: string, documentId: string) =>
    api<void>(`/employees/${employeeId}/documents/${documentId}`, { method: 'DELETE' }),
  listDocumentFiles: (employeeId: string, documentId: string) =>
    api<EmployeeDocumentFileDto[]>(`/employees/${employeeId}/documents/${documentId}/files`),
  uploadDocumentFiles: async (employeeId: string, documentId: string, files: File[]) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f, f.name));
    return await uploadMultipart<EmployeeDocumentDto>(`/employees/${employeeId}/documents/${documentId}/files`, fd, 'POST');
  },
  removeDocumentFile: (employeeId: string, documentId: string, fileId: string) =>
    api<void>(`/employees/${employeeId}/documents/${documentId}/files/${fileId}`, { method: 'DELETE' }),
  /** URL download file — gắn token tự động qua header trong fetch helper riêng. Mở trực tiếp window.open KHÔNG kèm token, nên cần fetch + blob. */
  downloadDocumentFileUrl: (employeeId: string, documentId: string, fileId: string) =>
    `/employees/${employeeId}/documents/${documentId}/files/${fileId}/download`,
};

async function uploadMultipart<T>(path: string, fd: FormData, method: 'POST' | 'PUT'): Promise<T> {
  const { ApiError } = await import('@/shared/api/apiError');
  const { tokenStorage } = await import('@/shared/api/tokenStorage');
  const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';
  const headers: Record<string, string> = {};
  const token = tokenStorage.getAccess();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const url = BASE_URL.startsWith('http')
    ? `${BASE_URL}${path}`
    : `${window.location.origin}${BASE_URL}${path}`;
  const res = await fetch(url, { method, headers, body: fd });
  const text = await res.text();
  const body = text ? JSON.parse(text) : null;
  if (!res.ok) throw new ApiError(res.status, body);
  return body as T;
}
