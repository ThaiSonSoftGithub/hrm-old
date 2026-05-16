import { Alert, Button, Checkbox, Form, Input, Typography } from 'antd';
import {
  IdcardOutlined,
  CalendarOutlined,
  BarChartOutlined,
  UserOutlined,
  WalletOutlined,
  TeamOutlined,
  LockOutlined,
} from '@ant-design/icons';
import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ApiError } from '@/shared/api/apiError';
import { useAuth } from '@/shared/auth/useAuth';
import { BrandLogo } from '@/shared/layout/BrandLogo';

const FEATURES = [
  { icon: <IdcardOutlined />, label: 'Hồ sơ nhân sự' },
  { icon: <CalendarOutlined />, label: 'Chấm công' },
  { icon: <BarChartOutlined />, label: 'Đánh giá KPI' },
  { icon: <UserOutlined />, label: 'Tuyển dụng' },
  { icon: <WalletOutlined />, label: 'Tính lương' },
  { icon: <TeamOutlined />, label: 'Đào tạo' },
];

export function LoginPage() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (user) {
    const from = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname ?? '/';
    navigate(from, { replace: true });
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #F4F6FB 0%, #EEF1FE 100%)',
      }}
    >
      {/* Hero header */}
      <header style={{ padding: '28px 48px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <BrandLogo size="md" />
      </header>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px 48px' }}>
        <div
          style={{
            width: '100%',
            maxWidth: 1100,
            background: '#fff',
            borderRadius: 20,
            boxShadow: '0 12px 48px rgba(15, 23, 42, 0.08)',
            display: 'grid',
            gridTemplateColumns: '1.1fr 1px 0.9fr',
            overflow: 'hidden',
          }}
        >
          {/* LEFT: hero */}
          <div style={{ padding: '48px 48px 40px', display: 'flex', flexDirection: 'column' }}>
            <Typography.Title
              level={2}
              className="brand-logo"
              style={{ margin: 0, fontWeight: 800, color: '#1F2937', letterSpacing: -0.5 }}
            >
              Chào mừng <span style={{ color: '#5B6CFF' }}>trở lại</span>
            </Typography.Title>
            <Typography.Paragraph style={{ marginTop: 12, color: '#6B7280', fontSize: 15 }}>
              Nền tảng quản lý tập trung hồ sơ nhân viên, cơ cấu tổ chức, KPI, lương và đào tạo.
            </Typography.Paragraph>

            <div
              style={{
                marginTop: 28,
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 14,
              }}
            >
              {FEATURES.map((f) => (
                <div
                  key={f.label}
                  style={{
                    background: '#F8FAFF',
                    border: '1px solid #EEF1FE',
                    borderRadius: 12,
                    padding: '16px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 8,
                    color: '#3B47C9',
                    transition: 'transform 120ms, box-shadow 120ms',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.boxShadow = '0 6px 16px rgba(91, 108, 255, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'none';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <span style={{ fontSize: 24 }}>{f.icon}</span>
                  <span style={{ fontSize: 12.5, fontWeight: 600, color: '#374151', textAlign: 'center' }}>
                    {f.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* DIVIDER */}
          <div style={{ background: '#F0F2F7' }} />

          {/* RIGHT: form */}
          <div style={{ padding: '48px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <Typography.Title level={4} style={{ margin: 0, fontWeight: 700, color: '#1F2937' }}>
              Đăng nhập
            </Typography.Title>
            <Typography.Paragraph style={{ color: '#6B7280', marginTop: 4, marginBottom: 20 }}>
              Sử dụng tài khoản nội bộ để tiếp tục
            </Typography.Paragraph>

            {error && <Alert type="error" message={error} style={{ marginBottom: 16 }} />}

            <Form
              layout="vertical"
              initialValues={{ remember: true }}
              onFinish={async (values) => {
                setSubmitting(true);
                setError(null);
                try {
                  await login(values.username, values.password);
                  navigate('/', { replace: true });
                } catch (e) {
                  setError(e instanceof ApiError ? e.message : 'Đăng nhập thất bại.');
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <Form.Item
                label="Tên tài khoản"
                name="username"
                rules={[{ required: true, message: 'Bắt buộc' }]}
              >
                <Input
                  prefix={<UserOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="Nhập tên tài khoản"
                  autoFocus
                  autoComplete="username"
                />
              </Form.Item>
              <Form.Item
                label="Mật khẩu"
                name="password"
                rules={[{ required: true, message: 'Bắt buộc' }]}
              >
                <Input.Password
                  prefix={<LockOutlined style={{ color: '#9CA3AF' }} />}
                  placeholder="Nhập mật khẩu"
                  autoComplete="current-password"
                />
              </Form.Item>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <Form.Item name="remember" valuePropName="checked" noStyle>
                  <Checkbox>Nhớ thông tin đăng nhập</Checkbox>
                </Form.Item>
                <a style={{ color: '#5B6CFF', fontSize: 13 }} onClick={(e) => e.preventDefault()}>
                  Quên mật khẩu?
                </a>
              </div>

              <Button type="primary" htmlType="submit" block loading={submitting}>
                Đăng nhập
              </Button>
            </Form>
          </div>
        </div>
      </div>

      <footer
        style={{
          textAlign: 'center', padding: '16px 24px 24px',
          color: '#9CA3AF', fontSize: 13,
        }}
      >
        © 2026 Công ty TNHH Phát triển Công nghệ Thái Sơn
      </footer>
    </div>
  );
}
