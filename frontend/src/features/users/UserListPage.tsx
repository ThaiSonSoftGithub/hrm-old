import { Button, Input, Popconfirm, Select, Space, Tag, message } from 'antd';
import {
  DeleteOutlined, EditOutlined, FilterOutlined, LockOutlined,
  PlusOutlined, ReloadOutlined, UnlockOutlined, UserAddOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { userApi } from './api';
import type { UserDto } from './types';
import { UserFormModal } from './UserFormModal';
import { ResetPasswordModal } from './ResetPasswordModal';
import { ListShell } from '@/shared/components/ListShell';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';
import { ApiError } from '@/shared/api/apiError';

export function UserListPage() {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<UserDto>>(null);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<'Active' | 'Locked' | undefined>();
  const [editing, setEditing] = useState<UserDto | null>(null);
  const [open, setOpen] = useState(false);
  const [resetting, setResetting] = useState<UserDto | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const listQuery = useQuery({
    queryKey: ['users', { keyword, status }],
    queryFn: () => userApi.list({ keyword: keyword || undefined, status, page: 1, pageSize: 1000 }),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await userApi.remove(id); },
    onSuccess: () => {
      message.success('Đã xóa');
      setSelectedIds([]);
      gridRef.current?.clearSelection();
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể xóa'),
  });

  const toggleLock = useMutation({
    mutationFn: ({ id, locked }: { id: string; locked: boolean }) =>
      locked ? userApi.unlock(id) : userApi.lock(id),
    onSuccess: () => {
      message.success('Đã cập nhật trạng thái');
      qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không cập nhật được'),
  });

  const data = listQuery.data?.items ?? [];
  const filterCount = (keyword ? 1 : 0) + (status ? 1 : 0);

  const columns = useMemo<ColDef<UserDto>[]>(() => [
    {
      headerName: 'Thao tác', width: 130, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<UserDto>) => {
        const u = p.data!;
        const locked = u.status === 'Locked';
        return (
          <Space size={2}>
            <Button type="text" size="small" icon={<EditOutlined />}
              onClick={() => { setEditing(u); setOpen(true); }} title="Sửa" />
            <Button type="text" size="small" icon={<LockOutlined />}
              onClick={() => setResetting(u)} title="Đặt lại mật khẩu" />
            <Button type="text" size="small"
              icon={locked ? <UnlockOutlined style={{ color: '#10B981' }} /> : <LockOutlined style={{ color: '#F59E0B' }} />}
              onClick={() => toggleLock.mutate({ id: u.id, locked })}
              title={locked ? 'Mở khoá' : 'Khoá tài khoản'}
            />
            <Popconfirm title={`Xóa ${u.username}?`} onConfirm={() => remove.mutate([u.id])} okText="Xóa" cancelText="Hủy">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </Space>
        );
      },
    },
    { field: 'username', headerName: 'Tài khoản', width: 180, pinned: 'left' },
    { field: 'displayName', headerName: 'Tên hiển thị', minWidth: 220, flex: 1 },
    { field: 'email', headerName: 'Email', minWidth: 220, flex: 1 },
    {
      headerName: 'Nhóm quyền', minWidth: 240, flex: 1,
      cellRenderer: (p: ICellRendererParams<UserDto>) => (
        <Space size={4} wrap>
          {p.data!.roleGroups.length === 0
            ? <span style={{ color: '#CBD5E1' }}>Chưa gán</span>
            : p.data!.roleGroups.map((g) => <Tag key={g.id} color="blue" style={{ margin: 0 }}>{g.code}</Tag>)}
        </Space>
      ),
    },
    {
      field: 'status', headerName: 'Trạng thái', width: 140,
      cellRenderer: (p: ICellRendererParams<UserDto>) =>
        p.value === 'Active'
          ? <Tag color="green">Đang hoạt động</Tag>
          : <Tag color="red">Đã khoá</Tag>,
    },
  ], [remove, toggleLock]);

  return (
    <ListShell
      title="Quản lý Người dùng"
      toolbar={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={8}>
              <Button type="primary" icon={<UserAddOutlined />} onClick={() => { setEditing(null); setOpen(true); }}>
                Thêm người dùng
              </Button>
              <Popconfirm
                title={`Xóa ${selectedIds.length} người dùng đã chọn?`}
                disabled={selectedIds.length === 0}
                onConfirm={() => remove.mutate(selectedIds)}
                okText="Xóa" cancelText="Hủy"
              >
                <Button danger icon={<DeleteOutlined />} disabled={selectedIds.length === 0}>
                  Xóa các ô đã chọn{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
                </Button>
              </Popconfirm>
            </Space>
            <Space size={8}>
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>
                {listQuery.data?.totalItems ?? 0} người dùng
                {filterCount > 0 && ` · ${filterCount} bộ lọc`}
              </span>
              <Button size="small" type="text" icon={<ReloadOutlined />}
                onClick={() => listQuery.refetch()} loading={listQuery.isFetching}>Tải lại</Button>
            </Space>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterOutlined style={{ color: '#9CA3AF' }} />
            <Input.Search
              placeholder="Tìm theo tài khoản, tên, email" allowClear style={{ width: 320 }}
              onSearch={(v) => setKeyword(v)}
            />
            <Select
              placeholder="Trạng thái" allowClear style={{ width: 180 }}
              value={status} onChange={setStatus}
              options={[
                { value: 'Active', label: 'Đang hoạt động' },
                { value: 'Locked', label: 'Đã khoá' },
              ]}
            />
            {filterCount > 0 && (
              <Button type="link" size="small" onClick={() => { setKeyword(''); setStatus(undefined); }}>
                Xóa toàn bộ lọc
              </Button>
            )}
          </div>
        </>
      }
    >
      <AgListGrid<UserDto>
        ref={gridRef}
        rowData={data}
        columnDefs={columns}
        getRowId={(d) => d.id}
        loading={listQuery.isLoading}
        emptyText="Chưa có người dùng"
        selectable
        onSelectionChange={(rows) => setSelectedIds(rows.map((r) => r.id))}
      />
      <UserFormModal open={open} onClose={() => setOpen(false)} editing={editing} />
      <ResetPasswordModal
        open={!!resetting}
        user={resetting}
        onClose={() => setResetting(null)}
      />

      {/* Suppress unused import (PlusOutlined giữ lại nếu cần) */}
      <span style={{ display: 'none' }}><PlusOutlined /></span>
    </ListShell>
  );
}
