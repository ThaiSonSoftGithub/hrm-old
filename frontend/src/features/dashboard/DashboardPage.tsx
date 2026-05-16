import { Avatar, Card, Col, Empty, Progress, Row, Skeleton, Space, Tag, Typography } from 'antd';
import {
  ApartmentOutlined, ArrowUpOutlined, BarChartOutlined,
  BookOutlined, CalendarOutlined, ClockCircleOutlined,
  DollarOutlined, EnvironmentOutlined, FileSearchOutlined,
  IdcardOutlined, KeyOutlined, PlusOutlined, RiseOutlined,
  RocketOutlined, SafetyCertificateOutlined, SolutionOutlined,
  TeamOutlined, TrophyOutlined, UserOutlined,
} from '@ant-design/icons';
import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { employeeApi } from '@/features/employees/api';
import { organizationApi } from '@/features/organization/api';
import { permissionApi, roleGroupApi } from '@/features/authorization/api';
import { useAuth } from '@/shared/auth/useAuth';

interface StatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: { value: string; up: boolean };
  loading?: boolean;
}

function StatCard({ title, value, icon, color, trend, loading }: StatCardProps) {
  return (
    <Card style={{ height: '100%' }} styles={{ body: { padding: 18 } }}>
      <Space size={14} align="start" style={{ width: '100%' }}>
        <span
          style={{
            width: 44, height: 44, borderRadius: 10,
            background: `${color}1A`, color,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, color: '#9CA3AF', textTransform: 'uppercase', fontWeight: 600, letterSpacing: 0.4 }}>
            {title}
          </div>
          {loading ? (
            <Skeleton.Button active size="small" style={{ marginTop: 8, width: 80 }} />
          ) : (
            <div style={{ fontSize: 24, fontWeight: 700, color: '#1F2937', marginTop: 2 }}>{value}</div>
          )}
          {trend && (
            <div style={{ marginTop: 4, fontSize: 12, color: trend.up ? '#10B981' : '#EF4444' }}>
              <ArrowUpOutlined style={{ transform: trend.up ? 'none' : 'rotate(180deg)', marginRight: 4 }} />
              {trend.value}
            </div>
          )}
        </div>
      </Space>
    </Card>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  onClick?: () => void;
  comingSoon?: boolean;
}

function QuickActionCard({ title, description, icon, color, onClick, comingSoon }: QuickActionProps) {
  return (
    <Card
      hoverable={!comingSoon}
      onClick={comingSoon ? undefined : onClick}
      styles={{ body: { padding: 16 } }}
      style={{
        height: '100%',
        cursor: comingSoon ? 'not-allowed' : 'pointer',
        opacity: comingSoon ? 0.7 : 1,
      }}
    >
      <Space size={12} align="start" style={{ width: '100%' }}>
        <span
          style={{
            width: 38, height: 38, borderRadius: 9,
            background: `${color}1A`, color,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 18, flexShrink: 0,
          }}
        >
          {icon}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 14, fontWeight: 600, color: '#1F2937' }}>{title}</span>
            {comingSoon && (
              <Tag style={{ margin: 0, fontSize: 10, lineHeight: '14px', padding: '0 5px' }}>soon</Tag>
            )}
          </div>
          <div style={{ fontSize: 12.5, color: '#6B7280', marginTop: 2 }}>{description}</div>
        </div>
      </Space>
    </Card>
  );
}

const COMING_FEATURES = [
  { title: 'Chấm công', desc: 'Theo dõi giờ vào/ra, tăng ca, OT', icon: <ClockCircleOutlined />, color: '#5B6CFF' },
  { title: 'Tính lương', desc: 'Bảng lương 3P, bảo hiểm, thuế TNCN', icon: <DollarOutlined />, color: '#10B981' },
  { title: 'KPI & Đánh giá', desc: 'Mục tiêu cá nhân, OKR, review hiệu suất', icon: <RiseOutlined />, color: '#F59E0B' },
  { title: 'Đào tạo', desc: 'Khoá học, đăng ký, chứng chỉ nội bộ', icon: <BookOutlined />, color: '#0EA5E9' },
  { title: 'Nghỉ phép', desc: 'Đăng ký, duyệt, theo dõi quỹ phép', icon: <CalendarOutlined />, color: '#EC4899' },
  { title: 'Tuyển dụng', desc: 'Job posting, ứng viên, lịch phỏng vấn', icon: <UserOutlined />, color: '#8B5CF6' },
  { title: 'Khen thưởng', desc: 'Thưởng tháng/quý, vinh danh nhân viên', icon: <TrophyOutlined />, color: '#FFD66B' },
  { title: 'Báo cáo', desc: 'Báo cáo nhân sự, biến động, dashboard điều hành', icon: <BarChartOutlined />, color: '#64748B' },
];

