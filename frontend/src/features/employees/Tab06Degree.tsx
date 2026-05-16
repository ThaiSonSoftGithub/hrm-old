import { Alert, Button, Card, Col, Form, Input, InputNumber, Popconfirm, Row, Select, Space, message } from 'antd';
import { BookOutlined, DeleteOutlined, EditOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import { employeeApi } from './api';
import type { DegreeDto, DegreeInput } from './types';
import { lookupApi } from '@/features/lookups/api';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { ApiError } from '@/shared/api/apiError';

interface Props { employeeId: string }

export function Tab06Degree({ employeeId }: Props) {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<DegreeDto>>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<DegreeDto | null>(null);

  const list = useQuery({
    queryKey: ['employee', employeeId, 'degrees'],
    queryFn: () => employeeApi.listDegrees(employeeId),
  });

  const remove = useMutation({
    mutationFn: (id: string) => employeeApi.removeDegree(employeeId, id),
    onSuccess: () => {
      message.success('Đã xóa');
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'degrees'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không xóa được'),
  });

  const data = list.data ?? [];

  const columns = useMemo<ColDef<DegreeDto>[]>(() => [
    {
      headerName: 'Thao tác', width: 90, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<DegreeDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data!); setOpen(true); }} />
          <Popconfirm title="Xóa bằng cấp?" onConfirm={() => remove.mutate(p.data!.id)} okText="Xóa" cancelText="Hủy">
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    { headerName: 'Nơi đào tạo', minWidth: 220, flex: 1, valueGetter: (p) => p.data?.educationPlace?.name ?? '' },
    { field: 'fromYear', headerName: 'Từ năm', width: 100 },
    { field: 'toYear', headerName: 'Đến năm', width: 100 },
    { headerName: 'Chuyên ngành', minWidth: 200, flex: 1, valueGetter: (p) => p.data?.educationMajor?.name ?? '' },
    { headerName: 'Trình độ đào tạo', minWidth: 160, flex: 1, valueGetter: (p) => p.data?.educationLevel?.name ?? '' },
    { headerName: 'Xếp loại', minWidth: 140, flex: 1, valueGetter: (p) => p.data?.degreeClassification?.name ?? '' },
    { field: 'graduationYear', headerName: 'Năm TN', width: 100 },
  ], [remove]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 12 }}>
      <SublistToolbar
        title="Thêm bằng cấp"
        icon={<PlusOutlined />}
        onAdd={() => { setEditing(null); setOpen(true); }}
        countLabel={`${data.length} bằng cấp`}
        onReload={() => list.refetch()}
        loading={list.isFetching}
      />
      {list.isError && <Alert type="error" showIcon message="Không tải được danh sách" description={(list.error as ApiError)?.message ?? ''} />}
      <div style={{ flex: 1, minHeight: 0 }}>
        <AgListGrid<DegreeDto>
          ref={gridRef} rowData={data} columnDefs={columns} getRowId={(d) => d.id}
          loading={list.isLoading} emptyText="Chưa có bằng cấp nào"
        />
      </div>
      <DegreeFormModal open={open} onClose={() => setOpen(false)} employeeId={employeeId} editing={editing} />
    </div>
  );
}

