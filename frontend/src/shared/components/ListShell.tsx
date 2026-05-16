import { Typography } from 'antd';

interface Props {
  title: React.ReactNode;
  rightExtra?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
  /** Trừ chiều cao header + padding để fill viewport. Mặc định 142px (header HRM ONE + nav + padding). */
  topOffset?: number;
}

/**
 * Layout cho các trang dạng danh sách: title + toolbar + body fill phần còn lại.
 * Body nên là grid (AG Grid) hoặc element flex 1.
 */
export function ListShell({ title, rightExtra, toolbar, children, topOffset = 142 }: Props) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: `calc(100vh - ${topOffset}px)`,
        minHeight: 0,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 12,
          flexShrink: 0,
        }}
      >
        <Typography.Title level={4} style={{ margin: 0, textTransform: 'uppercase' }}>
          {title}
        </Typography.Title>
        {rightExtra}
      </div>

      {toolbar && (
        <div
          style={{
            background: '#fff',
            border: '1px solid #E5E7EB',
            borderRadius: 12,
            padding: 12,
            marginBottom: 12,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            flexShrink: 0,
          }}
        >
          {toolbar}
        </div>
      )}

      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}