const RECENT_ACTIVITIES = [
  { who: 'System', what: 'đã import 230 nhân viên từ file Excel', when: 'Hôm nay, 09:30', color: '#5B6CFF' },
  { who: 'Admin', what: 'cập nhật cấu trúc tổ chức Thái Sơn', when: 'Hôm nay, 08:15', color: '#10B981' },
  { who: 'System', what: 'seed 51 vị trí công việc mới', when: 'Hôm qua, 16:42', color: '#F59E0B' },
  { who: 'Admin', what: 'đăng nhập từ trình duyệt mới', when: 'Hôm qua, 14:20', color: '#0EA5E9' },
  { who: 'System', what: 'khởi tạo 9 phòng ban', when: '2 ngày trước', color: '#EC4899' },
];

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 11) return 'Chào buổi sáng';
  if (h < 14) return 'Chào buổi trưa';
  if (h < 18) return 'Chào buổi chiều';
  return 'Chào buổi tối';
}

export function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const employees = useQuery({
    queryKey: ['dashboard', 'employees'],
    queryFn: () => employeeApi.list({ page: 1, pageSize: 1000 }),
  });
  const orgs = useQuery({
    queryKey: ['dashboard', 'orgs'],
    queryFn: () => organizationApi.list({ page: 1, pageSize: 500 }),
  });
  const roleGroups = useQuery({
    queryKey: ['dashboard', 'role-groups'],
    queryFn: () => roleGroupApi.list({ page: 1, pageSize: 1 }),
  });
  const perms = useQuery({
    queryKey: ['dashboard', 'permissions'],
    queryFn: () => permissionApi.list({ page: 1, pageSize: 1 }),
  });

  const distribution = useMemo(() => {
    const items = employees.data?.items ?? [];
    const map = new Map<string, number>();
    items.forEach((e) => {
      const k = e.departmentLabel ?? 'Chưa có phòng ban';
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    const arr = Array.from(map.entries())
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8);
    const max = arr[0]?.count ?? 1;
    return { rows: arr, max, total: items.length };
  }, [employees.data]);

  const today = new Date().toLocaleDateString('vi-VN', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  return (
    <div>
      {/* Welcome */}
      <Card
        style={{
          marginBottom: 16,
          background: 'linear-gradient(135deg, #5B6CFF 0%, #3B47C9 100%)',
          border: 'none',
        }}
        styles={{ body: { padding: 18 } }}
      >
        <Space size={14} align="center">
          <Avatar size={44} style={{ background: 'rgba(255,255,255,0.2)', color: '#fff' }} icon={<UserOutlined />} />
          <div>
            <div style={{ margin: 0, color: '#fff', fontWeight: 700, fontSize: 18, lineHeight: 1.3 }}>
              {getGreeting()}, {user?.displayName ?? user?.username}
            </div>
            <Typography.Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 12.5 }}>
              {today.charAt(0).toUpperCase() + today.slice(1)} · Chúc bạn một ngày làm việc hiệu quả
            </Typography.Text>
          </div>
        </Space>
      </Card>

      {/* Stats */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Nhân viên"
            value={employees.data?.totalItems ?? 0}
            icon={<IdcardOutlined />} color="#5B6CFF"
            trend={{ value: '+12 trong tháng', up: true }}
            loading={employees.isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Đơn vị tổ chức"
            value={orgs.data?.totalItems ?? 0}
            icon={<ApartmentOutlined />} color="#10B981"
            loading={orgs.isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Nhóm quyền"
            value={roleGroups.data?.totalItems ?? 0}
            icon={<SafetyCertificateOutlined />} color="#F59E0B"
            loading={roleGroups.isLoading}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <StatCard
            title="Quyền hệ thống"
            value={perms.data?.totalItems ?? 0}
            icon={<KeyOutlined />} color="#EC4899"
            loading={perms.isLoading}
          />
        </Col>
      </Row>

      {/* Quick actions */}
      <Card
        title={<Space><RocketOutlined style={{ color: '#5B6CFF' }} /> Truy cập nhanh</Space>}
        size="small"
        style={{ marginBottom: 16 }}
      >
        <Row gutter={[12, 12]}>
          <Col xs={24} sm={12} lg={6}>
            <QuickActionCard
              title="Thêm nhân viên" description="Tạo hồ sơ nhân sự mới"
              icon={<PlusOutlined />} color="#5B6CFF"
              onClick={() => navigate('/employees')}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <QuickActionCard
              title="Danh sách nhân viên" description="Xem và quản lý hồ sơ"
              icon={<TeamOutlined />} color="#10B981"
              onClick={() => navigate('/employees')}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <QuickActionCard
              title="Cơ cấu tổ chức" description="Phòng ban, chi nhánh, vị trí"
              icon={<ApartmentOutlined />} color="#F59E0B"
              onClick={() => navigate('/organization-units')}
            />
          </Col>
          <Col xs={24} sm={12} lg={6}>
            <QuickActionCard
              title="Phân quyền hệ thống" description="Nhóm quyền và người dùng"
              icon={<SafetyCertificateOutlined />} color="#EC4899"
              onClick={() => navigate('/role-groups')}
            />
          </Col>
        </Row>
      </Card>

      {/* Distribution + Activity */}
      <Row gutter={[12, 12]} style={{ marginBottom: 16 }}>
        <Col xs={24} lg={14}>
          <Card
            title={<Space><BarChartOutlined style={{ color: '#5B6CFF' }} /> Phân bổ nhân viên theo phòng ban</Space>}
            size="small"
            extra={<Tag style={{ margin: 0 }}>Top 8</Tag>}
            style={{ height: '100%' }}
          >
            {employees.isLoading ? (
              <Skeleton active />
            ) : distribution.rows.length === 0 ? (
              <Empty description="Chưa có dữ liệu" />
            ) : (
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {distribution.rows.map((r) => (
                  <div key={r.label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontSize: 13, color: '#1F2937', fontWeight: 500 }}>{r.label}</span>
                      <span style={{ fontSize: 12, color: '#6B7280' }}>
                        {r.count} <span style={{ color: '#CBD5E1' }}>({Math.round((r.count / distribution.total) * 100)}%)</span>
                      </span>
                    </div>
                    <Progress
                      percent={Math.round((r.count / distribution.max) * 100)}
                      showInfo={false}
                      strokeColor="#5B6CFF"
                      trailColor="#F4F6FB"
                      size="small"
                    />
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </Col>
        <Col xs={24} lg={10}>
          <Card
            title={<Space><FileSearchOutlined style={{ color: '#5B6CFF' }} /> Hoạt động gần đây</Space>}
            size="small"
            extra={<Tag style={{ margin: 0, fontSize: 10 }}>mockup</Tag>}
            style={{ height: '100%' }}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              {RECENT_ACTIVITIES.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 10 }}>
                  <span
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: a.color, marginTop: 6, flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, color: '#1F2937' }}>
                      <span style={{ fontWeight: 600 }}>{a.who}</span> {a.what}
                    </div>
                    <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>{a.when}</div>
                  </div>
                </div>
              ))}
            </Space>
          </Card>
        </Col>
      </Row>

      {/* Coming soon */}
      <Card
        title={<Space><EnvironmentOutlined style={{ color: '#5B6CFF' }} /> Sắp ra mắt</Space>}
        size="small"
        extra={<Typography.Text type="secondary" style={{ fontSize: 12 }}>Roadmap tính năng</Typography.Text>}
      >
        <Row gutter={[12, 12]}>
          {COMING_FEATURES.map((f) => (
            <Col key={f.title} xs={24} sm={12} md={8} lg={6}>
              <div
                style={{
                  background: '#FAFBFF',
                  border: '1px dashed #E5E7EB',
                  borderRadius: 10,
                  padding: 14,
                  display: 'flex', gap: 10, alignItems: 'flex-start',
                }}
              >
                <span
                  style={{
                    width: 36, height: 36, borderRadius: 8,
                    background: `${f.color}1A`, color: f.color,
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 18, flexShrink: 0,
                  }}
                >
                  {f.icon}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 13.5, fontWeight: 600, color: '#1F2937' }}>{f.title}</span>
                    <Tag style={{ margin: 0, fontSize: 10, lineHeight: '14px', padding: '0 5px' }}>soon</Tag>
                  </div>
                  <div style={{ fontSize: 12, color: '#6B7280', marginTop: 4, lineHeight: 1.4 }}>{f.desc}</div>
                </div>
              </div>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Suppress unused-import warnings for icons reserved cho roadmap */}
      <span style={{ display: 'none' }}>
        <SolutionOutlined />
      </span>
    </div>
  );
}
