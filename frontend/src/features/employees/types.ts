export interface EmployeeRefDto {
  id: string;
  code: string;
  name: string;
}

export interface EmployeeListItemDto {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  gender?: string | null;
  genderLabel?: string | null;
  dateOfBirth?: string | null;
  jobPositionId?: string | null;
  jobPositionLabel?: string | null;
  departmentId?: string | null;
  departmentLabel?: string | null;
  phoneNumber?: string | null;
  email?: string | null;
  probationStartDate?: string | null;
  officialStartDate?: string | null;
  workingStatusId?: string | null;
  workingStatusLabel?: string | null;
}

export interface EmployeeSummaryDto {
  employeeId: string;
  employeeCode: string;
  fullName: string;
  workingStatusLabel?: string | null;
  jobPositionLabel?: string | null;
  organizationUnitLabel?: string | null;
}

export interface EmployeeTabDto {
  key: string;
  label: string;
  status: 'ready' | 'future';
}

export interface EmployeeTabRegistryDto {
  defaultTabKey: string;
  tabs: EmployeeTabDto[];
}

export interface EmployeeListQuery {
  keyword?: string;
  organizationUnitId?: string;
  departmentId?: string;
  jobPositionId?: string;
  workingStatusId?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}

export interface CreateEmployeeRequest {
  code: string;
  middleName: string | null;
  firstName: string | null;
  fullName: string;
  gender: string;
  dateOfBirth: string | null;
  attendanceCode: string | null;
  mobilePhone: string | null;
  companyPhone: string | null;
  personalEmail: string | null;
  companyEmail: string | null;
  skype: string | null;
  jobPositionId: string;
  jobTitleId: string | null;
  organizationUnitId: string | null;
  departmentId: string;
  workLocationId: string | null;
  internshipStartDate: string | null;
  probationStartDate: string | null;
  officialStartDate: string | null;
  directManagerEmployeeId: string | null;
  workingStatusId: string;
}

export interface EmployeeGeneralInfoDto {
  employeeId: string;
  employeeCode: string;
  avatarFileId: string | null;
  middleName: string | null;
  firstName: string | null;
  fullName: string;
  gender: string | null;
  dateOfBirth: string | null;
  attendanceCode: string | null;
  mobilePhone: string | null;
  companyPhone: string | null;
  personalEmail: string | null;
  companyEmail: string | null;
  skype: string | null;
  jobPositionId: string | null;
  jobPosition: EmployeeRefDto | null;
  jobTitleId: string | null;
  jobTitle: EmployeeRefDto | null;
  organizationUnitId: string | null;
  organizationUnit: EmployeeRefDto | null;
  departmentId: string | null;
  department: EmployeeRefDto | null;
  workLocationId: string | null;
  workLocation: EmployeeRefDto | null;
  internshipStartDate: string | null;
  probationStartDate: string | null;
  officialStartDate: string | null;
  directManagerEmployeeId: string | null;
  directManagerEmployee: EmployeeRefDto | null;
  workingStatusId: string | null;
  workingStatus: EmployeeRefDto | null;
}

export interface EmployeeAddressDto {
  countryId: string | null;
  country: EmployeeRefDto | null;
  provinceId: string | null;
  province: EmployeeRefDto | null;
  districtId: string | null;
  district: EmployeeRefDto | null;
  wardId: string | null;
  ward: EmployeeRefDto | null;
  addressLine: string | null;
}

export interface EmployeeAddressInput {
  countryId: string | null;
  provinceId: string | null;
  districtId: string | null;
  wardId: string | null;
  addressLine: string | null;
}

export interface EmployeePersonalInfoDto {
  employeeId: string;
  employeeCode: string;

  identityNumber: string | null;
  identityIssueDate: string | null;
  identityIssueProvinceId: string | null;
  identityIssueProvince: EmployeeRefDto | null;
  identityExpiryDate: string | null;
  passportNumber: string | null;
  passportIssueDate: string | null;
  passportIssueProvinceId: string | null;
  passportIssueProvince: EmployeeRefDto | null;
  passportExpiryDate: string | null;

