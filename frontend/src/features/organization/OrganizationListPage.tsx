import { Button, Drawer, Input, Popconfirm, Select, Space, Tag, Tree, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import {
  ApartmentOutlined, BankOutlined, DeleteOutlined, EditOutlined, FilterOutlined,
  HomeOutlined, PlusOutlined, ReloadOutlined, TeamOutlined,
} from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { organizationApi } from './api';
import type { OrganizationUnitDto, OrganizationUnitTreeNode } from './types';
import { OrganizationFormModal } from './OrganizationFormModal';
import { ApiError } from '@/shared/api/apiError';
import { ListShell } from '@/shared/components/ListShell';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';

function nodeIcon(depth: number, hasChildren: boolean): React.ReactNode {
  const color = '#5B6CFF';
  if (depth === 0) return <BankOutlined style={{ color }} />;
  if (depth === 1) return <HomeOutlined style={{ color }} />;
  if (hasChildren) return <ApartmentOutlined style={{ color }} />;
  return <TeamOutlined style={{ color: '#94A3B8' }} />;
}

function toAntdTree(nodes: OrganizationUnitTreeNode[], depth = 0): DataNode[] {
  return nodes.map((n) => {
    const hasChildren = n.children.length > 0;
    return {
      key: n.id,
      title: (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 500, color: '#1F2937' }}>{n.name}</span>
          <span
            style={{
              fontSize: 11,
              color: '#94A3B8',
              fontFamily: "'JetBrains Mono', ui-monospace, monospace",
              background: '#F4F6FB',
              padding: '1px 6px',
              borderRadius: 4,
            }}
          >
            {n.code}
          </span>
          {!n.isActive && (
            <Tag color="default" style={{ margin: 0, fontSize: 10, lineHeight: '14px', padding: '0 5px' }}>
              Ngừng
            </Tag>
          )}
        </span>
      ),
      icon: nodeIcon(depth, hasChildren),
      children: hasChildren ? toAntdTree(n.children, depth + 1) : undefined,
    };
  });
}

