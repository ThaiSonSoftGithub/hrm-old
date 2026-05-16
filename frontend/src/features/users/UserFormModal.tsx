import { Alert, Card, Col, Form, Input, Row, Select, message } from 'antd';
import { UserAddOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { userApi } from './api';
import type { UserDto } from './types';
import { roleGroupApi } from '@/features/authorization/api';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { ApiError } from '@/shared/api/apiError';

interface Props {
  open: boolean;
  onClose: () => void;
  editing: UserDto | null;
}

export function UserFormModal({ open, onClose, editing }: Props) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);

  const roleGroupsQuery = useQuery({
    queryKey: ['role-groups', 'options'],
    queryFn: () => roleGroupApi.list({ page: 1, pageSize: 200 }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (editing) {
      form.setFieldsValue({
        username: editing.username,
        displayName: editing.displayName,
        email: editing.email,
        roleGroupIds: editing.roleGroups.map((r) => r.id),
      });
    }
    setDirty(false);
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: async (v: any) => {
      if (editing) {
        return userApi.update(editing.id, {
          displayName: v.displayName,
          email: v.email ?? null,
          roleGroupIds: v.roleGroupIds ?? [],
        });
      }
      return userApi.create({
        username: v.username.trim(),
        password: v.password,
        displayName: v.displayName.trim(),
        email: v.email ?? null,
        roleGroupIds: v.roleGroupIds ?? [],
      });
    },
    onSuccess: () => {
      message.success('Đã lưu');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['users'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  const formId = 'user-form';
  const roleOptions = (roleGroupsQuery.data?.items ?? []).map((r) => ({
    value: r.id, label: `${r.code} - ${r.name}`,
  }));

  return (
    <FormModalShell
      open={open} onClose={onClose}
      title={editing ? 'Sửa thông tin người dùng' : 'Thêm người dùng'}
      subtitle={editing ? `Tài khoản: ${editing.username}` : 'Tạo tài khoản đăng nhập hệ thống'}
      icon={<UserAddOutlined />}
      formId={formId} isSaving={save.isPending} dirty={dirty}
      width={720}
    >
      <Form form={form} name={formId} layout="vertical"
        onValuesChange={() => setDirty(true)}
        onFinish={(v) => save.mutate(v)}
      >
        <Card size="small" title="Thông tin tài khoản" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                label="Tên đăng nhập" name="username"
                rules={editing ? [] : [
                  { required: true, message: 'Bắt buộc' },
                  { min: 3, max: 64, message: '3-64 ký tự' },
                  { pattern: /^[a-zA-Z0-9._-]+$/, message: 'Chỉ chứa chữ, số, . _ -' },
                ]}
              >
                <Input disabled={!!editing} placeholder="VD: nv.tuyen" autoComplete="off" />
              </Form.Item>
            </Col>
            <Col span={12}>
              {!editing ? (
                <Form.Item
                  label="Mật khẩu khởi tạo" name="password"
                  rules={[{ required: true, message: 'Bắt buộc' }, { min: 6, max: 128, message: '6-128 ký tự' }]}
                >
                  <Input.Password autoComplete="new-password" />
                </Form.Item>
              ) : (
                <Form.Item label="Trạng thái">
                  <Input value={editing.status === 'Active' ? 'Đang hoạt động' : 'Đã khoá'} disabled />
                </Form.Item>
              )}
            </Col>
            <Col span={12}>
              <Form.Item label="Tên hiển thị" name="displayName" rules={[{ required: true, message: 'Bắt buộc' }, { max: 128 }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Email" name="email" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
                <Input maxLength={256} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        <Card size="small" title="Nhóm quyền">
          <Form.Item
            label="Gán nhóm quyền" name="roleGroupIds"
            help="Người dùng nhận tất cả quyền thuộc các nhóm được gán."
          >
            <Select
              mode="multiple" allowClear
              showSearch optionFilterProp="label"
              placeholder="Chọn nhóm quyền"
              options={roleOptions}
              loading={roleGroupsQuery.isLoading}
            />
          </Form.Item>
        </Card>

        {save.isError && (
          <Alert type="error" showIcon style={{ marginTop: 12 }}
            message={(save.error as ApiError)?.message ?? 'Đã có lỗi xảy ra.'} />
        )}
      </Form>
    </FormModalShell>
  );
}
