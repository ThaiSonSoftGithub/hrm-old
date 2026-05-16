import { Avatar, Button, Card, Checkbox, Col, Drawer, Form, Input, Modal, Popconfirm, Row, Space, Tabs, Tag, Tree, Typography, message } from 'antd';
import type { DataNode } from 'antd/es/tree';
import { DeleteOutlined, EditOutlined, FilterOutlined, KeyOutlined, PlusOutlined, ReloadOutlined, SafetyCertificateOutlined, TeamOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { roleGroupApi, userDirectoryApi } from './api';
import type { RoleGroupDto, RoleGroupUserDto } from './types';
import { ApiError } from '@/shared/api/apiError';
import { ListShell } from '@/shared/components/ListShell';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';

export function RoleGroupListPage() {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<RoleGroupDto>>(null);
  const [keyword, setKeyword] = useState('');
  const [editing, setEditing] = useState<RoleGroupDto | null>(null);
  const [openForm, setOpenForm] = useState(false);
  const [drawerRg, setDrawerRg] = useState<RoleGroupDto | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const listQuery = useQuery({
    queryKey: ['role-groups', 'all'],
    queryFn: () => roleGroupApi.list({ page: 1, pageSize: 1000 }),
  });

  const removeMany = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await roleGroupApi.remove(id); },
    onSuccess: () => {
      message.success('Đã xóa');
      setSelectedIds([]);
      gridRef.current?.clearSelection();
      qc.invalidateQueries({ queryKey: ['role-groups'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể xóa'),
  });

  const data = useMemo(() => {
    const all = listQuery.data?.items ?? [];
    if (!keyword) return all;
    const k = keyword.toLowerCase();
    return all.filter((r) => r.code.toLowerCase().includes(k) || r.name.toLowerCase().includes(k));
  }, [listQuery.data, keyword]);

  const columns: ColDef<RoleGroupDto>[] = [
    {
      headerName: 'Thao tác', width: 120, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<RoleGroupDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<TeamOutlined />}
            title="Quản lý người dùng"
            onClick={() => setDrawerRg(p.data!)} />
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data!); setOpenForm(true); }} />
          <Popconfirm title={`Xóa ${p.data!.code}?`} onConfirm={() => removeMany.mutate([p.data!.id])} okText="Xóa" cancelText="Hủy">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    { field: 'code', headerName: 'Mã nhóm quyền', width: 200, pinned: 'left' },
    { field: 'name', headerName: 'Tên nhóm quyền', minWidth: 280, flex: 1 },
    { field: 'note', headerName: 'Ghi chú', minWidth: 220, flex: 1 },
    {
      field: 'isActive', headerName: 'Kích hoạt', width: 110,
      cellRenderer: (p: ICellRendererParams<RoleGroupDto>) => p.value ? <Tag color="green">Bật</Tag> : <Tag>Tắt</Tag>,
    },
  ];

  return (
    <ListShell
      title="Quản lý Nhóm quyền"
      toolbar={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={8}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditing(null); setOpenForm(true); }}>
                Thêm nhóm quyền
              </Button>
              <Popconfirm
                title={`Xóa ${selectedIds.length} nhóm quyền đã chọn?`}
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
                {data.length} nhóm quyền
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
      <AgListGrid<RoleGroupDto>
        ref={gridRef}
        rowData={data}
        columnDefs={columns}
        getRowId={(d) => d.id}
        loading={listQuery.isLoading}
        emptyText="Chưa có nhóm quyền"
        selectable
        onSelectionChange={(rows) => setSelectedIds(rows.map((r) => r.id))}
      />
      <RoleGroupFormModal open={openForm} onClose={() => setOpenForm(false)} editing={editing} />
      <UserMembershipDrawer
        open={!!drawerRg}
        roleGroup={drawerRg}
        onClose={() => setDrawerRg(null)}
      />
    </ListShell>
  );
}

