import { Button, Input, Popconfirm, Select, Space, Tag, message } from 'antd';
import { DeleteOutlined, EyeOutlined, FilterOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { employeeApi } from './api';
import type { EmployeeListItemDto } from './types';
import { EmployeeCreateModal } from './EmployeeCreateModal';
import { EmployeeProfileModal } from './EmployeeProfileModal';
import { ListShell } from '@/shared/components/ListShell';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';
import { organizationApi } from '@/features/organization/api';
import { lookupApi } from '@/features/lookups/api';
import { ApiError } from '@/shared/api/apiError';

const formatDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('vi-VN') : '');

export function EmployeeListPage() {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<EmployeeListItemDto>>(null);
  const [keyword, setKeyword] = useState('');
  const [departmentId, setDepartmentId] = useState<string | undefined>();
  const [jobPositionId, setJobPositionId] = useState<string | undefined>();
  const [workingStatusId, setWorkingStatusId] = useState<string | undefined>();
  const [openCreate, setOpenCreate] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [profileEmployeeId, setProfileEmployeeId] = useState<string | null>(null);
  const [profileTab, setProfileTab] = useState<string>('tab-01-general');

  const listQuery = useQuery({
    queryKey: ['employees', { keyword, departmentId, jobPositionId, workingStatusId }],
    queryFn: () => employeeApi.list({
      keyword: keyword || undefined,
      departmentId, jobPositionId, workingStatusId,
      page: 1, pageSize: 1000,
    }),
  });

  const orgs = useQuery({
    queryKey: ['org-units', 'options'],
    queryFn: () => organizationApi.list({ page: 1, pageSize: 500 }),
  });
  const jobs = useQuery({
    queryKey: ['lookup-options', 'JobPosition'],
    queryFn: () => lookupApi.listItems('JobPosition', { page: 1, pageSize: 300 }),
  });
  const statuses = useQuery({
    queryKey: ['lookup-options', 'WorkingStatus'],
    queryFn: () => lookupApi.listItems('WorkingStatus', { page: 1, pageSize: 50 }),
  });

  const remove = useMutation({
    mutationFn: async (ids: string[]) => { for (const id of ids) await employeeApi.remove(id); },
    onSuccess: () => {
      message.success('Đã xóa');
      setSelectedIds([]);
      gridRef.current?.clearSelection();
      qc.invalidateQueries({ queryKey: ['employees'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không thể xóa'),
  });

  const openProfile = (id: string, tab: string = 'tab-01-general') => {
    setProfileTab(tab);
    setProfileEmployeeId(id);
  };

  const data = listQuery.data?.items ?? [];
  const filterCount = (departmentId ? 1 : 0) + (jobPositionId ? 1 : 0) + (workingStatusId ? 1 : 0) + (keyword ? 1 : 0);

  const columns = useMemo<ColDef<EmployeeListItemDto>[]>(() => [
    {
      headerName: 'Thao tác', width: 90, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<EmployeeListItemDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EyeOutlined />}
            onClick={() => openProfile(p.data!.employeeId)} />
          <Popconfirm
            title={`Xóa ${p.data!.employeeCode}?`}
            onConfirm={() => remove.mutate([p.data!.employeeId])}
            okText="Xóa" cancelText="Hủy"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    {
      field: 'employeeCode', headerName: 'Mã', width: 110, pinned: 'left',
      cellRenderer: (p: ICellRendererParams<EmployeeListItemDto>) => (
        <a onClick={() => openProfile(p.data!.employeeId)}>{p.value}</a>
      ),
    },
    {
      field: 'fullName', headerName: 'Họ tên', minWidth: 200, flex: 1,
      cellRenderer: (p: ICellRendererParams<EmployeeListItemDto>) => (
        <a onClick={() => openProfile(p.data!.employeeId)} style={{ fontWeight: 500 }}>
          {p.value}
        </a>
      ),
    },
    {
      field: 'genderLabel', headerName: 'Giới tính', width: 100,
      cellRenderer: (p: ICellRendererParams<EmployeeListItemDto>) => p.value ?? '',
    },
    { field: 'jobPositionLabel', headerName: 'Vị trí công việc', minWidth: 180, flex: 1 },
    { field: 'departmentLabel', headerName: 'Phòng ban', minWidth: 180, flex: 1 },
    { field: 'phoneNumber', headerName: 'Số điện thoại', width: 140 },
    { field: 'email', headerName: 'Email', minWidth: 200, flex: 1 },
    { field: 'probationStartDate', headerName: 'Ngày thử việc', width: 130, valueFormatter: (p) => formatDate(p.value) },
    { field: 'officialStartDate', headerName: 'Ngày chính thức', width: 140, valueFormatter: (p) => formatDate(p.value) },
    {
      field: 'workingStatusLabel', headerName: 'Trạng thái', width: 140,
      cellRenderer: (p: ICellRendererParams<EmployeeListItemDto>) =>
        p.value ? <Tag color="blue">{p.value}</Tag> : <Tag>Chưa rõ</Tag>,
    },
  ], [remove]);

  return (
    <ListShell
      title="Danh sách nhân viên"
      toolbar={
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Space size={8}>
              <Button type="primary" icon={<PlusOutlined />} onClick={() => setOpenCreate(true)}>
                Thêm nhân viên
              </Button>
              <Popconfirm
                title={`Xóa ${selectedIds.length} nhân viên đã chọn?`}
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
                {listQuery.data?.totalItems ?? 0} nhân viên
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
              placeholder="Phòng ban" allowClear showSearch optionFilterProp="label"
              style={{ width: 220 }}
              value={departmentId} onChange={setDepartmentId} loading={orgs.isLoading}
              options={(orgs.data?.items ?? []).map((u) => ({ value: u.id, label: u.name }))}
            />
            <Select
              placeholder="Vị trí công việc" allowClear showSearch optionFilterProp="label"
              style={{ width: 220 }}
              value={jobPositionId} onChange={setJobPositionId} loading={jobs.isLoading}
              options={(jobs.data?.items ?? []).map((j) => ({ value: j.id, label: j.name }))}
            />
            <Select
              placeholder="Trạng thái" allowClear showSearch optionFilterProp="label"
              style={{ width: 180 }}
              value={workingStatusId} onChange={setWorkingStatusId} loading={statuses.isLoading}
              options={(statuses.data?.items ?? []).map((s) => ({ value: s.id, label: s.name }))}
            />
            {filterCount > 0 && (
              <Button type="link" size="small"
                onClick={() => {
                  setKeyword(''); setDepartmentId(undefined);
                  setJobPositionId(undefined); setWorkingStatusId(undefined);
                }}
              >
                Xóa toàn bộ lọc
              </Button>
            )}
          </div>
        </>
      }
    >
      <AgListGrid<EmployeeListItemDto>
        ref={gridRef}
        rowData={data}
        columnDefs={columns}
        getRowId={(d) => d.employeeId}
        loading={listQuery.isLoading}
        emptyText="Chưa có nhân viên nào"
        selectable
        onSelectionChange={(rows) => setSelectedIds(rows.map((r) => r.employeeId))}
      />

      <EmployeeCreateModal
        open={openCreate}
        onClose={() => setOpenCreate(false)}
        onCreated={(id) => openProfile(id)}
      />

      <EmployeeProfileModal
        employeeId={profileEmployeeId}
        initialTab={profileTab}
        onClose={() => setProfileEmployeeId(null)}
      />
    </ListShell>
  );
}
