import { Alert, Button, Popconfirm, Space, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo, useRef, useState } from 'react';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { employeeApi } from './api';
import type { LaborContractDto } from './types';
import { LaborContractFormModal } from './LaborContractFormModal';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';
import { ApiError } from '@/shared/api/apiError';

interface Props {
  employeeId: string;
}

const formatDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('vi-VN') : '');
const formatMoney = (v?: number | null) => (v == null ? '' : v.toLocaleString('vi-VN'));

const STATUS_COLOR: Record<string, string> = {
  'Đang hiệu lực': 'green',
  'Sắp hiệu lực': 'blue',
  'Hết hiệu lực': 'default',
};

export function Tab04LaborContract({ employeeId }: Props) {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<LaborContractDto>>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LaborContractDto | null>(null);

  const general = useQuery({
    queryKey: ['employee', employeeId, 'general'],
    queryFn: () => employeeApi.getGeneral(employeeId),
  });
  const contracts = useQuery({
    queryKey: ['employee', employeeId, 'contracts'],
    queryFn: () => employeeApi.listContracts(employeeId),
  });

  const remove = useMutation({
    mutationFn: (contractId: string) => employeeApi.removeContract(employeeId, contractId),
    onSuccess: () => {
      message.success('Đã xóa hợp đồng');
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'contracts'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không xóa được'),
  });

  const data = contracts.data ?? [];

  const columns = useMemo<ColDef<LaborContractDto>[]>(() => [
    {
      headerName: 'Thao tác', width: 90, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<LaborContractDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data!); setOpen(true); }} />
          <Popconfirm title={`Xóa hợp đồng ${p.data!.contractNumber}?`}
            onConfirm={() => remove.mutate(p.data!.id)}
            okText="Xóa" cancelText="Hủy"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    { field: 'contractNumber', headerName: 'Số hợp đồng', width: 160, pinned: 'left' },
    {
      headerName: 'Loại hợp đồng', minWidth: 200, flex: 1,
      valueGetter: (p) => p.data?.contractType?.name ?? '',
    },
    { field: 'contractDurationText', headerName: 'Thời hạn', width: 140 },
    {
      headerName: 'Vị trí công việc', minWidth: 180, flex: 1,
      valueGetter: (p) => p.data?.jobPosition?.name ?? '',
    },
    {
      field: 'effectiveStartDate', headerName: 'Bắt đầu hiệu lực', width: 150,
      valueFormatter: (p) => formatDate(p.value),
    },
    {
      field: 'effectiveEndDate', headerName: 'Kết thúc', width: 130,
      valueFormatter: (p) => formatDate(p.value),
    },
    { field: 'baseSalary', headerName: 'Lương cơ bản', width: 150, type: 'numericColumn',
      valueFormatter: (p) => formatMoney(p.value) },
    {
      field: 'contractStatusLabel', headerName: 'Trạng thái', width: 140,
      cellRenderer: (p: ICellRendererParams<LaborContractDto>) =>
        p.value ? <Tag color={STATUS_COLOR[p.value] ?? 'default'}>{p.value}</Tag> : '',
    },
  ], [remove]);

  const employeeMeta = {
    code: general.data?.employeeCode ?? '',
    fullName: general.data?.fullName ?? '',
  };
  const defaults = {
    jobPositionId: general.data?.jobPositionId ?? null,
    departmentId: general.data?.departmentId ?? null,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 12 }}>
      {/* Toolbar */}
      <div
        style={{
          background: '#FAFBFF', border: '1px solid #F0F2F7', borderRadius: 10,
          padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          flexShrink: 0,
        }}
      >
        <Space size={8}>
          <Button type="primary" icon={<PlusOutlined />}
            onClick={() => { setEditing(null); setOpen(true); }}
            disabled={!general.data}
          >
            Thêm hợp đồng
          </Button>
        </Space>
        <Space size={8}>
          <span style={{ color: '#9CA3AF', fontSize: 13 }}>
            {data.length} hợp đồng
          </span>
          <Button size="small" type="text" icon={<ReloadOutlined />}
            onClick={() => contracts.refetch()} loading={contracts.isFetching}>
            Tải lại
          </Button>
        </Space>
      </div>

      {contracts.isError && (
        <Alert type="error" showIcon
          message="Không tải được danh sách hợp đồng"
          description={(contracts.error as ApiError)?.message ?? ''} />
      )}

      <div style={{ flex: 1, minHeight: 0 }}>
        <AgListGrid<LaborContractDto>
          ref={gridRef}
          rowData={data}
          columnDefs={columns}
          getRowId={(d) => d.id}
          loading={contracts.isLoading}
          emptyText="Chưa có hợp đồng nào"
        />
      </div>

      <LaborContractFormModal
        open={open}
        onClose={() => setOpen(false)}
        employeeId={employeeId}
        employeeMeta={employeeMeta}
        defaults={defaults}
        editing={editing}
      />
    </div>
  );
}