function RoleGroupFormModal({ open, onClose, editing }: { open: boolean; onClose: () => void; editing: RoleGroupDto | null }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState('info');
  const [checked, setChecked] = useState<string[]>([]);
  const [dirty, setDirty] = useState(false);

  const tree = useQuery({
    queryKey: ['role-group-tree', editing?.id],
    queryFn: () => roleGroupApi.permissionTree(editing!.id),
    enabled: open && !!editing,
  });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setActiveTab('info');
    setChecked([]);
    if (editing) form.setFieldsValue({ ...editing });
    else form.setFieldsValue({ isActive: true });
    setDirty(false);
  }, [open, editing, form]);

  useEffect(() => {
    if (tree.data) {
      const ids: string[] = [];
      tree.data.forEach((fg) => fg.screens.forEach((s) => s.permissions.forEach((p) => {
        if (p.selected) ids.push(p.permissionId);
      })));
      setChecked(ids);
    }
  }, [tree.data]);

  const treeData: DataNode[] = useMemo(() => (tree.data ?? []).map((fg) => ({
    key: `fg:${fg.functionGroupId}`,
    title: `${fg.functionGroupCode} — ${fg.functionGroupName}`,
    selectable: false,
    children: fg.screens.map((s) => ({
      key: `sc:${s.screenId}`,
      title: `${s.screenCode} — ${s.screenName}`,
      selectable: false,
      children: s.permissions.map((p) => ({
        key: p.permissionId,
        title: `${p.code}${p.note ? ` — ${p.note}` : ''}`,
      })),
    })),
  })), [tree.data]);

  const save = useMutation({
    mutationFn: async () => {
      const v = await form.validateFields();
      let id = editing?.id;
      if (editing) {
        await roleGroupApi.update(editing.id, { name: v.name, note: v.note ?? null, isActive: v.isActive ?? true });
      } else {
        const created = await roleGroupApi.create({ code: v.code, name: v.name, note: v.note ?? null, isActive: v.isActive ?? true });
        id = created.id;
      }
      if (id && tree.data) {
        const permIds = checked.filter((k) => !k.startsWith('fg:') && !k.startsWith('sc:'));
        await roleGroupApi.savePermissions(id, permIds);
      }
    },
    onSuccess: () => {
      message.success('Đã lưu');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['role-groups'] });
      if (editing) qc.invalidateQueries({ queryKey: ['role-group-tree', editing.id] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể lưu'),
  });

  const handleCancel = () => {
    if (!dirty) { onClose(); return; }
    Modal.confirm({
      title: 'Có thay đổi chưa lưu',
      content: 'Các thông tin đã nhập sẽ bị mất nếu đóng. Bạn có muốn tiếp tục?',
      okText: 'Đóng', cancelText: 'Ở lại',
      okButtonProps: { danger: true }, centered: true,
      onOk: onClose,
    });
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={820}
      destroyOnClose
      title={null}
      closable={false}
      maskClosable={false}
      keyboard={false}
      styles={{ body: { padding: 0, display: 'flex', flexDirection: 'column' } }}
    >
      <div
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 20px', borderBottom: '1px solid #F0F2F7', flexShrink: 0,
        }}
      >
        <Space size={14} align="center">
          <Avatar size={42} style={{ background: '#5B6CFF' }} icon={<SafetyCertificateOutlined />} />
          <div>
            <Typography.Text strong style={{ fontSize: 15, color: '#1F2937' }}>
              {editing ? 'Sửa nhóm quyền' : 'Thêm nhóm quyền'}
            </Typography.Text>
            <div style={{ fontSize: 12, color: '#6B7280', marginTop: 2 }}>
              {editing ? `Mã: ${editing.code}` : 'Tạo nhóm quyền và gán quyền cho nhóm'}
            </div>
          </div>
        </Space>
      </div>

      <div style={{ padding: 16, background: '#fff' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            {
              key: 'info', label: 'Thông tin chung',
              children: (
                <Card size="small" title="Thông tin nhóm quyền">
                  <Form form={form} layout="vertical" onValuesChange={() => setDirty(true)}>
                    <Row gutter={16}>
                      <Col span={12}>
                        <Form.Item label="Mã nhóm quyền" name="code" rules={[{ required: !editing, message: 'Bắt buộc' }, { max: 64 }]}>
                          <Input disabled={!!editing} />
                        </Form.Item>
                      </Col>
                      <Col span={12} />
                      <Col span={24}>
                        <Form.Item label="Tên nhóm quyền" name="name" rules={[{ required: true, message: 'Bắt buộc' }, { max: 256 }]}>
                          <Input />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item label="Ghi chú" name="note">
                          <Input.TextArea rows={3} maxLength={2000} />
                        </Form.Item>
                      </Col>
                      <Col span={24}>
                        <Form.Item name="isActive" valuePropName="checked">
                          <Checkbox>Kích hoạt</Checkbox>
                        </Form.Item>
                      </Col>
                    </Row>
                  </Form>
                </Card>
              ),
            },
            {
              key: 'perm', label: <span><KeyOutlined /> Chọn quyền</span>,
              disabled: !editing,
              children: !editing ? (
                <div style={{ color: '#888' }}>Lưu nhóm quyền ở tab "Thông tin chung" trước, rồi chọn quyền.</div>
              ) : (
                <Card size="small" title="Cây quyền theo nhóm chức năng / màn hình">
                  <div style={{ maxHeight: 420, overflow: 'auto' }}>
                    <Tree
                      checkable
                      treeData={treeData}
                      defaultExpandAll
                      checkedKeys={checked}
                      onCheck={(k) => { setChecked(k as string[]); setDirty(true); }}
                    />
                  </div>
                </Card>
              ),
            },
          ]}
        />
      </div>

      <div
        style={{
          flexShrink: 0,
          display: 'flex', justifyContent: 'flex-end',
          padding: '10px 16px',
          borderTop: '1px solid #F0F2F7',
          background: '#FAFBFF',
        }}
      >
        <Space size={8}>
          <Button onClick={handleCancel}>Hủy</Button>
          <Button
            type="primary"
            loading={save.isPending}
            disabled={!dirty}
            onClick={() => save.mutate()}
          >
            Lưu thay đổi
          </Button>
        </Space>
      </div>
    </Modal>
  );
}

