import { Button, Input, Popconfirm, Select, Space, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, FilterOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { lookupApi } from './api';
import type { LookupCategoryDto, LookupItemDto } from './types';
import { LookupFormModal } from './components/LookupFormModal';
import { LookupItemSelect } from './components/LookupItemSelect';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';
import { ApiError } from '@/shared/api/apiError';

interface Props {
  category: LookupCategoryDto;
}

/** Body chính của 1 danh mục — dùng trong LookupExplorerPage (cột phải). */
export function LookupListContent({ category }: Props) {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<LookupItemDto>>(null);
  const [keyword, setKeyword] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [parentId, setParentId] = useState<string | undefined>(undefined);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [editing, setEditing] = useState<LookupItemDto | null>(null);
  const [open, setOpen] = useState(false);

  const itemsQuery = useQuery({
    queryKey: ['lookup-items', category.code, { keyword, isActive, parentId }],
    queryFn: () =>
      lookupApi.listItems(category.code, {
        keyword: keyword || undefined,
        isActive,
        parentId,
        page: 1,
        pageSize: 1000,
      }),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await lookupApi.deleteItem(category.code, id); },
    onSuccess: () => {
      message.success('Đã xóa');
      setSelectedIds([]);
      gridRef.current?.clearSelection();
      qc.invalidateQueries({ queryKey: ['lookup-items', category.code] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể xóa'),
  });

  const data = itemsQuery.data?.items ?? [];
  const filterCount = (keyword ? 1 : 0) + (isActive !== undefined ? 1 : 0) + (parentId ? 1 : 0);

  const columns: ColDef<LookupItemDto>[] = useMemo(() => [
    {
      headerName: 'Thao tác', width: 90, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<LookupItemDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data!); setOpen(true); }} />
          <Popconfirm title={`Xóa ${p.data!.code}?`} onConfirm={() => remove.mutate([p.data!.id])} okText="Xóa" cancelText="Hủy">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    { field: 'code', headerName: 'Mã', width: 160, pinned: 'left' },
    { field: 'name', headerName: 'Tên', minWidth: 240, flex: 1 },
    ...(category.parentCategoryCode
      ? [{
          headerName: 'Cha', minWidth: 200, flex: 1,
          valueGetter: (p: any) => p.data?.parent ? `${p.data.parent.code} - ${p.data.parent.name}` : '',
        } as ColDef<LookupItemDto>]
      : []),
    { field: 'note', headerName: 'Ghi chú', minWidth: 220, flex: 1 },
    {
      field: 'isActive', headerName: 'Trạng thái', width: 130,
      cellRenderer: (p: ICellRendererParams<LookupItemDto>) =>
        p.value ? <Tag color="green">Đang dùng</Tag> : <Tag>Ngừng</Tag>,
    },
  ], [category.parentCategoryCode, remove]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      <div
        style={{
          background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
          padding: 12, marginBottom: 12,
          display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Space size={8}>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setOpen(true); }}>
              Thêm bản ghi
            </Button>
            <Popconfirm
              title={`Xóa ${selectedIds.length} bản ghi đã chọn?`}
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
              {itemsQuery.data?.totalItems ?? 0} bản ghi
              {filterCount > 0 && ` · ${filterCount} bộ lọc`}
            </span>
            <Button size="small" type="text" icon={<ReloadOutlined />}
              onClick={() => itemsQuery.refetch()} loading={itemsQuery.isFetching}>Tải lại</Button>
          </Space>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          <FilterOutlined style={{ color: '#9CA3AF' }} />
          <Input.Search
            placeholder="Tìm theo mã hoặc tên" allowClear style={{ width: 280 }}
            onSearch={(v) => setKeyword(v)}
          />
          <Select
            placeholder="Trạng thái" allowClear style={{ width: 160 }}
            value={isActive === undefined ? undefined : (isActive ? 'true' : 'false')}
            onChange={(v) => setIsActive(v == null ? undefined : v === 'true')}
            options={[{ value: 'true', label: 'Đang dùng' }, { value: 'false', label: 'Ngừng' }]}
          />
          {category.parentCategoryCode && (
            <div style={{ width: 240 }}>
              <LookupItemSelect
                categoryCode={category.parentCategoryCode}
                value={parentId ?? null}
                onChange={(v) => setParentId(v ?? undefined)}
                placeholder={`Lọc theo ${category.parentCategoryCode}`}
              />
            </div>
          )}
          {filterCount > 0 && (
            <Button type="link" size="small"
              onClick={() => { setKeyword(''); setIsActive(undefined); setParentId(undefined); }}>
              Xóa toàn bộ lọc
            </Button>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0 }}>
        <AgListGrid<LookupItemDto>
          ref={gridRef}
          rowData={data}
          columnDefs={columns}
          getRowId={(d) => d.id}
          loading={itemsQuery.isLoading}
          emptyText="Chưa có bản ghi"
          selectable
          onSelectionChange={(rows) => setSelectedIds(rows.map((r) => r.id))}
        />
      </div>

      <LookupFormModal
        open={open}
        onClose={() => setOpen(false)}
        category={category}
        editing={editing}
      />
    </div>
  );
}
