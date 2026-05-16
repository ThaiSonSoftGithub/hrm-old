import { Alert, Button, Card, Col, DatePicker, Form, Input, Popconfirm, Row, Select, Space, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import dayjs from 'dayjs';
import { employeeApi } from './api';
import type { CertificateDto, CertificateInput } from './types';
import { lookupApi } from '@/features/lookups/api';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { SublistToolbar } from './Tab06Degree';
import { ApiError } from '@/shared/api/apiError';

interface Props { employeeId: string }

const formatDate = (v?: string | null) => (v ? new Date(v).toLocaleDateString('vi-VN') : '');
const STATUS_COLOR: Record<string, string> = { 'Còn hiệu lực': 'green', 'Hết hạn': 'red' };

export function Tab07Certificate({ employeeId }: Props) {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<CertificateDto>>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<CertificateDto | null>(null);

  const list = useQuery({
    queryKey: ['employee', employeeId, 'certificates'],
    queryFn: () => employeeApi.listCertificates(employeeId),
  });
  const remove = useMutation({
    mutationFn: (id: string) => employeeApi.removeCertificate(employeeId, id),
    onSuccess: () => { message.success('Đã xóa'); qc.invalidateQueries({ queryKey: ['employee', employeeId, 'certificates'] }); },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không xóa được'),
  });

  const data = list.data ?? [];

  const columns = useMemo<ColDef<CertificateDto>[]>(() => [
    {
      headerName: 'Thao tác', width: 90, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<CertificateDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />} onClick={() => { setEditing(p.data!); setOpen(true); }} />
          <Popconfirm title="Xóa chứng chỉ?" onConfirm={() => remove.mutate(p.data!.id)} okText="Xóa" cancelText="Hủy">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    { field: 'certificateName', headerName: 'Tên chứng chỉ', minWidth: 220, flex: 1, pinned: 'left' },
    { field: 'certificateNumber', headerName: 'Số chứng chỉ', width: 160 },
    { headerName: 'Nhóm chứng chỉ', minWidth: 200, flex: 1, valueGetter: (p) => p.data?.certificateType?.name ?? '' },
    { field: 'issuedDate', headerName: 'Ngày cấp', width: 120, valueFormatter: (p) => formatDate(p.value) },
    { field: 'expiryDate', headerName: 'Ngày hết hạn', width: 130, valueFormatter: (p) => formatDate(p.value) },
    { headerName: 'Trình độ', minWidth: 140, flex: 1, valueGetter: (p) => p.data?.educationLevel?.name ?? '' },
    { headerName: 'Xếp loại', minWidth: 140, flex: 1, valueGetter: (p) => p.data?.certificateClassification?.name ?? '' },
    {
      field: 'statusLabel', headerName: 'Trạng thái', width: 130,
      cellRenderer: (p: ICellRendererParams<CertificateDto>) => p.value ? <Tag color={STATUS_COLOR[p.value] ?? 'default'}>{p.value}</Tag> : '',
    },
  ], [remove]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 12 }}>
      <SublistToolbar
        title="Thêm chứng chỉ"
        icon={<PlusOutlined />}
        onAdd={() => { setEditing(null); setOpen(true); }}
        countLabel={`${data.length} chứng chỉ`}
        onReload={() => list.refetch()}
        loading={list.isFetching}
      />
      {list.isError && <Alert type="error" showIcon message="Không tải được danh sách" description={(list.error as ApiError)?.message ?? ''} />}
      <div style={{ flex: 1, minHeight: 0 }}>
        <AgListGrid<CertificateDto>
          ref={gridRef} rowData={data} columnDefs={columns} getRowId={(d) => d.id}
          loading={list.isLoading} emptyText="Chưa có chứng chỉ nào"
        />
      </div>
      <CertFormModal open={open} onClose={() => setOpen(false)} employeeId={employeeId} editing={editing} />
    </div>
  );
}

