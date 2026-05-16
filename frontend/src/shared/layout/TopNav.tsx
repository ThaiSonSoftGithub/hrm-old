import { Dropdown, Tag } from 'antd';
import { DownOutlined } from '@ant-design/icons';
import { useLocation, useNavigate } from 'react-router-dom';

interface NavItem {
  label: string;
  path?: string;
  comingSoon?: boolean;
  children?: { label: string; path: string }[];
}

const NAV: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard' },
  {
    label: 'Nhân sự',
    children: [
      { label: 'Danh sách nhân viên', path: '/employees' },
    ],
  },
  { label: 'Đào tạo', comingSoon: true },
  { label: 'KPI', comingSoon: true },
  { label: 'Lương', comingSoon: true },
  { label: 'Báo cáo', comingSoon: true },
  {
    label: 'Quản trị',
    children: [
      { label: 'Cơ cấu tổ chức', path: '/organization-units' },
      { label: 'Danh mục dùng chung', path: '/lookups' },
      { label: 'Người dùng hệ thống', path: '/users' },
      { label: 'Nhóm quyền', path: '/role-groups' },
      { label: 'Quyền', path: '/permissions' },
      { label: 'Nhóm chức năng', path: '/function-groups' },
      { label: 'Màn hình', path: '/screens' },
    ],
  },
];

export function TopNav() {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (item: NavItem): boolean => {
    if (item.path) return location.pathname.startsWith(item.path);
    if (item.children) return item.children.some((c) => location.pathname.startsWith(c.path));
    return false;
  };

  const itemStyle = (item: NavItem, active: boolean): React.CSSProperties => ({
    position: 'relative',
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    padding: '13px 18px 15px',
    fontSize: 15,
    fontWeight: active ? 700 : 500,
    color: item.comingSoon
      ? 'rgba(255,255,255,0.45)'
      : active
      ? '#FFFFFF'
      : 'rgba(255,255,255,0.78)',
    cursor: item.comingSoon ? 'not-allowed' : 'pointer',
    transition: 'color 120ms',
    userSelect: 'none',
  });

  const indicator: React.CSSProperties = {
    position: 'absolute',
    left: 12,
    right: 12,
    bottom: 0,
    height: 3,
    borderRadius: '3px 3px 0 0',
    background: '#FFD66B',
  };

  return (
    <nav
      style={{
        display: 'flex',
        alignItems: 'stretch',
        gap: 2,
        padding: '0 24px',
        background: 'linear-gradient(90deg, #2A3192 0%, #3B47C9 50%, #5B6CFF 100%)',
        boxShadow: '0 1px 2px rgba(15, 23, 42, 0.10)',
      }}
    >
      {NAV.map((item) => {
        const active = isActive(item);
        const onMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
          if (!item.comingSoon && !active) e.currentTarget.style.color = '#FFFFFF';
        };
        const onMouseLeave = (e: React.MouseEvent<HTMLElement>) => {
          if (!item.comingSoon && !active) e.currentTarget.style.color = 'rgba(255,255,255,0.78)';
        };

        if (item.comingSoon) {
          return (
            <span key={item.label} style={itemStyle(item, false)} title="Sắp ra mắt">
              {item.label}
              <Tag
                style={{
                  margin: 0,
                  fontSize: 10,
                  lineHeight: '14px',
                  padding: '0 5px',
                  background: 'rgba(255,255,255,0.12)',
                  border: 'none',
                  color: 'rgba(255,255,255,0.65)',
                }}
              >
                soon
              </Tag>
            </span>
          );
        }

        if (item.children) {
          return (
            <Dropdown
              key={item.label}
              trigger={['hover']}
              menu={{
                items: item.children.map((c) => ({ key: c.path, label: c.label })),
                onClick: (e) => navigate(e.key),
              }}
            >
              <span style={itemStyle(item, active)} onMouseEnter={onMouseEnter} onMouseLeave={onMouseLeave}>
                {item.label}
                <DownOutlined style={{ fontSize: 9, opacity: 0.7 }} />
                {active && <span style={indicator} />}
              </span>
            </Dropdown>
          );
        }

        return (
          <span
            key={item.label}
            style={itemStyle(item, active)}
            onClick={() => item.path && navigate(item.path)}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
          >
            {item.label}
            {active && <span style={indicator} />}
          </span>
        );
      })}
    </nav>
  );
}
