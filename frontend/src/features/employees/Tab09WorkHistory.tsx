import { Alert, Button, Card, Checkbox, Col, DatePicker, Form, Input, Popconfirm, Row, Select, Space, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SwapOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import dayjs from 'dayjs';
import { employeeApi } from './api';
import type { WorkHistoryDto, WorkHistoryInput } from './types';
import { lookupApi } from '@/features/lookups/api';
import { organizationApi } from '@/features/organization/api';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { SublistToolbar } from './Tab06Degree';
import { ApiError } from '@/shared/api/apiError';

interface Props { employeeId: string }

const formatDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('vi-VN') : '');

export function Tab09WorkHistory({ employeeId }: Props) {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<WorkHistoryDto>>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkHistoryDto | null>(null);

  const list = useQuery({
    queryKey: ['employee', employeeId, 'histories'],
    queryFn: () => employeeApi.listHistories(employeeId),
  });
  const remove = useMutation({
    mutationFn: (id: string) => employeeApi.removeHistory(employeeId, id),
    onSuccess: () => { message.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['employee', employeeId, 'histories'] }); },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không xóa được'),
  });

  const data = list.data ?? [];

  const columns = useMemo<ColDef<WorkHistoryDto>[]>(() => [
    {
      headerName: 'Thao tác', width: 90, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<WorkHistoryDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditing(p.data!); setOpen(true); }} />
          <Popconfirm title="Xóa quá trình công tác?" onConfirm={() => remove.mutate(p.data!.id)} okText="Xóa" cancelText="Hủy">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    { field: 'fromDate', headerName: 'Từ ngày', width: 110, valueFormatter: (p) => formatDate(p.value) },
    {
      field: 'toDate', headerName: 'Đến ngày', width: 130,
      valueFormatter: (p) => p.value ? formatDate(p.value) : 'Đến nay',
    },
    { headerName: 'Vị trí công việc', minWidth: 180, flex: 1, valueGetter: (p) => p.data?.jobPosition?.name ?? '' },
    { headerName: 'Chức danh', minWidth: 160, flex: 1, valueGetter: (p) => p.data?.jobTitle?.name ?? '' },
    { headerName: 'Phòng ban', minWidth: 180, flex: 1, valueGetter: (p) => p.data?.department?.name ?? '' },
    { headerName: 'Đơn vị công tác', minWidth: 180, flex: 1, valueGetter: (p) => p.data?.organizationUnit?.name ?? '' },
    { headerName: 'Quản lý trực tiếp', minWidth: 180, flex: 1, valueGetter: (p) => p.data?.directManager?.name ?? '' },
    {
      field: 'statusLabel', headerName: 'Trạng thái', width: 130,
      cellRenderer: (p: ICellRendererParams<WorkHistoryDto>) => p.value ? (
        <Tag color={p.value === 'Đang công tác' ? 'green' : 'default'}>{p.value}</Tag>
      ) : '',
    },
  ], [remove]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 12 }}>
      <SublistToolbar
        title="Thêm quá trình công tác"
        icon={<PlusOutlined />}
        onAdd={() => { setEditing(null); setOpen(true); }}
        countLabel={`${data.length} bản ghi`}
        onReload={() => list.refetch()}
        loading={list.isFetching}
      />
      {list.isError && <Alert type="error" showIcon message="Không tải được danh sách" description={(list.error as ApiError)?.message ?? ''} />}
      <div style={{ flex: 1, minHeight: 0 }}>
        <AgListGrid<WorkHistoryDto>
          ref={gridRef} rowData={data} columnDefs={columns} getRowId={(d) => d.id}
          loading={list.isLoading} emptyText="Chưa có quá trình công tác nào"
        />
      </div>
      <HistoryFormModal open={open} onClose={() => setOpen(false)} employeeId={employeeId} editing={editing} />
    </div>
  );
}

