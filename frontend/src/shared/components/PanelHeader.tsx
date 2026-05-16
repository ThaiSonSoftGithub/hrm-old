import { Space, Typography } from 'antd';

export function PanelHeader({ title, extra }: { title: React.ReactNode; extra?: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#fafafa',
        border: '1px solid #f0f0f0',
        padding: '8px 12px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Typography.Text strong>{title}</Typography.Text>
      <Space size={8}>{extra}</Space>
    </div>
  );
}