function DegreeFormModal({ open, onClose, employeeId, editing }: { open: boolean; onClose: () => void; employeeId: string; editing: DegreeDto | null }) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);

  const useLk = (cat: string) => useQuery({
    queryKey: ['lookup-options', cat],
    queryFn: () => lookupApi.listItems(cat, { page: 1, pageSize: 300 }),
    enabled: open,
  });
  const places = useLk('TrainingPlace');
  const faculties = useLk('TrainingFaculty');
  const majors = useLk('TrainingMajor');
  const levels = useLk('EducationLevel');
  const methods = useLk('TrainingMode');
  const ranks = useLk('DegreeRank');

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    if (editing) {
      form.setFieldsValue({
        educationPlaceId: editing.educationPlaceId,
        fromYear: editing.fromYear, toYear: editing.toYear,
        educationFacultyId: editing.educationFacultyId,
        educationMajorId: editing.educationMajorId,
        educationLevelId: editing.educationLevelId,
        educationMethodId: editing.educationMethodId,
        degreeClassificationId: editing.degreeClassificationId,
        graduationYear: editing.graduationYear, note: editing.note,
      });
    }
    setDirty(false);
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: (v: any) => {
      const body: DegreeInput = {
        educationPlaceId: v.educationPlaceId,
        fromYear: v.fromYear ?? null, toYear: v.toYear ?? null,
        educationFacultyId: v.educationFacultyId ?? null,
        educationMajorId: v.educationMajorId ?? null,
        educationLevelId: v.educationLevelId ?? null,
        educationMethodId: v.educationMethodId ?? null,
        degreeClassificationId: v.degreeClassificationId ?? null,
        graduationYear: v.graduationYear ?? null, note: v.note ?? null,
      };
      if (editing) return employeeApi.updateDegree(employeeId, editing.id, body);
      return employeeApi.createDegree(employeeId, body);
    },
    onSuccess: () => {
      message.success('Đã lưu');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'degrees'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  const opts = (rows?: { id: string; code: string; name: string }[]) => (rows ?? []).map((x) => ({ value: x.id, label: `${x.code} - ${x.name}` }));
  const optsName = (rows?: { id: string; name: string }[]) => (rows ?? []).map((x) => ({ value: x.id, label: x.name }));
  const formId = 'degree-form';

  return (
    <FormModalShell open={open} onClose={onClose}
      title={editing ? 'Sửa bằng cấp' : 'Thêm bằng cấp'}
      subtitle="Quá trình đào tạo & chuyên ngành"
      icon={<BookOutlined />}
      formId={formId} isSaving={save.isPending} dirty={dirty}
      width={820}
    >
      <Card size="small" title="Thông tin bằng cấp">
        <Form form={form} name={formId} layout="vertical"
          onValuesChange={() => setDirty(true)}
          onFinish={(v) => save.mutate(v)}
        >
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item label="Nơi đào tạo" name="educationPlaceId" rules={[{ required: true, message: 'Bắt buộc' }]}>
                <Select showSearch optionFilterProp="label" options={opts(places.data?.items)} loading={places.isLoading}
                  notFoundContent="Chưa có dữ liệu" />
              </Form.Item>
            </Col>
            <Col span={6}><Form.Item label="Từ năm" name="fromYear"><InputNumber style={{ width: '100%' }} min={1900} max={2100} /></Form.Item></Col>
            <Col span={6}><Form.Item label="Đến năm" name="toYear"><InputNumber style={{ width: '100%' }} min={1900} max={2100} /></Form.Item></Col>
            <Col span={6}><Form.Item label="Năm tốt nghiệp" name="graduationYear"><InputNumber style={{ width: '100%' }} min={1900} max={2100} /></Form.Item></Col>
            <Col span={6}><Form.Item label="Hình thức đào tạo" name="educationMethodId">
              <Select allowClear showSearch optionFilterProp="label" options={optsName(methods.data?.items)} />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Khoa" name="educationFacultyId">
              <Select allowClear showSearch optionFilterProp="label" options={opts(faculties.data?.items)} notFoundContent="Chưa có dữ liệu" />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Chuyên ngành" name="educationMajorId">
              <Select allowClear showSearch optionFilterProp="label" options={opts(majors.data?.items)} notFoundContent="Chưa có dữ liệu" />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Trình độ đào tạo" name="educationLevelId">
              <Select allowClear showSearch optionFilterProp="label" options={optsName(levels.data?.items)} />
            </Form.Item></Col>
            <Col span={12}><Form.Item label="Xếp loại" name="degreeClassificationId">
              <Select allowClear showSearch optionFilterProp="label" options={optsName(ranks.data?.items)} />
            </Form.Item></Col>
            <Col span={24}><Form.Item label="Ghi chú" name="note"><Input.TextArea rows={3} maxLength={2000} /></Form.Item></Col>
          </Row>
        </Form>
      </Card>
    </FormModalShell>
  );
}

// Toolbar chung cho 4 sublist tab
export function SublistToolbar({ title, icon, onAdd, countLabel, onReload, loading }: {
  title: string; icon: React.ReactNode; onAdd: () => void;
  countLabel: string; onReload: () => void; loading?: boolean;
}) {
  return (
    <div
      style={{
        background: '#FAFBFF', border: '1px solid #F0F2F7', borderRadius: 10,
        padding: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        flexShrink: 0,
      }}
    >
      <Button type="primary" icon={icon} onClick={onAdd}>{title}</Button>
      <Space size={8}>
        <span style={{ color: '#9CA3AF', fontSize: 13 }}>{countLabel}</span>
        <Button size="small" type="text" icon={<ReloadOutlined />} onClick={onReload} loading={loading}>Tải lại</Button>
      </Space>
    </div>
  );
}
