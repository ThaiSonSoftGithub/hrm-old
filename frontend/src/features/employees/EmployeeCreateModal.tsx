import { Avatar, Button, Form, Modal, Space, Typography, message } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { employeeApi } from './api';
import type { CreateEmployeeRequest } from './types';
import { EmployeeBasicForm } from './EmployeeBasicForm';
import { ApiError } from '@/shared/api/apiError';

interface Props {
  open: boolean;
  onClose: () => void;
  onCreated: (id: string) => void;
}

const toIsoDate = (d: any): string | null => (d ? dayjs(d).format('YYYY-MM-DD') : null);

export function EmployeeCreateModal({ open, onClose, onCreated }: Props) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (open) { form.resetFields(); setDirty(false); }
  }, [open, form]);

  const create = useMutation({
    mutationFn: (v: any) => {
      const body: CreateEmployeeRequest = {
        code: (v.code ?? '').trim(),
        middleName: v.middleName ?? null,
        firstName: v.firstName ?? null,
        fullName: (v.fullName ?? '').trim(),
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
      return employeeApi.create(body);
    },
    onSuccess: (res) => {
      message.success('Đã tạo nhân viên mới');
      qc.invalidateQueries({ queryKey: ['employees'] });
      setDirty(false);
      onClose();
      onCreated(res.id);
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không tạo được'),
  });

  const handleCancel = () => {
    if (!dirty) { onClose(); return; }
    Modal.confirm({
      title: 'Có thay đổi chưa lưu',
      content: 'Các thông tin đã nhập sẽ bị mất nếu đóng. Bạn có muốn tiếp tục?',
      okText: 'Đóng', cancelText: 'Ở lại',
      okButtonProps: { danger: true }, centered: true,
      onOk: onClose,
    });
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width="min(1180px, 96vw)"
      destroyOnClose
      title={null}
      closable={false}
      maskClosable={false}
      keyboard={false}
      styles={{ body: { padding: 0, height: '78vh', display: 'flex', flexDirection: 'column' } }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid #F0F2F7', flexShrink: 0,
        }}
      >
        <Space size={14} align="center">
          <Avatar size={42} style={{ background: '#5B6CFF' }} icon={<UserAddOutlined />} />
          <div>
            <Typography.Text strong style={{ fontSize: 15, color: '#1F2937' }}>
              Thêm nhân viên mới
            </Typography.Text>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              Nhập thông tin chung — các tab khác có thể bổ sung sau khi tạo
            </div>
          </div>
        </Space>
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#fff' }}>
        <EmployeeBasicForm
          form={form}
          formId="employee-create-form"
          onValuesChange={() => setDirty(true)}
          onFinish={(v) => create.mutate(v)}
        />
      </div>

      {/* Footer */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex', justifyContent: 'flex-end',
          padding: '10px 16px',
          borderTop: '1px solid #F0F2F7',
          background: '#FAFBFF',
        }}
      >
        <Space size={8}>
          <Button onClick={handleCancel}>Hủy</Button>
          <Button
            type="primary"
            form="employee-create-form"
            htmlType="submit"
            loading={create.isPending}
            disabled={!dirty}
          >
            Tạo nhân viên
          </Button>
        </Space>
      </div>
    </Modal>
  );
}