function UserMembershipDrawer({ open, roleGroup, onClose }: { open: boolean; roleGroup: RoleGroupDto | null; onClose: () => void }) {
  const qc = useQueryClient();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const gridRef = useRef<AgListGridHandle<RoleGroupUserDto>>(null);

  const users = useQuery({
    queryKey: ['role-group-users', roleGroup?.id],
    queryFn: () => roleGroupApi.users(roleGroup!.id),
    enabled: !!roleGroup && open,
  });

  const remove = useMutation({
    mutationFn: (ids: string[]) => roleGroupApi.removeUsers(roleGroup!.id, ids),
    onSuccess: () => {
      message.success('Đã xóa khỏi nhóm');
      setSelectedKeys([]);
      gridRef.current?.clearSelection();
      qc.invalidateQueries({ queryKey: ['role-group-users', roleGroup?.id] });
      qc.invalidateQueries({ queryKey: ['role-groups'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể xóa'),
  });

  const columns: ColDef<RoleGroupUserDto>[] = [
    { field: 'username', headerName: 'Tài khoản', width: 200, pinned: 'left' },
    { field: 'displayName', headerName: 'Tên hiển thị', minWidth: 240, flex: 1 },
    { field: 'email', headerName: 'Email', minWidth: 240, flex: 1 },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={roleGroup ? `Người dùng nhóm quyền — ${roleGroup.code} ${roleGroup.name}` : 'Người dùng'}
      width={900}
      destroyOnClose
      extra={
        <Space>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setPickerOpen(true)}>
            Thêm người dùng
          </Button>
          <Popconfirm
            title={`Xóa ${selectedKeys.length} người dùng khỏi nhóm?`}
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
        <AgListGrid<RoleGroupUserDto>
          ref={gridRef}
          rowData={users.data ?? []}
          columnDefs={columns}
          getRowId={(d) => d.userId}
          loading={users.isLoading}
          emptyText="Nhóm chưa có người dùng nào"
          selectable
          onSelectionChange={(rows) => setSelectedKeys(rows.map((r) => r.userId))}
        />
      </div>
      {roleGroup && (
        <AddUsersModal
          open={pickerOpen}
          onClose={() => setPickerOpen(false)}
          roleGroup={roleGroup}
        />
      )}
    </Drawer>
  );
}

function AddUsersModal({ open, onClose, roleGroup }: { open: boolean; onClose: () => void; roleGroup: RoleGroupDto }) {
  const qc = useQueryClient();
  const [keyword, setKeyword] = useState('');
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);

  const allUsers = useQuery({
    queryKey: ['users-pick', { keyword }],
    queryFn: () => userDirectoryApi.list({ keyword: keyword || undefined, page: 1, pageSize: 200 }),
    enabled: open,
  });
  const memberUsers = useQuery({
    queryKey: ['role-group-users', roleGroup.id],
    queryFn: () => roleGroupApi.users(roleGroup.id),
    enabled: open,
  });

  const add = useMutation({
    mutationFn: (ids: string[]) => roleGroupApi.addUsers(roleGroup.id, ids),
    onSuccess: () => {
      message.success('Đã thêm');
      setSelectedKeys([]);
      qc.invalidateQueries({ queryKey: ['role-group-users', roleGroup.id] });
      qc.invalidateQueries({ queryKey: ['role-groups'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể thêm'),
  });

  const memberIds = new Set((memberUsers.data ?? []).map((u) => u.userId));
  const candidates = (allUsers.data?.items ?? []).filter((u) => !memberIds.has(u.userId));

  const columns: ColDef<RoleGroupUserDto>[] = [
    { field: 'username', headerName: 'Tài khoản', width: 200 },
    { field: 'displayName', headerName: 'Tên hiển thị', minWidth: 240, flex: 1 },
    { field: 'email', headerName: 'Email', minWidth: 200, flex: 1 },
  ];

  return (
    <Modal
      open={open} onCancel={onClose} onOk={() => add.mutate(selectedKeys)}
      okText="Thêm" cancelText="Hủy"
      okButtonProps={{ disabled: selectedKeys.length === 0, loading: add.isPending }}
      title={`Thêm người dùng vào — ${roleGroup.code}`} width={780}
      destroyOnClose
    >
      <Input.Search placeholder="Tìm theo username, tên, email" allowClear onSearch={setKeyword} style={{ marginBottom: 12 }} />
      <div style={{ height: 360 }}>
        <AgListGrid<RoleGroupUserDto>
          rowData={candidates}
          columnDefs={columns}
          getRowId={(d) => d.userId}
          loading={allUsers.isLoading || memberUsers.isLoading}
          emptyText="Không có người dùng phù hợp"
          selectable
          onSelectionChange={(rows) => setSelectedKeys(rows.map((r) => r.userId))}
        />
      </div>
    </Modal>
  );
}
