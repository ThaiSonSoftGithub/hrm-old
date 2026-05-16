import { Alert, Button, Popconfirm, Space, Tag, message } from 'antd';
import { CheckOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import dayjs from 'dayjs';
import { employeeApi } from './api';
import type { FamilyMemberDto } from './types';
import { FamilyMemberFormModal } from './FamilyMemberFormModal';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';
import { ApiError } from '@/shared/api/apiError';

interface Props {
  employeeId: string;
}

const formatDob = (s?: string | null, yearOnly?: boolean) => {
  if (!s) return '';
  if (yearOnly) return dayjs(s).format('YYYY');
  return dayjs(s).format('DD/MM/YYYY');
};

const yesNo = (v: boolean) => v
  ? <CheckOutlined style={{ color: '#10B981' }} />
  : <span style={{ color: '#CBD5E1' }}>—</span>;

export function Tab03Family({ employeeId }: Props) {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<FamilyMemberDto>>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<FamilyMemberDto | null>(null);

  const family = useQuery({
    queryKey: ['employee', employeeId, 'family'],
    queryFn: () => employeeApi.listFamily(employeeId),
  });

  const remove = useMutation({
    mutationFn: (id: string) => employeeApi.removeFamily(employeeId, id),
    onSuccess: () => {
      message.success('Đã xóa');
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'family'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không xóa được'),
  });

  const data = family.data ?? [];

  const columns = useMemo<ColDef<FamilyMemberDto>[]>(() => [
    {
      headerName: 'Thao tác', width: 90, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<FamilyMemberDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data!); setOpen(true); }} />
          <Popconfirm title={`Xóa thành viên ${p.data!.fullName}?`}
            onConfirm={() => remove.mutate(p.data!.id)}
            okText="Xóa" cancelText="Hủy"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    {
      headerName: 'Quan hệ', width: 140, pinned: 'left',
      valueGetter: (p) => p.data?.relation?.name ?? '',
      cellRenderer: (p: ICellRendererParams<FamilyMemberDto>) =>
        p.value ? <Tag color="blue">{p.value}</Tag> : '',
    },
    { field: 'fullName', headerName: 'Họ tên', minWidth: 200, flex: 1 },
    { field: 'genderLabel', headerName: 'Giới tính', width: 100 },
    {
      headerName: 'Ngày sinh', width: 130,
      valueGetter: (p) => p.data ? formatDob(p.data.dateOfBirth, p.data.birthYearOnly) : '',
    },
    { field: 'mobilePhone', headerName: 'ĐT di động', width: 140 },
    { field: 'email', headerName: 'Email', minWidth: 200, flex: 1 },
    { field: 'occupation', headerName: 'Nghề nghiệp', minWidth: 160, flex: 1 },
    {
      field: 'isDependent', headerName: 'Phụ thuộc', width: 110, sortable: false,
      cellRenderer: (p: ICellRendererParams<FamilyMemberDto>) => yesNo(!!p.value),
    },
    {
      field: 'isDeceased', headerName: 'Đã mất', width: 100, sortable: false,
      cellRenderer: (p: ICellRendererParams<FamilyMemberDto>) => yesNo(!!p.value),
    },
    { field: 'note', headerName: 'Ghi chú', minWidth: 200, flex: 1 },
  ], [remove]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 12 }}>
      <div
        style={{
          background: '#FAFBFF', border: '1px solid #F0F2F7', borderRadius: 10,
          padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Button type="primary" icon={<PlusOutlined />}
          onClick={() => { setEditing(null); setOpen(true); }}>
          Thêm thành viên
        </Button>
        <Space size={8}>
          <span style={{ color: '#9CA3AF', fontSize: 13 }}>{data.length} thành viên</span>
          <Button size="small" type="text" icon={<ReloadOutlined />}
            onClick={() => family.refetch()} loading={family.isFetching}>Tải lại</Button>
        </Space>
      </div>

      {family.isError && (
        <Alert type="error" showIcon
          message="Không tải được danh sách"
          description={(family.error as ApiError)?.message ?? ''} />
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        <AgListGrid<FamilyMemberDto>
          ref={gridRef}
          rowData={data}
          columnDefs={columns}
          getRowId={(d) => d.id}
          loading={family.isLoading}
          emptyText="Chưa có thành viên gia đình nào"
        />
      </div>

      <FamilyMemberFormModal
        open={open}
        onClose={() => setOpen(false)}
        employeeId={employeeId}
        editing={editing}
      />
    </div>
  );
}
