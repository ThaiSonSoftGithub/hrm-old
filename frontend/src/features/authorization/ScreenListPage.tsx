import { Alert, Button, Card, Checkbox, Col, Form, Input, Popconfirm, Row, Select, Space, Tag, message } from 'antd';
import { DeleteOutlined, DesktopOutlined, EditOutlined, FilterOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { functionGroupApi, screenApi } from './api';
import type { ScreenDto } from './types';
import { ApiError } from '@/shared/api/apiError';
import { ListShell } from '@/shared/components/ListShell';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';

export function ScreenListPage() {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<ScreenDto>>(null);
  const [keyword, setKeyword] = useState('');
  const [functionGroupId, setFunctionGroupId] = useState<string | undefined>();
  const [editing, setEditing] = useState<ScreenDto | null>(null);
  const [open, setOpen] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const listQuery = useQuery({
    queryKey: ['screens', 'all'],
    queryFn: () => screenApi.list({ page: 1, pageSize: 1000 }),
  });
  const fgOpts = useQuery({
    queryKey: ['function-group-options'],
    queryFn: () => functionGroupApi.options(),
  });

  const removeMany = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await screenApi.remove(id); },
    onSuccess: () => {
      message.success('Đã xóa');
      setSelectedIds([]);
      gridRef.current?.clearSelection();
      qc.invalidateQueries({ queryKey: ['screens'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể xóa'),
  });

  const data = useMemo(() => {
    const all = listQuery.data?.items ?? [];
    return all.filter((r) => {
      if (functionGroupId && r.functionGroup?.id !== functionGroupId) return false;
      if (keyword) {
        const k = keyword.toLowerCase();
        return r.code.toLowerCase().includes(k) || r.name.toLowerCase().includes(k);
      }
      return true;
    });
  }, [listQuery.data, keyword, functionGroupId]);

  const filterCount = (keyword ? 1 : 0) + (functionGroupId ? 1 : 0);

  const columns: ColDef<ScreenDto>[] = [
    {
      headerName: 'Thao tác', width: 90, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<ScreenDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data!); setOpen(true); }} />
          <Popconfirm title={`Xóa ${p.data!.code}?`} onConfirm={() => removeMany.mutate([p.data!.id])} okText="Xóa" cancelText="Hủy">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    { field: 'code', headerName: 'Mã màn hình', width: 200, pinned: 'left' },
    { field: 'name', headerName: 'Tên màn hình', minWidth: 240, flex: 1 },
    {
      headerName: 'Nhóm chức năng', minWidth: 220, flex: 1,
      valueGetter: (p) => p.data?.functionGroup ? `${p.data.functionGroup.code} - ${p.data.functionGroup.name}` : '',
    },
    { field: 'note', headerName: 'Ghi chú', minWidth: 220, flex: 1 },
    {
      field: 'isActive', headerName: 'Kích hoạt', width: 110,
      cellRenderer: (p: ICellRendererParams<ScreenDto>) => p.value ? <Tag color="green">Bật</Tag> : <Tag>Tắt</Tag>,
    },
  ];

  return (
    <ListShell
      title="Quản lý Màn hình"
      toolbar={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={8}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setOpen(true); }}>
                Thêm màn hình
              </Button>
              <Popconfirm
                title={`Xóa ${selectedIds.length} màn hình đã chọn?`}
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
                {data.length} màn hình
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
      <AgListGrid<ScreenDto>
        ref={gridRef}
        rowData={data}
        columnDefs={columns}
        getRowId={(d) => d.id}
        loading={listQuery.isLoading}
        emptyText="Chưa có màn hình"
        selectable
        onSelectionChange={(rows) => setSelectedIds(rows.map((r) => r.id))}
      />
      <ScreenFormModal open={open} onClose={() => setOpen(false)} editing={editing} />
    </ListShell>
  );
}

function ScreenFormModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: ScreenDto | null }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);
  const fgOpts = useQuery({ queryKey: ['function-group-options'], queryFn: () => functionGroupApi.options(), enabled: open });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (editing) form.setFieldsValue({ ...editing });
    else form.setFieldsValue({ isActive: true });
    setDirty(false);
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: async (v: any) => {
      if (editing) return screenApi.update(editing.id, {
        name: v.name, note: v.note ?? null, functionGroupId: v.functionGroupId, isActive: v.isActive ?? true,
      });
      return screenApi.create({
        code: v.code, name: v.name, note: v.note ?? null, functionGroupId: v.functionGroupId, isActive: v.isActive ?? true,
      });
    },
    onSuccess: () => {
      message.success('Đã lưu');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['screens'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  const formId = 'screen-form';

  return (
    <FormModalShell
      open={open} onClose={onClose}
      title={editing ? `Sửa màn hình` : 'Thêm màn hình'}
      subtitle={editing ? `Mã: ${editing.code}` : 'Định nghĩa màn hình thuộc nhóm chức năng'}
      icon={<DesktopOutlined />}
      formId={formId} isSaving={save.isPending} dirty={dirty}
    >
      <Card size="small" title="Thông tin màn hình">
        <Form form={form} name={formId} layout="vertical"
          onValuesChange={() => setDirty(true)}
          onFinish={(v) => save.mutate(v)}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Mã màn hình" name="code" rules={[{ required: !editing, message: 'Bắt buộc' }, { max: 64 }]}>
                <Input disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Nhóm chức năng" name="functionGroupId" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select showSearch optionFilterProp="label"
                  options={(fgOpts.data ?? []).map((f) => ({ value: f.id, label: `${f.code} - ${f.name}` }))} />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Tên màn hình" name="name" rules={[{ required: true, message: 'Bắt buộc' }, { max: 256 }]}>
                <Input />
              </Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item label="Ghi chú" name="note"><Input.TextArea rows={3} maxLength={2000} /></Form.Item>
            </Col>
            <Col span={24}>
              <Form.Item name="isActive" valuePropName="checked"><Checkbox>Kích hoạt</Checkbox></Form.Item>
            </Col>
          </Row>
          {save.isError && <Alert type="error" showIcon message={(save.error as ApiError)?.message ?? 'Đã có lỗi xảy ra.'} />}
        </Form>
      </Card>
    </FormModalShell>
  );
}
