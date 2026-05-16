import { Avatar, Button, Modal, Space, Tag, Typography } from 'antd';
import { ExportOutlined, UserOutlined } from '@ant-design/icons';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { EmployeeProfileLayout } from './EmployeeProfileLayout';
import { employeeApi } from './api';

interface Props {
  employeeId: string | null;
  initialTab?: string;
  onClose: () => void;
}

/**
 * Modal chi tiết nhân viên — mở từ list/bottom panel. Header trong modal hiển thị
 * avatar + tên + tag trạng thái. Body delegate cho EmployeeProfileLayout.
 */
export function EmployeeProfileModal({ employeeId, initialTab, onClose }: Props) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>(initialTab ?? 'tab-01-general');

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab, employeeId]);

  const summary = useQuery({
    queryKey: ['employee', employeeId, 'summary'],
    queryFn: () => employeeApi.summary(employeeId!),
    enabled: !!employeeId,
  });

  const s = summary.data;

  return (
    <Modal
      open={!!employeeId}
      onCancel={onClose}
      footer={null}
      width="min(1180px, 96vw)"
      destroyOnClose
      title={null}
      closable={false}
      maskClosable={false}
      keyboard={false}
      styles={{ body: { padding: 0, height: '78vh', display: 'flex', flexDirection: 'column' } }}
    >
      {/* Custom header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid #F0F2F7',
          background: '#fff',
        }}
      >
        <Space size={14} align="center">
          <Avatar size={42} style={{ background: '#5B6CFF' }} icon={<UserOutlined />} />
          <div>
            <Typography.Text strong style={{ fontSize: 15, color: '#1F2937' }}>
              {s?.fullName ?? '...'}
            </Typography.Text>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              <span>{s?.employeeCode ?? ''}</span>
              {s?.jobPositionLabel && <span> · {s.jobPositionLabel}</span>}
              {s?.workingStatusLabel && (
                <Tag color="blue" style={{ marginLeft: 8 }}>{s.workingStatusLabel}</Tag>
              )}
            </div>
          </div>
        </Space>
        <Space size={8}>
          {employeeId && (
            <Button
              type="text" icon={<ExportOutlined />}
              onClick={() => { onClose(); navigate(`/employees/${employeeId}?tab=${activeTab}`); }}
            >
              Mở trong trang
            </Button>
          )}
        </Space>
      </div>

      {employeeId && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <EmployeeProfileLayout
            employeeId={employeeId}
            activeTab={activeTab}
            onActiveTabChange={setActiveTab}
            onCancel={onClose}
            cancelLabel="Đóng"
          />
        </div>
      )}
    </Modal>
  );
}
