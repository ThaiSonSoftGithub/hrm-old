import { Alert, Avatar, Button, Skeleton, Space, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, UserOutlined } from '@ant-design/icons';
// ArrowLeftOutlined giữ lại cho Alert error fallback button
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { employeeApi } from './api';
import { EmployeeProfileLayout } from './EmployeeProfileLayout';
import { ApiError } from '@/shared/api/apiError';

export function EmployeeDetailPage() {
  const { id = '' } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();

  const summary = useQuery({
    queryKey: ['employee', id, 'summary'],
    queryFn: () => employeeApi.summary(id),
    enabled: !!id,
  });

  const activeTab = search.get('tab') ?? 'tab-01-general';
  const setActiveTab = (key: string) => {
    const next = new URLSearchParams(search);
    next.set('tab', key);
    setSearch(next, { replace: true });
  };

  if (summary.isLoading) return <Skeleton active />;
  if (summary.isError) {
    const err = summary.error as ApiError;
    return (
      <div>
        <Space style={{ marginBottom: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/employees')}>Về danh sách</Button>
        </Space>
        <Alert type="error" showIcon message="Không tải được hồ sơ" description={err?.message ?? ''} />
      </div>
    );
  }

  const s = summary.data!;

  return (
    <div
      style={{
        background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
        height: 'calc(100vh - 140px)', display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid #F0F2F7',
        }}
      >
        <Space size={14} align="center">
          <Avatar size={42} style={{ background: '#5B6CFF' }} icon={<UserOutlined />} />
          <div>
            <Typography.Text strong style={{ fontSize: 15, color: '#1F2937' }}>
              {s.fullName}
            </Typography.Text>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              <span>{s.employeeCode}</span>
              {s.jobPositionLabel && <span> · {s.jobPositionLabel}</span>}
              {s.workingStatusLabel && <Tag color="blue" style={{ marginLeft: 8 }}>{s.workingStatusLabel}</Tag>}
            </div>
          </div>
        </Space>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
        <EmployeeProfileLayout
          employeeId={id}
          activeTab={activeTab}
          onActiveTabChange={setActiveTab}
          onCancel={() => navigate('/employees')}
          cancelLabel="Về danh sách"
        />
      </div>
    </div>
  );
}
