import { Avatar, Badge, Button, Dropdown, Space } from 'antd';
import { BellOutlined, LogoutOutlined, MailOutlined, UserOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/shared/auth/useAuth';
import { BrandLogo } from './BrandLogo';

export function HeaderBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 24px',
        background: '#fff',
      }}
    >
      <BrandLogo size="md" />
      <Space size={12} align="center">
        <Badge dot offset={[-6, 6]} styles={{ root: { display: 'inline-flex', marginTop: 4 } }}>
          <Avatar
            size={32}
            shape="circle"
            style={{ background: '#F4F6FB', color: '#6B7280', cursor: 'pointer' }}
            icon={<MailOutlined style={{ fontSize: 16 }} />}
          />
        </Badge>
        <Badge count={20} size="small" overflowCount={99} offset={[-6, 6]} styles={{ root: { display: 'inline-flex', marginTop: 4, marginRight: 5 } }}>
          <Avatar
            size={32}
            shape="circle"
            style={{ background: '#F4F6FB', color: '#6B7280', cursor: 'pointer' }}
            icon={<BellOutlined style={{ fontSize: 16 }} />}
          />
        </Badge>
        <Dropdown
          menu={{
            items: [
              {
                key: 'logout',
                icon: <LogoutOutlined />,
                label: 'Đăng xuất',
                onClick: async () => { await logout(); navigate('/login', { replace: true }); },
              },
            ],
          }}
        >
          <Space size={10} style={{ cursor: 'pointer' }}>
            <Avatar size={32} style={{ background: '#5B6CFF' }} icon={<UserOutlined />} />
            <span style={{ fontWeight: 500, color: '#1F2937' }}>
              {user?.displayName ?? user?.username}
            </span>
          </Space>
        </Dropdown>
      </Space>
    </div>
  );
}