function CertFormModal({ open, onClose, employeeId, editing }: { open: boolean; onClose: () => void; employeeId: string; editing: CertificateDto | null }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);

  const useLk = (cat: string) => useQuery({
    queryKey: ['lookup-options', cat],
    queryFn: () => lookupApi.listItems(cat, { page: 1, pageSize: 200 }),
    enabled: open,
  });
  const types = useLk('CertificateType');
  const ranks = useLk('CertificateRank');
  const levels = useLk('EducationLevel');

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (editing) {
      form.setFieldsValue({
        certificateTypeId: editing.certificateTypeId,
        certificateName: editing.certificateName,
        certificateNumber: editing.certificateNumber,
        educationLevelId: editing.educationLevelId,
        issuedDate: editing.issuedDate ? dayjs(editing.issuedDate) : null,
        expiryDate: editing.expiryDate ? dayjs(editing.expiryDate) : null,
        issuedPlace: editing.issuedPlace,
        certificateClassificationId: editing.certificateClassificationId,
        note: editing.note,
      });
    }
    setDirty(false);
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: (v: any) => {
      const body: CertificateInput = {
        certificateTypeId: v.certificateTypeId,
        certificateName: (v.certificateName ?? '').trim(),
        certificateNumber: v.certificateNumber ?? null,
        educationLevelId: v.educationLevelId ?? null,
        issuedDate: v.issuedDate ? v.issuedDate.format('YYYY-MM-DD') : null,
        expiryDate: v.expiryDate ? v.expiryDate.format('YYYY-MM-DD') : null,
        issuedPlace: v.issuedPlace ?? null,
        certificateClassificationId: v.certificateClassificationId ?? null,
        note: v.note ?? null,
      };
      if (editing) return employeeApi.updateCertificate(employeeId, editing.id, body);
      return employeeApi.createCertificate(employeeId, body);
    },
    onSuccess: () => {
      message.success('Đã lưu'); setDirty(false);
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'certificates'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  const optsName = (rows?: { id: string; name: string }[]) => (rows ?? []).map((x) => ({ value: x.id, label: x.name }));
  const formId = 'cert-form';

  return (
    <FormModalShell open={open} onClose={onClose}
      title={editing ? 'Sửa chứng chỉ' : 'Thêm chứng chỉ'}
      subtitle={editing ? editing.certificateName : 'Bổ sung chứng chỉ của nhân viên'}
      icon={<SafetyCertificateOutlined />}
      formId={formId} isSaving={save.isPending} dirty={dirty}
      width={820}
    >
      <Card size="small" title="Thông tin chứng chỉ">
        <Form form={form} name={formId} layout="vertical"
          onValuesChange={() => setDirty(true)}
          onFinish={(v) => save.mutate(v)}
        >
          <Row gutter={16}>
            <Col span={12}><Form.Item label="Nhóm chứng chỉ" name="certificateTypeId" rules={[{ required: true, message: 'Bắt buộc' }]}>
              <Select showSearch optionFilterProp="label" options={optsName(types.data?.items)} />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Trình độ" name="educationLevelId">
              <Select allowClear showSearch optionFilterProp="label" options={optsName(levels.data?.items)} />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Tên chứng chỉ" name="certificateName" rules={[{ required: true, message: 'Bắt buộc' }, { max: 255 }]}>
              <Input />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Số chứng chỉ" name="certificateNumber"><Input maxLength={64} /></Form.Item></Col>
            <Col span={8}><Form.Item label="Ngày cấp" name="issuedDate"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
            <Col span={8}><Form.Item label="Ngày hết hạn" name="expiryDate"><DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" /></Form.Item></Col>
            <Col span={8}><Form.Item label="Xếp loại" name="certificateClassificationId">
              <Select allowClear showSearch optionFilterProp="label" options={optsName(ranks.data?.items)} />
            </Form.Item></Col>
            <Col span={24}><Form.Item label="Nơi cấp" name="issuedPlace"><Input maxLength={256} /></Form.Item></Col>
            <Col span={24}><Form.Item label="Ghi chú" name="note"><Input.TextArea rows={3} maxLength={2000} /></Form.Item></Col>
          </Row>
        </Form>
      </Card>
    </FormModalShell>
  );
}
