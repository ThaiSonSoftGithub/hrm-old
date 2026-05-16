import { Alert, Button, Card, Col, Form, Input, Popconfirm, Row, Select, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, FilterOutlined, KeyOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { functionGroupApi, permissionApi, screenApi } from './api';
import type { PermissionDto } from './types';
import { ApiError } from '@/shared/api/apiError';
import { ListShell } from '@/shared/components/ListShell';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';

export function PermissionListPage() {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<PermissionDto>>(null);
  const [keyword, setKeyword] = useState('');
  const [functionGroupId, setFunctionGroupId] = useState<string | undefined>();
  const [editing, setEditing] = useState<PermissionDto | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const listQuery = useQuery({
    queryKey: ['permissions', 'all'],
    queryFn: () => permissionApi.list({ page: 1, pageSize: 1000 }),
  });
  const fgOpts = useQuery({
    queryKey: ['function-group-options'],
    queryFn: () => functionGroupApi.options(),
  });

  const removeMany = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await permissionApi.remove(id); },
    onSuccess: () => {
      message.success('Đã xóa');
      setSelectedIds([]);
      gridRef.current?.clearSelection();
      qc.invalidateQueries({ queryKey: ['permissions'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể xóa'),
  });

  const data = useMemo(() => {
    const all = listQuery.data?.items ?? [];
    return all.filter((r) => {
      if (functionGroupId && r.functionGroup?.id !== functionGroupId) return false;
      if (keyword) {
        const k = keyword.toLowerCase();
        return r.code.toLowerCase().includes(k) || (r.note ?? '').toLowerCase().includes(k);
      }
      return true;
    });
  }, [listQuery.data, keyword, functionGroupId]);

  const filterCount = (keyword ? 1 : 0) + (functionGroupId ? 1 : 0);

  const columns: ColDef<PermissionDto>[] = [
    {
      headerName: 'Thao tác', width: 90, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<PermissionDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data!); setOpen(true); }} />
          <Popconfirm title={`Xóa ${p.data!.code}?`} onConfirm={() => removeMany.mutate([p.data!.id])} okText="Xóa" cancelText="Hủy">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    { field: 'code', headerName: 'Mã quyền', width: 240, pinned: 'left' },
    { field: 'note', headerName: 'Ghi chú', minWidth: 240, flex: 1 },
    {
      headerName: 'Màn hình', minWidth: 220, flex: 1,
      valueGetter: (p) => p.data?.screen ? `${p.data.screen.code} - ${p.data.screen.name}` : '',
    },
    {
      headerName: 'Nhóm chức năng', minWidth: 220, flex: 1,
      valueGetter: (p) => p.data?.functionGroup ? `${p.data.functionGroup.code} - ${p.data.functionGroup.name}` : '',
    },
  ];

  return (
    <ListShell
      title="Quản lý Quyền"
      toolbar={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={8}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setOpen(true); }}>
                Thêm quyền
              </Button>
              <Popconfirm
                title={`Xóa ${selectedIds.length} quyền đã chọn?`}
                disabled={selectedIds.length === 0}
                onConfirm={() => removeMany.mutate(selectedIds)}
                okText="Xóa" cancelText="Hủy"
              >
                <Button danger icon={<DeleteOutlined />} disabled={selectedIds.length === 0}>
                  Xóa các ô đã chọn{selectedIds.length > 0 ? ` (${selectedIds.length})` : ''}
                </Button>
              </Popconfirm>
            </Space>
            <Space size={8}>
              <span style={{ color: '#9CA3AF', fontSize: 13 }}>
                {data.length} quyền
                {filterCount > 0 && ` · ${filterCount} bộ lọc`}
              </span>
              <Button size="small" type="text" icon={<ReloadOutlined />}
                onClick={() => listQuery.refetch()} loading={listQuery.isFetching}>Tải lại</Button>
            </Space>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterOutlined style={{ color: '#9CA3AF' }} />
            <Input.Search
              placeholder="Tìm theo mã hoặc ghi chú" allowClear style={{ width: 280 }}
              onSearch={(v) => setKeyword(v)}
            />
            <Select
              placeholder="Nhóm chức năng" allowClear showSearch optionFilterProp="label"
              style={{ width: 240 }}
              value={functionGroupId} onChange={setFunctionGroupId}
              options={(fgOpts.data ?? []).map((f) => ({ value: f.id, label: `${f.code} - ${f.name}` }))}
            />
            {filterCount > 0 && (
              <Button type="link" size="small" onClick={() => { setKeyword(''); setFunctionGroupId(undefined); }}>
                Xóa toàn bộ lọc
              </Button>
            )}
          </div>
        </>
      }
    >
      <AgListGrid<PermissionDto>
        ref={gridRef}
        rowData={data}
        columnDefs={columns}
        getRowId={(d) => d.id}
        loading={listQuery.isLoading}
        emptyText="Chưa có quyền"
        selectable
        onSelectionChange={(rows) => setSelectedIds(rows.map((r) => r.id))}
      />
      <PermissionFormModal open={open} onClose={() => setOpen(false)} editing={editing} />
    </ListShell>
  );
}

function PermissionFormModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: PermissionDto | null }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);
  const [fgId, setFgId] = useState<string | undefined>(editing?.functionGroupId);

  const fgOpts = useQuery({ queryKey: ['function-group-options'], queryFn: () => functionGroupApi.options(), enabled: open });
  const screenOpts = useQuery({
    queryKey: ['screen-options', fgId],
    queryFn: () => screenApi.options(fgId),
    enabled: open && !!fgId,
  });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setFgId(editing?.functionGroupId);
    if (editing) form.setFieldsValue({
      code: editing.code, note: editing.note,
      functionGroupId: editing.functionGroupId, screenId: editing.screenId,
    });
    setDirty(false);
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: async (v: any) => {
      const body = { code: v.code, note: v.note ?? null, functionGroupId: v.functionGroupId, screenId: v.screenId };
      if (editing) return permissionApi.update(editing.id, body);
      return permissionApi.create(body);
    },
    onSuccess: () => {
      message.success('Đã lưu');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['permissions'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  const formId = 'permission-form';

  return (
    <FormModalShell
      open={open} onClose={onClose}
      title={editing ? 'Sửa quyền' : 'Thêm quyền'}
      subtitle={editing ? `Mã: ${editing.code}` : 'Cấp quyền mới cho hệ thống'}
      icon={<KeyOutlined />}
      formId={formId} isSaving={save.isPending} dirty={dirty}
    >
      <Card size="small" title="Thông tin quyền">
        <Form form={form} name={formId} layout="vertical"
          onValuesChange={() => setDirty(true)}
          onFinish={(v) => save.mutate(v)}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Nhóm chức năng" name="functionGroupId" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select showSearch optionFilterProp="label"
                  options={(fgOpts.data ?? []).map((f) => ({ value: f.id, label: `${f.code} - ${f.name}` }))}
                  onChange={(v) => { setFgId(v); form.setFieldValue('screenId', undefined); }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Màn hình" name="screenId" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select showSearch optionFilterProp="label" disabled={!fgId}
                  options={(screenOpts.data ?? []).map((s) => ({ value: s.id, label: `${s.code} - ${s.name}` }))} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Mã quyền" name="code" rules={[{ required: true, message: 'Bắt buộc' }, { max: 128 }]}>
                <Input placeholder="VD: EMP.VIEW" />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Ghi chú" name="note"><Input.TextArea rows={3} maxLength={2000} /></Form.Item>
            </Col>
          </Row>
          {save.isError && <Alert type="error" showIcon message={(save.error as ApiError)?.message ?? 'Đã có lỗi xảy ra.'} />}
        </Form>
      </Card>
    </FormModalShell>
  );
}
