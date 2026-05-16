import { Alert, Form, Skeleton, message } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { employeeApi } from './api';
import type { UpdateEmployeeGeneralInfoRequest } from './types';
import { EmployeeBasicForm } from './EmployeeBasicForm';
import { ApiError } from '@/shared/api/apiError';

export interface TabFormActions {
  canSave: boolean;
  isSaving: boolean;
  /** True khi user đã thay đổi field nào đó nhưng chưa lưu — dùng để hiển thị confirm khi rời tab/đóng modal. */
  dirty: boolean;
  submit: () => void;
}

interface Props {
  employeeId: string;
  onActionsChange?: (a: TabFormActions) => void;
}

const toIsoDate = (d: any): string | null => (d ? dayjs(d).format('YYYY-MM-DD') : null);
const fromIsoDate = (s: string | null | undefined) => (s ? dayjs(s) : undefined);

export function Tab01General({ employeeId, onActionsChange }: Props) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);

  const generalQuery = useQuery({
    queryKey: ['employee', employeeId, 'general'],
    queryFn: () => employeeApi.getGeneral(employeeId),
  });

  useEffect(() => {
    if (!generalQuery.data) return;
    const g = generalQuery.data;
    form.setFieldsValue({
      code: g.employeeCode,
      middleName: g.middleName,
      firstName: g.firstName,
      fullName: g.fullName,
      gender: g.gender,
      dateOfBirth: fromIsoDate(g.dateOfBirth),
      attendanceCode: g.attendanceCode,
      mobilePhone: g.mobilePhone,
      companyPhone: g.companyPhone,
      personalEmail: g.personalEmail,
      companyEmail: g.companyEmail,
      skype: g.skype,
      jobPositionId: g.jobPositionId,
      jobTitleId: g.jobTitleId,
      organizationUnitId: g.organizationUnitId,
      departmentId: g.departmentId,
      workLocationId: g.workLocationId,
      internshipStartDate: fromIsoDate(g.internshipStartDate),
      probationStartDate: fromIsoDate(g.probationStartDate),
      officialStartDate: fromIsoDate(g.officialStartDate),
      directManagerEmployeeId: g.directManagerEmployeeId,
      workingStatusId: g.workingStatusId,
    });
    setDirty(false);
  }, [generalQuery.data, form]);

  const save = useMutation({
    mutationFn: (v: any) => {
      const body: UpdateEmployeeGeneralInfoRequest = {
        middleName: v.middleName ?? null,
        firstName: v.firstName ?? null,
        fullName: v.fullName,
        gender: v.gender,
        dateOfBirth: toIsoDate(v.dateOfBirth),
        attendanceCode: v.attendanceCode ?? null,
        mobilePhone: v.mobilePhone ?? null,
        companyPhone: v.companyPhone ?? null,
        personalEmail: v.personalEmail ?? null,
        companyEmail: v.companyEmail ?? null,
        skype: v.skype ?? null,
        jobPositionId: v.jobPositionId,
        jobTitleId: v.jobTitleId ?? null,
        organizationUnitId: v.organizationUnitId ?? null,
        departmentId: v.departmentId,
        workLocationId: v.workLocationId ?? null,
        internshipStartDate: toIsoDate(v.internshipStartDate),
        probationStartDate: toIsoDate(v.probationStartDate),
        officialStartDate: toIsoDate(v.officialStartDate),
        directManagerEmployeeId: v.directManagerEmployeeId ?? null,
        workingStatusId: v.workingStatusId,
      };
      return employeeApi.updateGeneral(employeeId, body);
    },
    onSuccess: () => {
      message.success('Đã lưu thông tin chung');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['employee', employeeId] });
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  // Expose actions cho footer ghim của Layout — canSave chỉ true khi user thực sự đổi
  useEffect(() => {
    onActionsChange?.({
      canSave: !!generalQuery.data && !save.isPending && dirty,
      isSaving: save.isPending,
      dirty,
      submit: () => form.submit(),
    });
  }, [generalQuery.data, save.isPending, form, onActionsChange, dirty]);

  if (generalQuery.isLoading) return <Skeleton active />;
  if (generalQuery.isError) {
    const err = generalQuery.error as ApiError;
    return <Alert type="error" showIcon message="Không tải được Tab Thông tin chung" description={err?.message ?? ''} />;
  }

  return (
    <EmployeeBasicForm
      form={form}
      formId="employee-form-tab-1"
      codeReadonly
      excludeEmployeeId={employeeId}
      onValuesChange={() => setDirty(true)}
      onFinish={(v) => save.mutate(v)}
    />
  );
}
