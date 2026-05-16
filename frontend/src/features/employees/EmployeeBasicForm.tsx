import { Card, Col, DatePicker, Form, Input, Row, Select } from 'antd';
import type { FormInstance } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { lookupApi } from '@/features/lookups/api';
import { organizationApi } from '@/features/organization/api';
import { employeeApi } from './api';
import { GENDER_OPTIONS } from './constants';

interface Props {
  form: FormInstance;
  formId: string;
  onValuesChange?: () => void;
  onFinish: (values: any) => void;
  /** Khi true: ô "Mã nhân viên" disable (chế độ edit). */
  codeReadonly?: boolean;
  /** Loại trừ employeeId này khỏi dropdown "Quản lý trực tiếp" (tránh self-reference). */
  excludeEmployeeId?: string;
}

const useLookup = (cat: string) => useQuery({
  queryKey: ['lookup-options', cat],
  queryFn: () => lookupApi.listItems(cat, { page: 1, pageSize: 300 }),
});

/**
 * Form 2 section "Thông tin chung" của nhân viên — dùng chung cho create + edit.
 * Form đã được parent quản lý qua prop `form` + `formId` để footer ghim ngoài có thể submit.
 */
export function EmployeeBasicForm({
  form, formId, onValuesChange, onFinish, codeReadonly, excludeEmployeeId,
}: Props) {
  const jobPositions = useLookup('JobPosition');
  const jobTitles = useLookup('JobTitle');
  const workingStatuses = useLookup('WorkingStatus');
  const workLocations = useLookup('WorkLocation');
  const orgUnits = useQuery({
    queryKey: ['org-units', 'options'],
    queryFn: () => organizationApi.list({ page: 1, pageSize: 500 }),
  });
  const employees = useQuery({
    queryKey: ['employees', 'options'],
    queryFn: () => employeeApi.list({ page: 1, pageSize: 1000 }),
  });

  const lkOpts = (rows?: { id: string; code: string; name: string }[]) =>
    (rows ?? []).map((x) => ({ value: x.id, label: `${x.code} - ${x.name}` }));
  const lkOptsName = (rows?: { id: string; name: string }[]) =>
    (rows ?? []).map((x) => ({ value: x.id, label: x.name }));
  const empOptions = (employees.data?.items ?? [])
    .filter((x) => x.employeeId !== excludeEmployeeId)
    .map((x) => ({ value: x.employeeId, label: `${x.employeeCode} - ${x.fullName}` }));

  return (
    <Form
      form={form}
      name={formId}
      layout="vertical"
      onValuesChange={onValuesChange}
      onFinish={onFinish}
    >
      <Card title="Thông tin cơ bản" size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Mã nhân viên" name="code" rules={codeReadonly ? [] : [{ required: true, message: 'Bắt buộc' }, { max: 32 }]}>
              <Input disabled={codeReadonly} placeholder="VD: NV0001" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Họ và đệm" name="middleName"><Input maxLength={128} /></Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Tên" name="firstName"><Input maxLength={64} /></Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Họ tên" name="fullName" rules={[{ required: true, message: 'Bắt buộc' }, { max: 128 }]}>
              <Input />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Giới tính" name="gender" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select options={GENDER_OPTIONS} placeholder="Chọn" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Ngày sinh" name="dateOfBirth">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Mã chấm công" name="attendanceCode"><Input maxLength={64} /></Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="ĐTDĐ" name="mobilePhone"><Input maxLength={32} /></Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="ĐT công ty" name="companyPhone"><Input maxLength={32} /></Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Email cá nhân" name="personalEmail" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
              <Input maxLength={256} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Email công ty" name="companyEmail" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
              <Input maxLength={256} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Skype" name="skype"><Input maxLength={128} /></Form.Item>
          </Col>
        </Row>
      </Card>

      <Card title="Thông tin công việc" size="small">
        <Row gutter={16}>
          <Col span={8}>
            <Form.Item label="Vị trí công việc" name="jobPositionId" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select showSearch optionFilterProp="label" options={lkOpts(jobPositions.data?.items)} loading={jobPositions.isLoading} placeholder="Chọn" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Chức danh" name="jobTitleId">
              <Select allowClear showSearch optionFilterProp="label" options={lkOpts(jobTitles.data?.items)} loading={jobTitles.isLoading} placeholder="Chọn" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Đơn vị công tác" name="organizationUnitId">
              <Select allowClear showSearch optionFilterProp="label" options={lkOpts(orgUnits.data?.items)} loading={orgUnits.isLoading} placeholder="Chọn" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Phòng ban" name="departmentId" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select showSearch optionFilterProp="label" options={lkOpts(orgUnits.data?.items)} loading={orgUnits.isLoading} placeholder="Chọn" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Địa điểm làm việc" name="workLocationId">
              <Select allowClear showSearch optionFilterProp="label" options={lkOptsName(workLocations.data?.items)} loading={workLocations.isLoading} placeholder="Chọn" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Trạng thái" name="workingStatusId" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select showSearch optionFilterProp="label" options={lkOptsName(workingStatuses.data?.items)} loading={workingStatuses.isLoading} placeholder="Chọn" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Ngày tập sự" name="internshipStartDate">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Ngày thử việc" name="probationStartDate">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item label="Ngày chính thức" name="officialStartDate">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Quản lý trực tiếp" name="directManagerEmployeeId">
              <Select allowClear showSearch optionFilterProp="label" options={empOptions} loading={employees.isLoading} placeholder="Chọn" />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
}
