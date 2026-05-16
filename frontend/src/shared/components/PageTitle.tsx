import { Typography } from 'antd';

export function PageTitle({ children }: { children: React.ReactNode }) {
  return (
    <Typography.Title level={4} style={{ margin: '0 0 12px', fontWeight: 600 }}>
      {children}
    </Typography.Title>
  );
}
