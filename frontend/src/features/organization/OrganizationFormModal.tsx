import { Alert, Card, Col, DatePicker, Form, Input, Row, Select, Switch, message } from 'antd';
import { ApartmentOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { organizationApi } from './api';
import type { OrganizationUnitDto } from './types';
import { LookupItemSelect } from '@/features/lookups/components/LookupItemSelect';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { ApiError } from '@/shared/api/apiError';

interface Props {
  open: boolean;
  onClose: () => void;
  editing: OrganizationUnitDto | null;
}

export function OrganizationFormModal({ open, onClose, editing }: Props) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);

  const treeQuery = useQuery({
    queryKey: ['org-units', 'flat-options'],
    queryFn: () => organizationApi.list({ page: 1, pageSize: 500, isActive: true }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (editing) {
      form.setFieldsValue({
        code: editing.code, name: editing.name,
        parentUnitId: editing.parentUnitId,
        organizationLevelId: editing.organizationLevelId,
        workLocationId: editing.workLocationId,
        establishedDate: editing.establishedDate ? dayjs(editing.establishedDate) : null,
        businessRegistrationNumber: editing.businessRegistrationNumber,
        licenseIssuedDate: editing.licenseIssuedDate ? dayjs(editing.licenseIssuedDate) : null,
        licenseIssuedPlace: editing.licenseIssuedPlace,
        representativeName: editing.representativeName,
        phone: editing.phone, fax: editing.fax, email: editing.email,
        note: editing.note, isActive: editing.isActive,
      });
    } else {
      form.setFieldsValue({ isActive: true });
    }
    setDirty(false);
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: async (values: any) => {
      const payload = {
        name: values.name,
        parentUnitId: values.parentUnitId ?? null,
        organizationLevelId: values.organizationLevelId,
        workLocationId: values.workLocationId ?? null,
        establishedDate: values.establishedDate ? values.establishedDate.format('YYYY-MM-DD') : null,
        businessRegistrationNumber: values.businessRegistrationNumber ?? null,
        licenseIssuedDate: values.licenseIssuedDate ? values.licenseIssuedDate.format('YYYY-MM-DD') : null,
        licenseIssuedPlace: values.licenseIssuedPlace ?? null,
        representativeName: values.representativeName ?? null,
        phone: values.phone ?? null, fax: values.fax ?? null, email: values.email ?? null,
        note: values.note ?? null, isActive: values.isActive ?? true,
      };
      if (editing) return organizationApi.update(editing.id, payload);
      return organizationApi.create({ ...payload, code: values.code });
    },
    onSuccess: () => {
      message.success('Đã lưu');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['org-units'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  const parentOptions = (treeQuery.data?.items ?? [])
    .filter((u) => !editing || u.id !== editing.id)
    .map((u) => ({ value: u.id, label: `${u.code} - ${u.name}` }));

  const formId = 'org-form';

  return (
    <FormModalShell
      open={open} onClose={onClose}
      title={editing ? 'Sửa đơn vị tổ chức' : 'Thêm đơn vị tổ chức'}
      subtitle={editing ? `Mã: ${editing.code}` : 'Định nghĩa đơn vị mới trong cơ cấu tổ chức'}
      icon={<ApartmentOutlined />}
      formId={formId} isSaving={save.isPending} dirty={dirty}
      width={920}
      bodyHeight="78vh"
    >
      <Form form={form} name={formId} layout="vertical"
        onValuesChange={() => setDirty(true)}
        onFinish={(v) => save.mutate(v)}
      >
        <Card size="small" title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Mã đơn vị" name="code" rules={[{ required: !editing, message: 'Bắt buộc' }, { max: 64 }]}>
                <Input disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item label="Tên đơn vị" name="name" rules={[{ required: true, message: 'Bắt buộc' }, { max: 256 }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Cấp tổ chức" name="organizationLevelId" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <LookupItemSelect categoryCode="OrganizationLevel" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Trực thuộc đơn vị" name="parentUnitId">
                <Select allowClear showSearch optionFilterProp="label"
                  placeholder="Để trống nếu là đơn vị gốc"
                  options={parentOptions} loading={treeQuery.isLoading} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Địa điểm làm việc" name="workLocationId">
                <LookupItemSelect categoryCode="WorkLocation" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Ngày thành lập" name="establishedDate">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Đang sử dụng" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="Thông tin liên hệ" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Người đại diện" name="representativeName"><Input maxLength={128} /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Điện thoại" name="phone"><Input maxLength={32} /></Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Fax" name="fax"><Input maxLength={32} /></Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                <Input maxLength={256} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="Đăng ký kinh doanh">
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="Số ĐKKD" name="businessRegistrationNumber"><Input maxLength={64} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Ngày cấp" name="licenseIssuedDate">
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Nơi cấp" name="licenseIssuedPlace"><Input maxLength={256} /></Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Ghi chú" name="note"><Input.TextArea rows={2} maxLength={2000} /></Form.Item>
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
