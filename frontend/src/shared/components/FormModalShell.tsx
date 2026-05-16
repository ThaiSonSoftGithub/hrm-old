import { Avatar, Button, Modal, Space, Typography } from 'antd';
import type { ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  subtitle?: ReactNode;
  icon: ReactNode;
  /** Form id để footer button "Lưu" trigger submit. */
  formId: string;
  isSaving?: boolean;
  /** Khi user đã đổi gì đó nhưng chưa lưu — đóng sẽ confirm. */
  dirty?: boolean;
  /** Disable nút primary nếu chưa nhập gì cần lưu. Mặc định = !dirty. */
  primaryDisabled?: boolean;
  primaryLabel?: string;
  /** Width modal: 480 cho form ngắn, 720 vừa, 1180 cho form lớn nhiều section. */
  width?: number | string;
  /** Chiều cao body. Mặc định auto (vừa nội dung). Truyền '78vh' nếu form lớn nhiều section. */
  bodyHeight?: number | string;
  children: ReactNode;
  /** Action phụ giữa Hủy và Lưu (vd "Lưu & tạo mới"). */
  extraActions?: ReactNode;
}

/**
 * Shell chuẩn cho các modal create/edit: header avatar + title, body chứa form,
 * footer ghim Hủy + Lưu. Form bên trong nên dùng `name={formId}` để submit qua
 * button footer (htmlType="submit" + form={formId}).
 */
export function FormModalShell({
  open, onClose, title, subtitle, icon,
  formId, isSaving, dirty, primaryDisabled, primaryLabel = 'Lưu thay đổi',
  width = 720, bodyHeight, extraActions, children,
}: Props) {
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

  const bodyStyle: React.CSSProperties = {
    padding: 0,
    display: 'flex',
    flexDirection: 'column',
  };
  if (bodyHeight) bodyStyle.height = bodyHeight;

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={width}
      destroyOnClose
      title={null}
      closable={false}
      maskClosable={false}
      keyboard={false}
      styles={{ body: bodyStyle }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid #F0F2F7', flexShrink: 0,
        }}
      >
        <Space size={14} align="center">
          <Avatar size={42} style={{ background: '#5B6CFF' }}>{icon}</Avatar>
          <div>
            <Typography.Text strong style={{ fontSize: 15, color: '#1F2937' }}>
              {title}
            </Typography.Text>
            {subtitle && (
              <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
        </Space>
      </div>

      <div
        style={{
          flex: bodyHeight ? 1 : undefined,
          minHeight: 0,
          overflow: bodyHeight ? 'auto' : 'visible',
          padding: 16,
          background: '#fff',
        }}
      >
        {children}
      </div>

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
          {extraActions}
          <Button onClick={handleCancel}>Hủy</Button>
          <Button
            type="primary"
            form={formId}
            htmlType="submit"
            loading={isSaving}
            disabled={primaryDisabled ?? !dirty}
          >
            {primaryLabel}
          </Button>
        </Space>
      </div>
    </Modal>
  );
}
