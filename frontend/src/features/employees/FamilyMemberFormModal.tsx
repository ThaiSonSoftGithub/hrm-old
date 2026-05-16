import { Alert, Card, Checkbox, Col, DatePicker, Form, Input, Row, Select, message } from 'antd';
import { TeamOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { employeeApi } from './api';
import type { FamilyMemberDto, FamilyMemberInput } from './types';
import { lookupApi } from '@/features/lookups/api';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { GENDER_OPTIONS } from './constants';
import { ApiError } from '@/shared/api/apiError';

interface Props {
  open: boolean;
  onClose: () => void;
  employeeId: string;
  editing: FamilyMemberDto | null;
}

const toIso = (d: any) => (d ? dayjs(d).format('YYYY-MM-DD') : null);
const fromIso = (s: string | null | undefined) => (s ? dayjs(s) : undefined);

export function FamilyMemberFormModal({ open, onClose, employeeId, editing }: Props) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);
  const [yearOnly, setYearOnly] = useState(false);

  const relations = useQuery({
    queryKey: ['lookup-options', 'FamilyRelation'],
    queryFn: () => lookupApi.listItems('FamilyRelation', { page: 1, pageSize: 100 }),
    enabled: open,
  });
  const countries = useQuery({
    queryKey: ['lookup-options', 'Country'],
    queryFn: () => lookupApi.listItems('Country', { page: 1, pageSize: 300 }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setYearOnly(editing?.birthYearOnly ?? false);
    if (editing) {
      form.setFieldsValue({
        relationId: editing.relationId,
        fullName: editing.fullName,
        gender: editing.gender,
        dateOfBirth: fromIso(editing.dateOfBirth),
        birthYearOnly: editing.birthYearOnly,
        nationalityCountryId: editing.nationalityCountryId,
        identityOrPassportNumber: editing.identityOrPassportNumber,
        address: editing.address,
        mobilePhone: editing.mobilePhone,
        homePhone: editing.homePhone,
        email: editing.email,
        occupation: editing.occupation,
        personalTaxCode: editing.personalTaxCode,
        workplace: editing.workplace,
        sameHouseholdBook: editing.sameHouseholdBook,
        isHouseholdHead: editing.isHouseholdHead,
        isDependent: editing.isDependent,
        isDeceased: editing.isDeceased,
        note: editing.note,
      });
    }
    setDirty(false);
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: (v: any) => {
      const body: FamilyMemberInput = {
        relationId: v.relationId,
        fullName: (v.fullName ?? '').trim(),
        gender: v.gender,
        dateOfBirth: toIso(v.dateOfBirth),
        birthYearOnly: !!v.birthYearOnly,
        nationalityCountryId: v.nationalityCountryId ?? null,
        identityOrPassportNumber: v.identityOrPassportNumber ?? null,
        address: v.address ?? null,
        mobilePhone: v.mobilePhone ?? null,
        homePhone: v.homePhone ?? null,
        email: v.email ?? null,
        occupation: v.occupation ?? null,
        personalTaxCode: v.personalTaxCode ?? null,
        workplace: v.workplace ?? null,
        sameHouseholdBook: !!v.sameHouseholdBook,
        isHouseholdHead: !!v.isHouseholdHead,
        isDependent: !!v.isDependent,
        isDeceased: !!v.isDeceased,
        note: v.note ?? null,
      };
      if (editing) return employeeApi.updateFamily(employeeId, editing.id, body);
      return employeeApi.createFamily(employeeId, body);
    },
    onSuccess: () => {
      message.success('Đã lưu');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'family'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  const formId = 'family-member-form';
  const lkOptsName = (rows?: { id: string; name: string }[]) =>
    (rows ?? []).map((x) => ({ value: x.id, label: x.name }));

  return (
    <FormModalShell
      open={open} onClose={onClose}
      title={editing ? `Sửa thành viên gia đình` : 'Thêm thành viên gia đình'}
      subtitle={editing ? editing.fullName : 'Bổ sung quan hệ gia đình của nhân viên'}
      icon={<TeamOutlined />}
      formId={formId} isSaving={save.isPending} dirty={dirty}
      width={820}
      bodyHeight="78vh"
    >
      <Form form={form} name={formId} layout="vertical"
        onValuesChange={(changed) => {
          setDirty(true);
          if (Object.prototype.hasOwnProperty.call(changed, 'birthYearOnly')) {
            setYearOnly(!!changed.birthYearOnly);
          }
        }}
        onFinish={(v) => save.mutate(v)}
      >
        <Card size="small" title="Thông tin cơ bản" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Quan hệ" name="relationId" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select showSearch optionFilterProp="label"
                  options={lkOptsName(relations.data?.items)} loading={relations.isLoading}
                  placeholder="Bố / Mẹ / Vợ / Con..." />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Họ tên" name="fullName" rules={[{ required: true, message: 'Bắt buộc' }, { max: 255 }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Giới tính" name="gender" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select options={GENDER_OPTIONS} placeholder="Chọn" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label={yearOnly ? 'Năm sinh' : 'Ngày sinh'} name="dateOfBirth">
                <DatePicker style={{ width: '100%' }}
                  picker={yearOnly ? 'year' : 'date'}
                  format={yearOnly ? 'YYYY' : 'DD/MM/YYYY'} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label=" " name="birthYearOnly" valuePropName="checked">
                <Checkbox>Chỉ nhập năm sinh</Checkbox>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Quốc tịch" name="nationalityCountryId">
                <Select allowClear showSearch optionFilterProp="label"
                  options={lkOptsName(countries.data?.items)} loading={countries.isLoading} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Số CMND/Hộ chiếu" name="identityOrPassportNumber"><Input maxLength={64} /></Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Địa chỉ" name="address"><Input maxLength={512} /></Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="Liên hệ & nghề nghiệp" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="ĐT di động" name="mobilePhone"><Input maxLength={32} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="ĐT nhà riêng" name="homePhone"><Input maxLength={32} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                <Input maxLength={256} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Nghề nghiệp" name="occupation"><Input maxLength={128} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Mã số thuế cá nhân" name="personalTaxCode"><Input maxLength={32} /></Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="Nơi làm việc" name="workplace"><Input maxLength={256} /></Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="Tình trạng">
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item name="sameHouseholdBook" valuePropName="checked">
                <Checkbox>Cùng sổ hộ khẩu</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isHouseholdHead" valuePropName="checked">
                <Checkbox>Là chủ hộ</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isDependent" valuePropName="checked">
                <Checkbox>Là người phụ thuộc</Checkbox>
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item name="isDeceased" valuePropName="checked">
                <Checkbox>Đã mất</Checkbox>
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