  partyCardNumber: string | null;
  partyJoinDate: string | null;
  partyJoinPlace: string | null;
  unionCardNumber: string | null;
  unionJoinDate: string | null;
  unionJoinPlace: string | null;

  generalEducationLevel: string | null;
  educationLevelId: string | null;     educationLevel: EmployeeRefDto | null;
  educationPlaceId: string | null;     educationPlace: EmployeeRefDto | null;
  educationFacultyId: string | null;   educationFaculty: EmployeeRefDto | null;
  educationMajorId: string | null;     educationMajor: EmployeeRefDto | null;
  graduationYear: number | null;
  degreeClassificationId: string | null; degreeClassification: EmployeeRefDto | null;

  maritalStatusId: string | null;       maritalStatus: EmployeeRefDto | null;
  familyBackgroundId: string | null;    familyBackground: EmployeeRefDto | null;
  personalBackgroundId: string | null;  personalBackground: EmployeeRefDto | null;
  ethnicityId: string | null;           ethnicity: EmployeeRefDto | null;
  religionId: string | null;            religion: EmployeeRefDto | null;
  nationalityCountryId: string | null;  nationalityCountry: EmployeeRefDto | null;

  mobilePhone: string | null;
  homePhone: string | null;
  officePhone: string | null;
  otherPhone: string | null;
  officeEmail: string | null;
  personalEmail: string | null;
  otherEmail: string | null;
  skype: string | null;
  facebook: string | null;

  nativePlaceAddress: EmployeeAddressDto;
  birthPlace: string | null;
  householdBookNumber: string | null;
  familyHouseholdCode: string | null;
  isHouseholdHead: boolean;
  permanentResidenceAddress: EmployeeAddressDto;
  currentResidenceAddress: EmployeeAddressDto;
  sameAsPermanentResidence: boolean;

  emergencyContactName: string | null;
  emergencyRelationId: string | null;   emergencyRelation: EmployeeRefDto | null;
  emergencyMobilePhone: string | null;
  emergencyHomePhone: string | null;
  emergencyEmail: string | null;
  emergencyAddress: string | null;

  heightText: string | null;
  weightText: string | null;
  bloodGroupText: string | null;
  healthStatusText: string | null;
}

