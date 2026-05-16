import { Alert, Card, Col, Form, Input, InputNumber, Row, Switch, message } from 'antd';
import { DatabaseOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { lookupApi } from '../api';
import type { LookupCategoryDto, LookupItemDto } from '../types';
import { LookupItemSelect } from './LookupItemSelect';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { ApiError } from '@/shared/api/apiError';

interface Props {
  open: boolean;
  onClose: () => void;
  category: LookupCategoryDto;
  editing: LookupItemDto | null;
}

export function LookupFormModal({ open, onClose, category, editing }: Props) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (editing) {
      form.setFieldsValue({
        code: editing.code, name: editing.name, note: editing.note,
        isActive: editing.isActive, sortOrder: editing.sortOrder,
        parentItemId: editing.parentItemId,
        refItemId1: editing.refItemId1, refItemId2: editing.refItemId2,
        extra: editing.extra,
      });
    } else {
      form.setFieldsValue({ isActive: true, sortOrder: 0 });
    }
    setDirty(false);
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: async (values: any) => {
      const body = {
        name: values.name, note: values.note ?? null,
        isActive: values.isActive ?? true, sortOrder: values.sortOrder ?? 0,
        parentItemId: values.parentItemId ?? null,
        refItemId1: values.refItemId1 ?? null, refItemId2: values.refItemId2 ?? null,
        extra: values.extra ?? null,
      };
      if (editing) return lookupApi.updateItem(category.code, editing.id, body);
      return lookupApi.createItem(category.code, {
        ...body,
        code: category.codePrefix ? (values.code || null) : values.code,
      });
    },
    onSuccess: () => {
      message.success('Đã lưu');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['lookup-items', category.code] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  const codeAutoGen = !!category.codePrefix && !editing;
  const formId = 'lookup-form';

  return (
    <FormModalShell
      open={open}
      onClose={onClose}
      title={editing ? `Sửa bản ghi ${category.name}` : `Thêm bản ghi ${category.name}`}
      subtitle={editing ? `Mã: ${editing.code}` : 'Nhập thông tin bản ghi danh mục'}
      icon={<DatabaseOutlined />}
      formId={formId}
      isSaving={save.isPending}
      dirty={dirty}
    >
      <Card size="small" title="Thông tin bản ghi">
        <Form
          form={form}
          name={formId}
          layout="vertical"
          onValuesChange={() => setDirty(true)}
          onFinish={(v) => save.mutate(v)}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Mã" name="code"
                help={codeAutoGen ? 'Để trống để hệ thống tự sinh' : undefined}
                rules={editing || codeAutoGen ? [] : [{ required: true, message: 'Bắt buộc' }]}
              >
                <Input disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Thứ tự" name="sortOrder">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Tên" name="name" rules={[{ required: true, message: 'Bắt buộc' }, { max: 256 }]}>
                <Input />
              </Form.Item>
            </Col>
            {category.parentCategoryCode && (
              <Col span={24}>
                <Form.Item label="Cha" name="parentItemId" rules={[{ required: true, message: 'Bắt buộc' }]}>
                  <LookupItemSelect categoryCode={category.parentCategoryCode} placeholder="Chọn..." />
                </Form.Item>
              </Col>
            )}
            {category.ref1CategoryCode && (
              <Col span={12}>
                <Form.Item label="Tham chiếu 1" name="refItemId1">
                  <LookupItemSelect categoryCode={category.ref1CategoryCode} />
                </Form.Item>
              </Col>
            )}
            {category.ref2CategoryCode && (
              <Col span={12}>
                <Form.Item label="Tham chiếu 2" name="refItemId2">
                  <LookupItemSelect categoryCode={category.ref2CategoryCode} />
                </Form.Item>
              </Col>
            )}
            <Col span={24}>
              <Form.Item label="Ghi chú" name="note">
                <Input.TextArea rows={2} maxLength={1024} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Đang sử dụng" name="isActive" valuePropName="checked">
                <Switch />
              </Form.Item>
            </Col>
          </Row>
          {save.isError && (
            <Alert type="error" showIcon message={(save.error as ApiError)?.message ?? 'Đã có lỗi xảy ra.'} />
          )}
        </Form>
      </Card>
    </FormModalShell>
  );
}
