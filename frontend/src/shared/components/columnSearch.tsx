import { Input } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnType } from 'antd/es/table';

export function columnSearch<T>(placeholder = 'Lọc'): Partial<ColumnType<T>> {
  return {
    filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters }) => (
      <div style={{ padding: 8 }}>
        <Input
          autoFocus
          placeholder={placeholder}
          value={selectedKeys[0] as string}
          onChange={(e) => setSelectedKeys(e.target.value ? [e.target.value] : [])}
          onPressEnter={() => confirm()}
          style={{ display: 'block', width: 220, marginBottom: 8 }}
        />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <a onClick={() => { clearFilters?.(); confirm(); }}>Bỏ lọc</a>
          <a onClick={() => confirm()}>Áp dụng</a>
        </div>
      </div>
    ),
    filterIcon: (filtered: boolean) => (
      <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />
    ),
  };
}

export const showTotalVi = (total: number, range: [number, number]) =>
  `Hiển thị ${range[0]}-${range[1]} trong tổng số ${total} bản ghi`;