export interface LaborContractDto {
  id: string;
  employeeId: string;
  employeeCode: string;
  employeeFullName: string;
  contractNumber: string;
  contractTypeId: string;
  contractType: EmployeeRefDto | null;
  contractDurationText: string | null;
  workingTypeId: string | null;
  workingType: EmployeeRefDto | null;
  jobPositionId: string;
  jobPosition: EmployeeRefDto | null;
  departmentId: string;
  department: EmployeeRefDto | null;
  baseSalary: number | null;
  insuranceSalary: number | null;
  salaryPercent: number | null;
  effectiveStartDate: string;
  effectiveEndDate: string;
  contractStatusLabel: string;
  signerEmployeeId: string | null;
  signer: EmployeeRefDto | null;
  signerJobTitleText: string | null;
  signedDate: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface FamilyMemberDto {
  id: string;
  employeeId: string;
  relationId: string;
  relation: EmployeeRefDto | null;
  fullName: string;
  gender: string;
  genderLabel: string | null;
  dateOfBirth: string | null;
  birthYearOnly: boolean;
  nationalityCountryId: string | null;
  nationalityCountry: EmployeeRefDto | null;
  identityOrPassportNumber: string | null;
  address: string | null;
  mobilePhone: string | null;
  homePhone: string | null;
  email: string | null;
  occupation: string | null;
  personalTaxCode: string | null;
  workplace: string | null;
  sameHouseholdBook: boolean;
  isHouseholdHead: boolean;
  isDependent: boolean;
  isDeceased: boolean;
  note: string | null;
  createdAt: string;
  updatedAt: string | null;
}

export interface BankAccountDto {
  employeeId: string;
  employeeCode: string;
  accountNumber: string | null;
  accountHolderName: string | null;
  bankId: string | null;
  bank: EmployeeRefDto | null;
  bankBranchId: string | null;
  bankBranch: EmployeeRefDto | null;
  note: string | null;
}

export interface DegreeDto {
  id: string;
  employeeId: string;
  educationPlaceId: string;
  educationPlace: EmployeeRefDto | null;
  fromYear: number | null;
  toYear: number | null;
  educationFacultyId: string | null;
  educationFaculty: EmployeeRefDto | null;
  educationMajorId: string | null;
  educationMajor: EmployeeRefDto | null;
  educationLevelId: string | null;
  educationLevel: EmployeeRefDto | null;
  educationMethodId: string | null;
  educationMethod: EmployeeRefDto | null;
  degreeClassificationId: string | null;
  degreeClassification: EmployeeRefDto | null;
  graduationYear: number | null;
  note: string | null;
  createdAt: string;
  updatedAt: string | null;
}
export interface DegreeInput {
  educationPlaceId: string;
  fromYear: number | null;
  toYear: number | null;
  educationFacultyId: string | null;
  educationMajorId: string | null;
  educationLevelId: string | null;
  educationMethodId: string | null;
  degreeClassificationId: string | null;
  graduationYear: number | null;
  note: string | null;
}

export interface CertificateDto {
  id: string;
  employeeId: string;
  certificateTypeId: string;
  certificateType: EmployeeRefDto | null;
  certificateName: string;
  certificateNumber: string | null;
  educationLevelId: string | null;
  educationLevel: EmployeeRefDto | null;
  issuedDate: string | null;
  expiryDate: string | null;
  issuedPlace: string | null;
  certificateClassificationId: string | null;
  certificateClassification: EmployeeRefDto | null;
  statusLabel: string | null;
  note: string | null;
  createdAt: string;
  updatedAt: string | null;
}
export interface CertificateInput {
  certificateTypeId: string;
  certificateName: string;
  certificateNumber: string | null;
  educationLevelId: string | null;
  issuedDate: string | null;
  expiryDate: string | null;
  issuedPlace: string | null;
  certificateClassificationId: string | null;
  note: string | null;
}

export interface WorkExperienceDto {
  id: string;
  employeeId: string;
  fromMonthYear: string;
  toMonthYear: string;
  workplaceName: string;
  jobTitleText: string;
  salaryAmount: number | null;
  jobDescription: string | null;
  note: string | null;
  referenceName: string | null;
  referenceJobTitle: string | null;
  referencePhone: string | null;
  referenceEmail: string | null;
  createdAt: string;
  updatedAt: string | null;
}
export interface WorkExperienceInput {
  fromMonthYear: string;
  toMonthYear: string;
  workplaceName: string;
  jobTitleText: string;
  salaryAmount: number | null;
  jobDescription: string | null;
  note: string | null;
  referenceName: string | null;
  referenceJobTitle: string | null;
  referencePhone: string | null;
  referenceEmail: string | null;
}

export interface WorkHistoryDto {
  id: string;
  employeeId: string;
  fromDate: string;
  toDate: string | null;
  isCurrent: boolean;
  jobPositionId: string;
  jobPosition: EmployeeRefDto | null;
  jobTitleId: string | null;
  jobTitle: EmployeeRefDto | null;
  organizationUnitId: string;
  organizationUnit: EmployeeRefDto | null;
  departmentId: string;
  department: EmployeeRefDto | null;
  directManagerEmployeeId: string | null;
  directManager: EmployeeRefDto | null;
  decisionNumber: string | null;
  decisionDate: string | null;
  statusLabel: string;
  note: string | null;
  createdAt: string;
  updatedAt: string | null;
}
export interface WorkHistoryInput {
  fromDate: string;
  toDate: string | null;
  isCurrent: boolean;
  jobPositionId: string;
  jobTitleId: string | null;
  organizationUnitId: string;
  departmentId: string;
  directManagerEmployeeId: string | null;
  decisionNumber: string | null;
  decisionDate: string | null;
  note: string | null;
}

export interface BankAccountInput {
  accountNumber: string | null;
  accountHolderName: string | null;
  bankId: string | null;
  bankBranchId: string | null;
  note: string | null;
}

export interface FamilyMemberInput {
  relationId: string;
  fullName: string;
  gender: string;
  dateOfBirth: string | null;
  birthYearOnly: boolean;
  nationalityCountryId: string | null;
  identityOrPassportNumber: string | null;
  address: string | null;
  mobilePhone: string | null;
  homePhone: string | null;
  email: string | null;
  occupation: string | null;
  personalTaxCode: string | null;
  workplace: string | null;
  sameHouseholdBook: boolean;
  isHouseholdHead: boolean;
  isDependent: boolean;
  isDeceased: boolean;
  note: string | null;
}

export interface LaborContractInput {
  contractNumber: string;
  contractTypeId: string;
  contractDurationText: string | null;
  workingTypeId: string | null;
  jobPositionId: string;
  departmentId: string;
  baseSalary: number | null;
  insuranceSalary: number | null;
  salaryPercent: number | null;
  effectiveStartDate: string;
  effectiveEndDate: string;
  signerEmployeeId: string | null;
  signerJobTitleText: string | null;
  signedDate: string | null;
  note: string | null;
}

export interface UpdateEmployeePersonalInfoRequest {
  identityNumber: string | null;
  identityIssueDate: string | null;
  identityIssueProvinceId: string | null;
  identityExpiryDate: string | null;
  passportNumber: string | null;
  passportIssueDate: string | null;
  passportIssueProvinceId: string | null;
  passportExpiryDate: string | null;

