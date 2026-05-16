import { Alert, Card, Col, DatePicker, Form, Input, InputNumber, Row, Select, message } from 'antd';
import { FileTextOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { employeeApi } from './api';
import type { LaborContractDto, LaborContractInput } from './types';
import { lookupApi } from '@/features/lookups/api';
import { organizationApi } from '@/features/organization/api';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { ApiError } from '@/shared/api/apiError';

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  /** Khi tạo: giá trị mặc định auto-fill từ Tab 1 (jobPosition + department). */
  defaults?: { jobPositionId?: string | null; departmentId?: string | null };
  editing: LaborContractDto | null;
  /** Snapshot tên + mã NV để hiển thị read-only. */
  employeeMeta: { code: string; fullName: string };
}

const toIso = (d: any) => (d ? dayjs(d).format('YYYY-MM-DD') : null);
const fromIso = (s: string | null | undefined) => (s ? dayjs(s) : undefined);

export function LaborContractFormModal({
  open, onClose, employeeId, defaults, editing, employeeMeta,
}: Props) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);

  const contractTypes = useQuery({
    queryKey: ['lookup-options', 'ContractType'],
    queryFn: () => lookupApi.listItems('ContractType', { page: 1, pageSize: 100 }),
    enabled: open,
  });
  const workingForms = useQuery({
    queryKey: ['lookup-options', 'WorkingForm'],
    queryFn: () => lookupApi.listItems('WorkingForm', { page: 1, pageSize: 100 }),
    enabled: open,
  });
  const jobPositions = useQuery({
    queryKey: ['lookup-options', 'JobPosition'],
    queryFn: () => lookupApi.listItems('JobPosition', { page: 1, pageSize: 300 }),
    enabled: open,
  });
  const orgUnits = useQuery({
    queryKey: ['org-units', 'options'],
    queryFn: () => organizationApi.list({ page: 1, pageSize: 500 }),
    enabled: open,
  });
  const allEmployees = useQuery({
    queryKey: ['employees', 'options'],
    queryFn: () => employeeApi.list({ page: 1, pageSize: 1000 }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (editing) {
      form.setFieldsValue({
        contractNumber: editing.contractNumber,
        contractTypeId: editing.contractTypeId,
        contractDurationText: editing.contractDurationText,
        workingTypeId: editing.workingTypeId,
        jobPositionId: editing.jobPositionId,
        departmentId: editing.departmentId,
        baseSalary: editing.baseSalary,
        insuranceSalary: editing.insuranceSalary,
        salaryPercent: editing.salaryPercent,
        effectiveStartDate: fromIso(editing.effectiveStartDate),
        effectiveEndDate: fromIso(editing.effectiveEndDate),
        signerEmployeeId: editing.signerEmployeeId,
        signerJobTitleText: editing.signerJobTitleText,
        signedDate: fromIso(editing.signedDate),
        note: editing.note,
      });
    } else {
      form.setFieldsValue({
        jobPositionId: defaults?.jobPositionId ?? undefined,
        departmentId: defaults?.departmentId ?? undefined,
        salaryPercent: 100,
      });
    }
    setDirty(false);
  }, [open, editing, defaults, form]);

  const save = useMutation({
    mutationFn: (v: any) => {
      const body: LaborContractInput = {
        contractNumber: (v.contractNumber ?? '').trim(),
        contractTypeId: v.contractTypeId,
        contractDurationText: v.contractDurationText ?? null,
        workingTypeId: v.workingTypeId ?? null,
        jobPositionId: v.jobPositionId,
        departmentId: v.departmentId,
        baseSalary: v.baseSalary ?? null,
        insuranceSalary: v.insuranceSalary ?? null,
        salaryPercent: v.salaryPercent ?? null,
        effectiveStartDate: toIso(v.effectiveStartDate)!,
        effectiveEndDate: toIso(v.effectiveEndDate)!,
        signerEmployeeId: v.signerEmployeeId ?? null,
        signerJobTitleText: v.signerJobTitleText ?? null,
        signedDate: toIso(v.signedDate),
        note: v.note ?? null,
      };
      if (editing) return employeeApi.updateContract(employeeId, editing.id, body);
      return employeeApi.createContract(employeeId, body);
    },
    onSuccess: () => {
      message.success('Đã lưu hợp đồng');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'contracts'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  // Auto-suy ra ngày kết thúc = ngày bắt đầu + duration tháng (parse text "12 tháng")
  const handleValuesChange = (changed: any, allValues: any) => {
    setDirty(true);

    if (changed.contractTypeId) {
      const ct = (contractTypes.data?.items ?? []).find((c) => c.id === changed.contractTypeId);
      if (ct) form.setFieldValue('contractDurationText', ct.name);
      // Tự suy end date nếu có start
      autoEndDate(form, allValues, ct?.name);
    }
    if (changed.effectiveStartDate) {
      autoEndDate(form, allValues, allValues.contractDurationText);
    }
    if (changed.signerEmployeeId) {
      const sg = (allEmployees.data?.items ?? []).find((e) => e.employeeId === changed.signerEmployeeId);
      if (sg) form.setFieldValue('signerJobTitleText', sg.jobPositionLabel ?? '');
    }
  };

  const formId = 'labor-contract-form';
  const lkOpts = (rows?: { id: string; code: string; name: string }[]) =>
    (rows ?? []).map((x) => ({ value: x.id, label: `${x.code} - ${x.name}` }));
  const lkOptsName = (rows?: { id: string; name: string }[]) =>
    (rows ?? []).map((x) => ({ value: x.id, label: x.name }));
  const empOpts = (allEmployees.data?.items ?? [])
    .map((x) => ({ value: x.employeeId, label: `${x.employeeCode} - ${x.fullName}` }));

  return (
    <FormModalShell
      open={open} onClose={onClose}
      title={editing ? `Sửa hợp đồng ${editing.contractNumber}` : 'Thêm hợp đồng lao động'}
      subtitle={`Người lao động: ${employeeMeta.fullName} (${employeeMeta.code})`}
      icon={<FileTextOutlined />}
      formId={formId} isSaving={save.isPending} dirty={dirty}
      width={900}
      bodyHeight="78vh"
    >
      <Form form={form} name={formId} layout="vertical"
        onValuesChange={handleValuesChange}
        onFinish={(v) => save.mutate(v)}
      >
        <Card size="small" title="Người lao động" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Họ tên Người lao động">
                <Input value={employeeMeta.fullName} disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Mã nhân viên">
                <Input value={employeeMeta.code} disabled />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Vị trí công việc" name="jobPositionId" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select showSearch optionFilterProp="label" options={lkOpts(jobPositions.data?.items)} loading={jobPositions.isLoading} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Phòng ban" name="departmentId" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select showSearch optionFilterProp="label" options={lkOpts(orgUnits.data?.items)} loading={orgUnits.isLoading} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="Thông tin hợp đồng" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Số hợp đồng" name="contractNumber" rules={[{ required: true, message: 'Bắt buộc' }, { max: 64 }]}>
                <Input placeholder="VD: HĐ-2024-0001" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Loại hợp đồng" name="contractTypeId" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select showSearch optionFilterProp="label" options={lkOptsName(contractTypes.data?.items)} loading={contractTypes.isLoading} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Thời hạn hợp đồng" name="contractDurationText"
                help="Tự lấy theo loại hợp đồng, có thể sửa lại"
              >
                <Input maxLength={64} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Hình thức làm việc" name="workingTypeId">
                <Select allowClear showSearch optionFilterProp="label" options={lkOptsName(workingForms.data?.items)} loading={workingForms.isLoading} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Lương cơ bản" name="baseSalary">
                <InputNumber style={{ width: '100%' }} min={0} step={100000}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => Number((v ?? '').replace(/,/g, '')) as any} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Lương đóng bảo hiểm" name="insuranceSalary">
                <InputNumber style={{ width: '100%' }} min={0} step={100000}
                  formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                  parser={(v) => Number((v ?? '').replace(/,/g, '')) as any} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="% hưởng lương" name="salaryPercent">
                <InputNumber style={{ width: '100%' }} min={0} max={200} addonAfter="%" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày bắt đầu hiệu lực" name="effectiveStartDate" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày kết thúc" name="effectiveEndDate" rules={[{ required: true, message: 'Bắt buộc' }]}
                help="Tự suy theo loại hợp đồng, có thể sửa lại"
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="Người ký & ghi chú">
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Người ký" name="signerEmployeeId">
                <Select allowClear showSearch optionFilterProp="label" options={empOpts} loading={allEmployees.isLoading} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Chức danh" name="signerJobTitleText" help="Tự lấy theo người ký, có thể sửa lại">
                <Input maxLength={128} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày ký" name="signedDate">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Ghi chú" name="note">
                <Input.TextArea rows={3} maxLength={2000} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {save.isError && (
          <Alert type="error" showIcon style={{ marginTop: 12 }}
            message={(save.error as ApiError)?.message ?? 'Đã có lỗi xảy ra.'} />
        )}
      </Form>
    </FormModalShell>
  );
}

function autoEndDate(form: any, allValues: any, durationText?: string | null) {
  if (!allValues.effectiveStartDate || !durationText) return;
  // Parse "12 tháng", "36 tháng" etc.
  const m = durationText.match(/(\d+)\s*tháng/i);
  if (!m) return;
  const months = Number(m[1]);
  if (!months) return;
  const end = dayjs(allValues.effectiveStartDate).add(months, 'month').subtract(1, 'day');
  form.setFieldValue('effectiveEndDate', end);
}
