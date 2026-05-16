import { Alert, Button, Card, Col, DatePicker, Form, Input, InputNumber, Popconfirm, Row, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, HistoryOutlined, PlusOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import dayjs from 'dayjs';
import { employeeApi } from './api';
import type { WorkExperienceDto, WorkExperienceInput } from './types';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { SublistToolbar } from './Tab06Degree';
import { ApiError } from '@/shared/api/apiError';

interface Props { employeeId: string }

const formatMY = (s?: string | null) => (s ? dayjs(s + '-01').format('MM/YYYY') : '');
const formatMoney = (v?: number | null) => (v == null ? '' : v.toLocaleString('vi-VN'));

export function Tab08WorkExperience({ employeeId }: Props) {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<WorkExperienceDto>>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<WorkExperienceDto | null>(null);

  const list = useQuery({
    queryKey: ['employee', employeeId, 'experiences'],
    queryFn: () => employeeApi.listExperiences(employeeId),
  });
  const remove = useMutation({
    mutationFn: (id: string) => employeeApi.removeExperience(employeeId, id),
    onSuccess: () => { message.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['employee', employeeId, 'experiences'] }); },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không xóa được'),
  });

  const data = list.data ?? [];

  const columns = useMemo<ColDef<WorkExperienceDto>[]>(() => [
    {
      headerName: 'Thao tác', width: 90, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<WorkExperienceDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditing(p.data!); setOpen(true); }} />
          <Popconfirm title="Xóa kinh nghiệm?" onConfirm={() => remove.mutate(p.data!.id)} okText="Xóa" cancelText="Hủy">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    { field: 'fromMonthYear', headerName: 'Từ tháng/năm', width: 130, valueFormatter: (p) => formatMY(p.value) },
    { field: 'toMonthYear', headerName: 'Đến tháng/năm', width: 130, valueFormatter: (p) => formatMY(p.value) },
    { field: 'workplaceName', headerName: 'Nơi làm việc', minWidth: 220, flex: 1 },
    { field: 'jobTitleText', headerName: 'Vị trí công việc', minWidth: 200, flex: 1 },
    { field: 'salaryAmount', headerName: 'Mức lương', width: 140, valueFormatter: (p) => formatMoney(p.value) },
    { field: 'jobDescription', headerName: 'Mô tả công việc', minWidth: 240, flex: 1 },
  ], [remove]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 12 }}>
      <SublistToolbar
        title="Thêm kinh nghiệm"
        icon={<PlusOutlined />}
        onAdd={() => { setEditing(null); setOpen(true); }}
        countLabel={`${data.length} kinh nghiệm`}
        onReload={() => list.refetch()}
        loading={list.isFetching}
      />
      {list.isError && <Alert type="error" showIcon message="Không tải được danh sách" description={(list.error as ApiError)?.message ?? ''} />}
      <div style={{ flex: 1, minHeight: 0 }}>
        <AgListGrid<WorkExperienceDto>
          ref={gridRef} rowData={data} columnDefs={columns} getRowId={(d) => d.id}
          loading={list.isLoading} emptyText="Chưa có kinh nghiệm nào"
        />
      </div>
      <ExperienceFormModal open={open} onClose={() => setOpen(false)} employeeId={employeeId} editing={editing} />
    </div>
  );
}

function ExperienceFormModal({ open, onClose, employeeId, editing }: { open: boolean; onClose: () => void; employeeId: string; editing: WorkExperienceDto | null }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (editing) {
      form.setFieldsValue({
        fromMonthYear: editing.fromMonthYear ? dayjs(editing.fromMonthYear + '-01') : null,
        toMonthYear: editing.toMonthYear ? dayjs(editing.toMonthYear + '-01') : null,
        workplaceName: editing.workplaceName,
        jobTitleText: editing.jobTitleText,
        salaryAmount: editing.salaryAmount,
        jobDescription: editing.jobDescription,
        note: editing.note,
        referenceName: editing.referenceName,
        referenceJobTitle: editing.referenceJobTitle,
        referencePhone: editing.referencePhone,
        referenceEmail: editing.referenceEmail,
      });
    }
    setDirty(false);
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: (v: any) => {
      const body: WorkExperienceInput = {
        fromMonthYear: v.fromMonthYear ? v.fromMonthYear.format('YYYY-MM') : '',
        toMonthYear: v.toMonthYear ? v.toMonthYear.format('YYYY-MM') : '',
        workplaceName: (v.workplaceName ?? '').trim(),
        jobTitleText: (v.jobTitleText ?? '').trim(),
        salaryAmount: v.salaryAmount ?? null,
        jobDescription: v.jobDescription ?? null,
        note: v.note ?? null,
        referenceName: v.referenceName ?? null,
        referenceJobTitle: v.referenceJobTitle ?? null,
        referencePhone: v.referencePhone ?? null,
        referenceEmail: v.referenceEmail ?? null,
      };
      if (editing) return employeeApi.updateExperience(employeeId, editing.id, body);
      return employeeApi.createExperience(employeeId, body);
    },
    onSuccess: () => {
      message.success('Đã lưu'); setDirty(false);
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'experiences'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  const formId = 'experience-form';

  return (
    <FormModalShell open={open} onClose={onClose}
      title={editing ? 'Sửa kinh nghiệm làm việc' : 'Thêm kinh nghiệm làm việc'}
      subtitle="Quá trình công tác bên ngoài trước khi vào công ty"
      icon={<HistoryOutlined />}
      formId={formId} isSaving={save.isPending} dirty={dirty}
      width={840}
      bodyHeight="78vh"
    >
      <Form form={form} name={formId} layout="vertical"
        onValuesChange={() => setDirty(true)}
        onFinish={(v) => save.mutate(v)}
      >
        <Card size="small" title="Thời gian & nơi làm việc" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}><Form.Item label="Từ tháng/năm" name="fromMonthYear" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <DatePicker picker="month" style={{ width: '100%' }} format="MM/YYYY" />
            </Form.Item></Col>
            <Col span={8}><Form.Item label="Đến tháng/năm" name="toMonthYear" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <DatePicker picker="month" style={{ width: '100%' }} format="MM/YYYY" />
            </Form.Item></Col>
            <Col span={8}><Form.Item label="Mức lương" name="salaryAmount">
              <InputNumber style={{ width: '100%' }} min={0} step={100000}
                formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                parser={(v) => Number((v ?? '').replace(/,/g, '')) as any} />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Nơi làm việc" name="workplaceName" rules={[{ required: true, message: 'Bắt buộc' }, { max: 255 }]}>
              <Input />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Vị trí công việc" name="jobTitleText" rules={[{ required: true, message: 'Bắt buộc' }, { max: 255 }]}>
              <Input />
            </Form.Item></Col>
            <Col span={24}><Form.Item label="Mô tả công việc" name="jobDescription"><Input.TextArea rows={3} maxLength={2000} /></Form.Item></Col>
            <Col span={24}><Form.Item label="Ghi chú" name="note"><Input.TextArea rows={2} maxLength={2000} /></Form.Item></Col>
          </Row>
        </Card>

        <Card size="small" title="Người tham khảo / đối chiếu">
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Họ tên" name="referenceName"><Input maxLength={128} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Chức danh" name="referenceJobTitle"><Input maxLength={128} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Điện thoại" name="referencePhone"><Input maxLength={32} /></Form.Item></Col>
            <Col span={12}><Form.Item label="Email" name="referenceEmail" rules={[{ type: 'email', message: 'Email không hợp lệ' }]}>
              <Input maxLength={256} />
            </Form.Item></Col>
          </Row>
        </Card>
      </Form>
    </FormModalShell>
  );
}
