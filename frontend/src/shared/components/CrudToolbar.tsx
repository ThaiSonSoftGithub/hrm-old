import { Button, Popconfirm, Space } from 'antd';
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

interface Props {
  onAdd: () => void;
  onBulkDelete?: () => void;
  selectedCount?: number;
  bulkDeleteTitle?: string;
  rightExtra?: React.ReactNode;
}

export function CrudToolbar({ onAdd, onBulkDelete, selectedCount = 0, bulkDeleteTitle = 'Xóa các bản ghi đã chọn?', rightExtra }: Props) {
  return (
    <div
      style={{
        background: '#fafafa',
        border: '1px solid #f0f0f0',
        padding: '8px 12px',
        marginBottom: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <Space size={8}>
        <Button type="primary" icon={<PlusOutlined />} onClick={onAdd}>Thêm mới</Button>
        {onBulkDelete && (
          <Popconfirm
            title={bulkDeleteTitle}
            disabled={selectedCount === 0}
            onConfirm={onBulkDelete}
            okText="Xóa" cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} disabled={selectedCount === 0}>
              Xóa{selectedCount > 0 ? ` (${selectedCount})` : ''}
            </Button>
          </Popconfirm>
        )}
      </Space>
      <div>{rightExtra}</div>
    </div>
  );
}