export function OrganizationListPage() {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<OrganizationUnitDto>>(null);
  const [keyword, setKeyword] = useState('');
  const [parentUnitId, setParentUnitId] = useState<string | undefined>();
  const [editing, setEditing] = useState<OrganizationUnitDto | null>(null);
  const [open, setOpen] = useState(false);
  const [treeOpen, setTreeOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const treeQuery = useQuery({
    queryKey: ['org-units', 'tree'],
    queryFn: () => organizationApi.tree(),
  });

  const listQuery = useQuery({
    queryKey: ['org-units', 'all'],
    queryFn: () => organizationApi.list({ page: 1, pageSize: 1000 }),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await organizationApi.remove(id); },
    onSuccess: () => {
      message.success('Đã xóa');
      setSelectedIds([]);
      gridRef.current?.clearSelection();
      qc.invalidateQueries({ queryKey: ['org-units'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể xóa'),
  });

  const data = useMemo(() => {
    const all = listQuery.data?.items ?? [];
    return all.filter((r) => {
      if (parentUnitId && r.parentUnitId !== parentUnitId) return false;
      if (keyword) {
        const k = keyword.toLowerCase();
        return r.code.toLowerCase().includes(k) || r.name.toLowerCase().includes(k);
      }
      return true;
    });
  }, [listQuery.data, parentUnitId, keyword]);

  const filterCount = (keyword ? 1 : 0) + (parentUnitId ? 1 : 0);

  const treeData = useMemo(() => toAntdTree(treeQuery.data ?? []), [treeQuery.data]);

  const allUnitOptions = useMemo(
    () => (listQuery.data?.items ?? []).map((u) => ({ value: u.id, label: `${u.code} - ${u.name}` })),
    [listQuery.data],
  );

  const columns: ColDef<OrganizationUnitDto>[] = [
    {
      headerName: 'Thao tác', width: 90, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<OrganizationUnitDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data!); setOpen(true); }} />
          <Popconfirm title={`Xóa ${p.data!.code}?`} onConfirm={() => remove.mutate([p.data!.id])} okText="Xóa" cancelText="Hủy">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    { field: 'code', headerName: 'Mã đơn vị', width: 160, pinned: 'left' },
    { field: 'name', headerName: 'Tên đơn vị', minWidth: 240, flex: 1 },
    {
      headerName: 'Đơn vị cha', minWidth: 200, flex: 1,
      valueGetter: (p) => p.data?.parent ? `${p.data.parent.code} - ${p.data.parent.name}` : '',
    },
    {
      headerName: 'Cấp tổ chức', width: 140,
      valueGetter: (p) => p.data?.organizationLevel?.name ?? '',
    },
    { field: 'representativeName', headerName: 'Người đại diện', width: 180 },
    { field: 'phone', headerName: 'Điện thoại', width: 140 },
    { field: 'email', headerName: 'Email', minWidth: 200, flex: 1 },
    {
      field: 'isActive', headerName: 'Trạng thái', width: 130,
      cellRenderer: (p: ICellRendererParams<OrganizationUnitDto>) =>
        p.value ? <Tag color="green">Đang dùng</Tag> : <Tag>Ngừng</Tag>,
    },
  ];

  return (
    <ListShell
      title="Cơ cấu tổ chức"
      toolbar={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={8}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setOpen(true); }}>
                Thêm đơn vị
              </Button>
              <Button icon={<ApartmentOutlined />} onClick={() => setTreeOpen(true)}>
                Xem cây tổ chức
              </Button>
              <Popconfirm
                title={`Xóa ${selectedIds.length} đơn vị đã chọn?`}
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
                {data.length} đơn vị
                {filterCount > 0 && ` · ${filterCount} bộ lọc`}
              </span>
              <Button size="small" type="text" icon={<ReloadOutlined />}
                onClick={() => listQuery.refetch()} loading={listQuery.isFetching}>Tải lại</Button>
            </Space>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterOutlined style={{ color: '#9CA3AF' }} />
            <Input.Search
              placeholder="Tìm theo mã hoặc tên" allowClear style={{ width: 280 }}
              onSearch={(v) => setKeyword(v)}
            />
            <Select
              placeholder="Đơn vị cha" allowClear showSearch optionFilterProp="label"
              style={{ width: 280 }}
              value={parentUnitId} onChange={setParentUnitId}
              options={allUnitOptions}
            />
            {filterCount > 0 && (
              <Button type="link" size="small" onClick={() => { setKeyword(''); setParentUnitId(undefined); }}>
                Xóa toàn bộ lọc
              </Button>
            )}
          </div>
        </>
      }
    >
      <AgListGrid<OrganizationUnitDto>
        ref={gridRef}
        rowData={data}
        columnDefs={columns}
        getRowId={(d) => d.id}
        loading={listQuery.isLoading}
        emptyText="Chưa có đơn vị"
        selectable
        onSelectionChange={(rows) => setSelectedIds(rows.map((r) => r.id))}
      />
      <OrganizationFormModal
        open={open}
        onClose={() => setOpen(false)}
        editing={editing}
      />
      <Drawer
        open={treeOpen}
        onClose={() => setTreeOpen(false)}
        title={
          <Space>
            <ApartmentOutlined style={{ color: '#5B6CFF' }} />
            <span>Cây tổ chức</span>
          </Space>
        }
        width={460}
        styles={{ body: { padding: 0 } }}
        extra={
          parentUnitId && (
            <Button size="small" type="link" onClick={() => { setParentUnitId(undefined); setTreeOpen(false); }}>
              Xóa lọc
            </Button>
          )
        }
      >
        <div style={{ padding: 12, background: '#FAFBFF', borderBottom: '1px solid #F0F2F7' }}>
          <span style={{ fontSize: 12, color: '#6B7280' }}>
            Chọn 1 đơn vị để lọc danh sách theo đơn vị cha. Click lại để bỏ chọn.
          </span>
        </div>
        <div style={{ padding: 12, height: 'calc(100% - 56px)', overflow: 'auto' }}>
          <Tree
            treeData={treeData}
            defaultExpandAll
            showIcon
            blockNode
            selectedKeys={parentUnitId ? [parentUnitId] : []}
            onSelect={(keys) => {
              const k = keys[0] as string | undefined;
              setParentUnitId(k && k === parentUnitId ? undefined : k);
              setTreeOpen(false);
            }}
            style={{ background: 'transparent', fontSize: 14 }}
          />
        </div>
      </Drawer>
    </ListShell>
  );
}