function HistoryFormModal({ open, onClose, employeeId, editing }: { open: boolean; onClose: () => void; employeeId: string; editing: WorkHistoryDto | null }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);
  const [isCurrent, setIsCurrent] = useState(false);

  const useLk = (cat: string) => useQuery({
    queryKey: ['lookup-options', cat],
    queryFn: () => lookupApi.listItems(cat, { page: 1, pageSize: 300 }),
    enabled: open,
  });
  const positions = useLk('JobPosition');
  const titles = useLk('JobTitle');
  const orgs = useQuery({
    queryKey: ['org-units', 'options'],
    queryFn: () => organizationApi.list({ page: 1, pageSize: 500 }),
    enabled: open,
  });
  const employees = useQuery({
    queryKey: ['employees', 'options'],
    queryFn: () => employeeApi.list({ page: 1, pageSize: 1000 }),
    enabled: open,
  });

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setIsCurrent(editing?.isCurrent ?? false);
    if (editing) {
      form.setFieldsValue({
        fromDate: editing.fromDate ? dayjs(editing.fromDate) : null,
        toDate: editing.toDate ? dayjs(editing.toDate) : null,
        isCurrent: editing.isCurrent,
        jobPositionId: editing.jobPositionId,
        jobTitleId: editing.jobTitleId,
        organizationUnitId: editing.organizationUnitId,
        departmentId: editing.departmentId,
        directManagerEmployeeId: editing.directManagerEmployeeId,
        decisionNumber: editing.decisionNumber,
        decisionDate: editing.decisionDate ? dayjs(editing.decisionDate) : null,
        note: editing.note,
      });
    }
    setDirty(false);
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: (v: any) => {
      const body: WorkHistoryInput = {
        fromDate: v.fromDate.format('YYYY-MM-DD'),
        toDate: v.isCurrent ? null : (v.toDate ? v.toDate.format('YYYY-MM-DD') : null),
        isCurrent: !!v.isCurrent,
        jobPositionId: v.jobPositionId,
        jobTitleId: v.jobTitleId ?? null,
        organizationUnitId: v.organizationUnitId,
        departmentId: v.departmentId,
        directManagerEmployeeId: v.directManagerEmployeeId ?? null,
        decisionNumber: v.decisionNumber ?? null,
        decisionDate: v.decisionDate ? v.decisionDate.format('YYYY-MM-DD') : null,
        note: v.note ?? null,
      };
      if (editing) return employeeApi.updateHistory(employeeId, editing.id, body);
      return employeeApi.createHistory(employeeId, body);
    },
    onSuccess: () => {
      message.success('Đã lưu'); setDirty(false);
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'histories'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  const opts = (rows?: { id: string; code: string; name: string }[]) => (rows ?? []).map((x) => ({ value: x.id, label: `${x.code} - ${x.name}` }));
  const empOpts = (employees.data?.items ?? [])
    .filter((x) => x.employeeId !== employeeId)
    .map((x) => ({ value: x.employeeId, label: `${x.employeeCode} - ${x.fullName}` }));
  const formId = 'history-form';

  return (
    <FormModalShell open={open} onClose={onClose}
      title={editing ? 'Sửa quá trình công tác' : 'Thêm quá trình công tác'}
      subtitle="Vị trí, đơn vị, quyết định điều chuyển nội bộ"
      icon={<SwapOutlined />}
      formId={formId} isSaving={save.isPending} dirty={dirty}
      width={900}
      bodyHeight="78vh"
    >
      <Form form={form} name={formId} layout="vertical"
        onValuesChange={(changed) => {
          setDirty(true);
          if (Object.prototype.hasOwnProperty.call(changed, 'isCurrent')) {
            setIsCurrent(!!changed.isCurrent);
            if (changed.isCurrent) form.setFieldValue('toDate', null);
          }
        }}
        onFinish={(v) => save.mutate(v)}
      >
        <Card size="small" title="Thời gian" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Từ ngày" name="fromDate" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
            </Form.Item></Col>
            <Col span={8}><Form.Item label="Đến ngày" name="toDate">
              <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" disabled={isCurrent} />
            </Form.Item></Col>
            <Col span={8}><Form.Item label=" " name="isCurrent" valuePropName="checked">
              <Checkbox>Đến nay</Checkbox>
            </Form.Item></Col>
          </Row>
        </Card>

        <Card size="small" title="Vị trí & đơn vị" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Vị trí công việc" name="jobPositionId" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select showSearch optionFilterProp="label" options={opts(positions.data?.items)} loading={positions.isLoading} />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Chức danh" name="jobTitleId">
              <Select allowClear showSearch optionFilterProp="label" options={opts(titles.data?.items)} loading={titles.isLoading} />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Đơn vị công tác" name="organizationUnitId" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select showSearch optionFilterProp="label" options={opts(orgs.data?.items)} loading={orgs.isLoading} />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Phòng ban" name="departmentId" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select showSearch optionFilterProp="label" options={opts(orgs.data?.items)} loading={orgs.isLoading} />
            </Form.Item></Col>
            <Col span={24}><Form.Item label="Quản lý trực tiếp" name="directManagerEmployeeId">
              <Select allowClear showSearch optionFilterProp="label" options={empOpts} loading={employees.isLoading} />
            </Form.Item></Col>
          </Row>
        </Card>

        <Card size="small" title="Quyết định">
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Số quyết định" name="decisionNumber"><Input maxLength={64} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Ngày quyết định" name="decisionDate"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
            <Col span={24}><Form.Item label="Ghi chú" name="note"><Input.TextArea rows={3} maxLength={2000} /></Form.Item></Col>
          </Row>
        </Card>
      </Form>
    </FormModalShell>
  );
}
