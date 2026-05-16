import { Alert, Card, Form, Input, message } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { userApi } from './api';
import type { UserDto } from './types';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { ApiError } from '@/shared/api/apiError';

interface Props {
  open: boolean;
  onClose: () => void;
  user: UserDto | null;
}

export function ResetPasswordModal({ open, onClose, user }: Props) {
  const [form] = Form.useForm();
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (open) { form.resetFields(); setDirty(false); }
  }, [open, form]);

  const reset = useMutation({
    mutationFn: (v: any) => userApi.resetPassword(user!.id, v.newPassword),
    onSuccess: () => {
      message.success('Đã đặt lại mật khẩu');
      setDirty(false);
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không đặt lại được'),
  });

  if (!user) return null;
  const formId = 'reset-password-form';

  return (
    <FormModalShell
      open={open} onClose={onClose}
      title="Đặt lại mật khẩu"
      subtitle={`Tài khoản: ${user.username} (${user.displayName})`}
      icon={<LockOutlined />}
      formId={formId} isSaving={reset.isPending} dirty={dirty}
      primaryLabel="Đặt lại mật khẩu"
      width={520}
    >
      <Card size="small" title="Mật khẩu mới">
        <Form form={form} name={formId} layout="vertical"
          onValuesChange={() => setDirty(true)}
          onFinish={(v) => reset.mutate(v)}
        >
          <Alert
            type="warning" showIcon style={{ marginBottom: 12 }}
            message="Mật khẩu cũ sẽ bị thay thế ngay; phiên đăng nhập hiện tại của người dùng sẽ bị vô hiệu hoá."
          />
          <Form.Item
            label="Mật khẩu mới" name="newPassword"
            rules={[{ required: true, message: 'Bắt buộc' }, { min: 6, max: 128, message: '6-128 ký tự' }]}
          >
            <Input.Password autoFocus autoComplete="new-password" />
          </Form.Item>
          <Form.Item
            label="Nhập lại mật khẩu" name="confirm"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: 'Bắt buộc' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject(new Error('Mật khẩu nhập lại không khớp'));
                },
              }),
            ]}
          >
            <Input.Password autoComplete="new-password" />
          </Form.Item>
        </Form>
      </Card>
    </FormModalShell>
  );
}