  partyCardNumber: string | null;
  partyJoinDate: string | null;
  partyJoinPlace: string | null;
  unionCardNumber: string | null;
  unionJoinDate: string | null;
  unionJoinPlace: string | null;

  generalEducationLevel: string | null;
  educationLevelId: string | null;
  educationPlaceId: string | null;
  educationFacultyId: string | null;
  educationMajorId: string | null;
  graduationYear: number | null;
  degreeClassificationId: string | null;

  maritalStatusId: string | null;
  familyBackgroundId: string | null;
  personalBackgroundId: string | null;
  ethnicityId: string | null;
  religionId: string | null;
  nationalityCountryId: string | null;

  mobilePhone: string | null;
  homePhone: string | null;
  officePhone: string | null;
  otherPhone: string | null;
  officeEmail: string | null;
  personalEmail: string | null;
  otherEmail: string | null;
  skype: string | null;
  facebook: string | null;

  nativePlaceAddress: EmployeeAddressInput | null;
  birthPlace: string | null;
  householdBookNumber: string | null;
  familyHouseholdCode: string | null;
  isHouseholdHead: boolean;
  permanentResidenceAddress: EmployeeAddressInput | null;
  currentResidenceAddress: EmployeeAddressInput | null;
  sameAsPermanentResidence: boolean;

  emergencyContactName: string | null;
  emergencyRelationId: string | null;
  emergencyMobilePhone: string | null;
  emergencyHomePhone: string | null;
  emergencyEmail: string | null;
  emergencyAddress: string | null;

  heightText: string | null;
  weightText: string | null;
  bloodGroupText: string | null;
  healthStatusText: string | null;
}

export interface UpdateEmployeeGeneralInfoRequest {
  middleName: string | null;
  firstName: string | null;
  fullName: string;
  gender: string;
  dateOfBirth: string | null;
  attendanceCode: string | null;
  mobilePhone: string | null;
  companyPhone: string | null;
  personalEmail: string | null;
  companyEmail: string | null;
  skype: string | null;
  jobPositionId: string;
  jobTitleId: string | null;
  organizationUnitId: string | null;
  departmentId: string;
  workLocationId: string | null;
  internshipStartDate: string | null;
  probationStartDate: string | null;
  officialStartDate: string | null;
  directManagerEmployeeId: string | null;
  workingStatusId: string;
}
