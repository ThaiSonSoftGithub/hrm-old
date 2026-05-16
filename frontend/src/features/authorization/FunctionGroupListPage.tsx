import { Alert, Button, Card, Checkbox, Col, Drawer, Form, Input, Modal, Popconfirm, Row, Space, Tag, message } from 'antd';
import { AppstoreOutlined, ApartmentOutlined, DeleteOutlined, EditOutlined, FilterOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { functionGroupApi, screenApi } from './api';
import type { FunctionGroupDto, ScreenDto } from './types';
import { ApiError } from '@/shared/api/apiError';
import { ListShell } from '@/shared/components/ListShell';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';

export function FunctionGroupListPage() {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<FunctionGroupDto>>(null);
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<FunctionGroupDto | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [drawerFg, setDrawerFg] = useState<FunctionGroupDto | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const listQuery = useQuery({
    queryKey: ['function-groups', 'all'],
    queryFn: () => functionGroupApi.list({ page: 1, pageSize: 1000 }),
  });

  const removeMany = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await functionGroupApi.remove(id); },
    onSuccess: () => {
      message.success('Đã xóa');
      setSelectedIds([]);
      gridRef.current?.clearSelection();
      qc.invalidateQueries({ queryKey: ['function-groups'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể xóa'),
  });

  const data = useMemo(() => {
    const all = listQuery.data?.items ?? [];
    if (!keyword) return all;
    const k = keyword.toLowerCase();
    return all.filter((r) => r.code.toLowerCase().includes(k) || r.name.toLowerCase().includes(k));
  }, [listQuery.data, keyword]);

  const columns: ColDef<FunctionGroupDto>[] = [
    {
      headerName: 'Thao tác', width: 120, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<FunctionGroupDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<ApartmentOutlined />}
            title="Quản lý màn hình"
            onClick={() => setDrawerFg(p.data!)} />
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data!); setOpenForm(true); }} />
          <Popconfirm title={`Xóa ${p.data!.code}?`} onConfirm={() => removeMany.mutate([p.data!.id])} okText="Xóa" cancelText="Hủy">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    { field: 'code', headerName: 'Mã nhóm', width: 220, pinned: 'left' },
    { field: 'name', headerName: 'Tên nhóm chức năng', minWidth: 280, flex: 1 },
    { field: 'note', headerName: 'Ghi chú', minWidth: 220, flex: 1 },
    {
      field: 'isActive', headerName: 'Kích hoạt', width: 110,
      cellRenderer: (p: ICellRendererParams<FunctionGroupDto>) => p.value ? <Tag color="green">Bật</Tag> : <Tag>Tắt</Tag>,
    },
  ];

  return (
    <ListShell
      title="Quản lý Nhóm chức năng"
      toolbar={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={8}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setOpenForm(true); }}>
                Thêm nhóm
              </Button>
              <Popconfirm
                title={`Xóa ${selectedIds.length} nhóm đã chọn?`}
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
                {data.length} nhóm
                {keyword && ` · 1 bộ lọc`}
              </span>
              <Button size="small" type="text" icon={<ReloadOutlined />}
                onClick={() => listQuery.refetch()} loading={listQuery.isFetching}>Tải lại</Button>
            </Space>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <FilterOutlined style={{ color: '#9CA3AF' }} />
            <Input.Search
              placeholder="Tìm theo mã hoặc tên" allowClear style={{ width: 320 }}
              onSearch={(v) => setKeyword(v)}
            />
            {keyword && (
              <Button type="link" size="small" onClick={() => setKeyword('')}>Xóa lọc</Button>
            )}
          </div>
        </>
      }
    >
      <AgListGrid<FunctionGroupDto>
        ref={gridRef}
        rowData={data}
        columnDefs={columns}
        getRowId={(d) => d.id}
        loading={listQuery.isLoading}
        emptyText="Chưa có nhóm chức năng"
        selectable
        onSelectionChange={(rows) => setSelectedIds(rows.map((r) => r.id))}
      />
      <FunctionGroupFormModal open={openForm} onClose={() => setOpenForm(false)} editing={editing} />
      <ScreenMembershipDrawer
        open={!!drawerFg}
        functionGroup={drawerFg}
        onClose={() => setDrawerFg(null)}
      />
    </ListShell>
  );
}

function FunctionGroupFormModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: FunctionGroupDto | null }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (editing) form.setFieldsValue({ ...editing });
    else form.setFieldsValue({ isActive: true });
    setDirty(false);
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: async (v: any) => {
      if (editing) return functionGroupApi.update(editing.id, { name: v.name, note: v.note ?? null, isActive: v.isActive ?? true });
      return functionGroupApi.create({ code: v.code, name: v.name, note: v.note ?? null, isActive: v.isActive ?? true });
    },
    onSuccess: () => {
      message.success('Đã lưu');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['function-groups'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  const formId = 'function-group-form';

  return (
    <FormModalShell
      open={open} onClose={onClose}
      title={editing ? 'Sửa nhóm chức năng' : 'Thêm nhóm chức năng'}
      subtitle={editing ? `Mã: ${editing.code}` : 'Định nghĩa nhóm chức năng mới'}
      icon={<AppstoreOutlined />}
      formId={formId} isSaving={save.isPending} dirty={dirty}
    >
      <Card size="small" title="Thông tin nhóm chức năng">
        <Form form={form} name={formId} layout="vertical"
          onValuesChange={() => setDirty(true)}
          onFinish={(v) => save.mutate(v)}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Mã nhóm chức năng" name="code" rules={[{ required: !editing, message: 'Bắt buộc' }, { max: 64 }]}>
                <Input disabled={!!editing} />
              </Form.Item>
            </Col>
            <Col span={12} />
            <Col span={24}>
              <Form.Item label="Tên nhóm chức năng" name="name" rules={[{ required: true, message: 'Bắt buộc' }, { max: 256 }]}>
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

function ScreenMembershipDrawer({ open, functionGroup, onClose }: { open: boolean; functionGroup: FunctionGroupDto | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const gridRef = useRef<AgListGridHandle<ScreenDto>>(null);

  const screens = useQuery({
    queryKey: ['function-group-screens', functionGroup?.id],
    queryFn: () => functionGroupApi.membershipScreens(functionGroup!.id),
    enabled: !!functionGroup && open,
  });

  const remove = useMutation({
    mutationFn: (ids: string[]) => functionGroupApi.removeScreens(functionGroup!.id, ids),
    onSuccess: () => {
      message.success('Đã xóa khỏi nhóm');
      setSelectedKeys([]);
      gridRef.current?.clearSelection();
      qc.invalidateQueries({ queryKey: ['function-group-screens', functionGroup?.id] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể xóa'),
  });

  const columns: ColDef<ScreenDto>[] = [
    { field: 'code', headerName: 'Mã màn hình', width: 200, pinned: 'left' },
    { field: 'name', headerName: 'Tên màn hình', minWidth: 240, flex: 1 },
    { field: 'note', headerName: 'Ghi chú', minWidth: 220, flex: 1 },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={functionGroup ? `Màn hình thuộc nhóm — ${functionGroup.code} ${functionGroup.name}` : 'Màn hình'}
      width={900}
      destroyOnClose
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setPickerOpen(true)}>
            Thêm màn hình
          </Button>
          <Popconfirm
            title={`Xóa ${selectedKeys.length} màn hình khỏi nhóm?`}
            disabled={selectedKeys.length === 0}
            onConfirm={() => remove.mutate(selectedKeys)}
            okText="Xóa" cancelText="Hủy"
          >
            <Button danger icon={<DeleteOutlined />} disabled={selectedKeys.length === 0}>
              Xóa{selectedKeys.length > 0 ? ` (${selectedKeys.length})` : ''}
            </Button>
          </Popconfirm>
        </Space>
      }
    >
      <div style={{ height: 'calc(100vh - 140px)' }}>
        <AgListGrid<ScreenDto>
          ref={gridRef}
          rowData={screens.data ?? []}
          columnDefs={columns}
          getRowId={(d) => d.id}
          loading={screens.isLoading}
          emptyText="Nhóm chưa có màn hình nào"
          selectable
          onSelectionChange={(rows) => setSelectedKeys(rows.map((r) => r.id))}
        />
      </div>
      {functionGroup && (
        <AddScreensModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          functionGroup={functionGroup}
        />
      )}
    </Drawer>
  );
}

function AddScreensModal({ open, onClose, functionGroup }: { open: boolean; onClose: () => void; functionGroup: FunctionGroupDto }) {
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const screens = useQuery({
    queryKey: ['screens-pick', { keyword }],
    queryFn: () => screenApi.list({ keyword: keyword || undefined, page: 1, pageSize: 200, isActive: true }),
    enabled: open,
  });
  const member = useQuery({
    queryKey: ['function-group-screens', functionGroup.id],
    queryFn: () => functionGroupApi.membershipScreens(functionGroup.id),
    enabled: open,
  });

  const add = useMutation({
    mutationFn: (ids: string[]) => functionGroupApi.addScreens(functionGroup.id, ids),
    onSuccess: () => {
      message.success('Đã thêm');
      setSelectedKeys([]);
      qc.invalidateQueries({ queryKey: ['function-group-screens', functionGroup.id] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể thêm'),
  });

  const memberIds = new Set((member.data ?? []).map((s) => s.id));
  const candidates = (screens.data?.items ?? []).filter((s) => !memberIds.has(s.id));

  const columns: ColDef<ScreenDto>[] = [
    { field: 'code', headerName: 'Mã màn hình', width: 200 },
    { field: 'name', headerName: 'Tên màn hình', minWidth: 240, flex: 1 },
    { field: 'note', headerName: 'Ghi chú', minWidth: 200, flex: 1 },
  ];

  return (
    <Modal
      open={open} onCancel={onClose} onOk={() => add.mutate(selectedKeys)}
      okText="Thêm" cancelText="Hủy"
      okButtonProps={{ disabled: selectedKeys.length === 0, loading: add.isPending }}
      title={`Thêm màn hình vào nhóm — ${functionGroup.code}`} width={820}
      destroyOnClose
    >
      <Input.Search placeholder="Tìm theo mã hoặc tên" allowClear onSearch={setKeyword} style={{ marginBottom: 12 }} />
      <div style={{ height: 360 }}>
        <AgListGrid<ScreenDto>
          rowData={candidates}
          columnDefs={columns}
          getRowId={(d) => d.id}
          loading={screens.isLoading || member.isLoading}
          emptyText="Không có màn hình phù hợp"
          selectable
          onSelectionChange={(rows) => setSelectedKeys(rows.map((r) => r.id))}
        />
      </div>
    </Modal>
  );
}
