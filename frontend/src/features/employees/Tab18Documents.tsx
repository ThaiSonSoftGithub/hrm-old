import { Alert, Button, Card, Drawer, Form, Input, Popconfirm, Space, Tag, Upload, message } from 'antd';
import {
  DeleteOutlined, DownloadOutlined, EditOutlined, FileOutlined,
  FolderOpenOutlined, InboxOutlined, PaperClipOutlined, PlusOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColDef, ICellRendererParams } from 'ag-grid-community';
import dayjs from 'dayjs';
import { employeeApi } from './api';
import type { EmployeeDocumentDto, EmployeeDocumentFileDto } from './types';
import { AgListGrid, type AgListGridHandle } from '@/shared/components/AgListGrid';
import { FormModalShell } from '@/shared/components/FormModalShell';
import { SublistToolbar } from './Tab06Degree';
import { tokenStorage } from '@/shared/api/tokenStorage';
import { ApiError } from '@/shared/api/apiError';

interface Props { employeeId: string }

const formatDateTime = (s?: string | null) => (s ? dayjs(s).format('DD/MM/YYYY HH:mm') : '');
const formatBytes = (n: number): string => {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export function Tab18Documents({ employeeId }: Props) {
  const qc = useQueryClient();
  const gridRef = useRef<AgListGridHandle<EmployeeDocumentDto>>(null);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<EmployeeDocumentDto | null>(null);
  const [drawerDoc, setDrawerDoc] = useState<EmployeeDocumentDto | null>(null);

  const list = useQuery({
    queryKey: ['employee', employeeId, 'documents'],
    queryFn: () => employeeApi.listDocuments(employeeId),
  });
  const remove = useMutation({
    mutationFn: (id: string) => employeeApi.removeDocument(employeeId, id),
    onSuccess: () => {
      message.success('Đã xóa hồ sơ');
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'documents'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không xóa được'),
  });

  const data = list.data ?? [];
  const submittedCount = data.filter((d) => d.isSubmitted).length;

  const columns = useMemo<ColDef<EmployeeDocumentDto>[]>(() => [
    {
      headerName: 'Thao tác', width: 120, pinned: 'left', sortable: false, filter: false,
      cellRenderer: (p: ICellRendererParams<EmployeeDocumentDto>) => (
        <Space size={2}>
          <Button type="text" size="small" icon={<FolderOpenOutlined />}
            onClick={() => setDrawerDoc(p.data!)} title="Xem file đính kèm" />
          <Button type="text" size="small" icon={<EditOutlined />}
            onClick={() => { setEditing(p.data!); setOpen(true); }} title="Sửa" />
          <Popconfirm title={`Xóa hồ sơ "${p.data!.name}"?`}
            onConfirm={() => remove.mutate(p.data!.id)} okText="Xóa" cancelText="Hủy"
          >
            <Button type="text" size="small" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
    { field: 'name', headerName: 'Tên hồ sơ', minWidth: 240, flex: 1, pinned: 'left' },
    { field: 'note', headerName: 'Ghi chú', minWidth: 280, flex: 1 },
    {
      field: 'fileCount', headerName: 'Số file', width: 100,
      cellRenderer: (p: ICellRendererParams<EmployeeDocumentDto>) => (
        <Space size={4}><PaperClipOutlined /> {p.value}</Space>
      ),
    },
    {
      field: 'totalBytes', headerName: 'Dung lượng', width: 130,
      valueFormatter: (p) => formatBytes(p.value ?? 0),
    },
    {
      field: 'isSubmitted', headerName: 'Trạng thái', width: 130,
      cellRenderer: (p: ICellRendererParams<EmployeeDocumentDto>) =>
        p.value ? <Tag color="green">Đã nộp</Tag> : <Tag>Chưa nộp</Tag>,
    },
    { field: 'submittedAt', headerName: 'Thời điểm', width: 160, valueFormatter: (p) => formatDateTime(p.value) },
  ], [remove]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0, gap: 12 }}>
      <SublistToolbar
        title="Thêm hồ sơ"
        icon={<PlusOutlined />}
        onAdd={() => { setEditing(null); setOpen(true); }}
        countLabel={`${data.length} hồ sơ · ${submittedCount} đã nộp`}
        onReload={() => list.refetch()}
        loading={list.isFetching}
      />
      {list.isError && <Alert type="error" showIcon message="Không tải được" description={(list.error as ApiError)?.message ?? ''} />}
      <div style={{ flex: 1, minHeight: 0 }}>
        <AgListGrid<EmployeeDocumentDto>
          ref={gridRef} rowData={data} columnDefs={columns} getRowId={(d) => d.id}
          loading={list.isLoading} emptyText="Chưa có hồ sơ tài liệu nào"
        />
      </div>

      <DocumentFormModal
        open={open}
        onClose={() => setOpen(false)}
        employeeId={employeeId}
        editing={editing}
      />
      <DocumentFilesDrawer
        open={!!drawerDoc}
        onClose={() => setDrawerDoc(null)}
        employeeId={employeeId}
        document={drawerDoc}
      />
    </div>
  );
}

function DocumentFormModal({ open, onClose, employeeId, editing }: {
  open: boolean; onClose: () => void; employeeId: string; editing: EmployeeDocumentDto | null;
}) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!open) return;
    form.resetFields();
    setFiles([]);
    if (editing) form.setFieldsValue({ name: editing.name, note: editing.note });
    setDirty(false);
  }, [open, editing, form]);

  const save = useMutation({
    mutationFn: async (v: any) => {
      const name = (v.name ?? '').trim();
      const note = (v.note ?? '').trim();
      if (editing) {
        return employeeApi.updateDocument(employeeId, editing.id, name, note);
      }
      if (files.length === 0) {
        throw new ApiError(400, { code: 'EMPLOYEE_DOCUMENT_ATTACHMENT_REQUIRED', message: 'Cần ít nhất 1 file đính kèm.' });
      }
      return employeeApi.createDocument(employeeId, name, note, files);
    },
    onSuccess: () => {
      message.success('Đã lưu hồ sơ');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'documents'] });
      onClose();
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  const formId = 'document-form';

  return (
    <FormModalShell open={open} onClose={onClose}
      title={editing ? 'Sửa hồ sơ tài liệu' : 'Thêm hồ sơ tài liệu'}
      subtitle={editing ? editing.name : 'Đính kèm 1 hoặc nhiều file'}
      icon={<FileOutlined />}
      formId={formId} isSaving={save.isPending} dirty={dirty || files.length > 0}
      width={720}
    >
      <Card size="small" title="Thông tin hồ sơ">
        <Form form={form} name={formId} layout="vertical"
          onValuesChange={() => setDirty(true)}
          onFinish={(v) => save.mutate(v)}
        >
          <Form.Item label="Tên hồ sơ" name="name" rules={[{ required: true, message: 'Bắt buộc' }, { max: 255 }]}>
            <Input placeholder="VD: Sơ yếu lý lịch, Bản sao CMND..." />
          </Form.Item>
          <Form.Item label="Ghi chú" name="note" rules={[{ required: true, message: 'Bắt buộc' }, { max: 2000 }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
          {!editing && (
            <Form.Item label="Tệp đính kèm" required>
              <Upload.Dragger
                multiple
                beforeUpload={(file) => {
                  setFiles((prev) => [...prev, file]);
                  setDirty(true);
                  return false;
                }}
                onRemove={(file) => {
                  setFiles((prev) => prev.filter((f) => f.name !== file.name || f.size !== file.size));
                  return true;
                }}
                fileList={files.map((f, i) => ({
                  uid: String(i), name: f.name, size: f.size, status: 'done' as const,
                }))}
              >
                <p style={{ marginBottom: 8 }}><InboxOutlined style={{ fontSize: 32, color: '#5B6CFF' }} /></p>
                <p style={{ fontWeight: 500 }}>Click hoặc kéo thả file vào đây</p>
                <p style={{ color: '#9CA3AF', fontSize: 12 }}>Hỗ trợ nhiều file. Tối đa 50MB / file, 20 file / lần.</p>
              </Upload.Dragger>
            </Form.Item>
          )}
          {editing && (
            <Alert type="info" showIcon style={{ marginTop: 8 }}
              message="Quản lý file đính kèm trong panel chi tiết (icon thư mục ở dòng tương ứng)."
            />
          )}
        </Form>
      </Card>
    </FormModalShell>
  );
}

function DocumentFilesDrawer({ open, onClose, employeeId, document }: {
  open: boolean; onClose: () => void; employeeId: string; document: EmployeeDocumentDto | null;
}) {
  const qc = useQueryClient();
  const [uploading, setUploading] = useState(false);

  const filesQuery = useQuery({
    queryKey: ['employee', employeeId, 'document-files', document?.id],
    queryFn: () => employeeApi.listDocumentFiles(employeeId, document!.id),
    enabled: open && !!document,
  });

  const removeFile = useMutation({
    mutationFn: (fileId: string) => employeeApi.removeDocumentFile(employeeId, document!.id, fileId),
    onSuccess: () => {
      message.success('Đã xóa file');
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'document-files', document?.id] });
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'documents'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không xóa được'),
  });

  const upload = async (newFiles: File[]) => {
    if (!document || newFiles.length === 0) return;
    setUploading(true);
    try {
      await employeeApi.uploadDocumentFiles(employeeId, document.id, newFiles);
      message.success('Đã upload');
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'document-files', document.id] });
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'documents'] });
    } catch (e: any) {
      message.error(e?.message ?? 'Upload thất bại');
    } finally {
      setUploading(false);
    }
  };

  const downloadFile = async (file: EmployeeDocumentFileDto) => {
    if (!document) return;
    const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) || '/api';
    const path = employeeApi.downloadDocumentFileUrl(employeeId, document.id, file.id);
    const url = BASE_URL.startsWith('http') ? `${BASE_URL}${path}` : `${window.location.origin}${BASE_URL}${path}`;
    const token = tokenStorage.getAccess();
    try {
      const res = await fetch(url, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = window.document.createElement('a');
      a.href = objectUrl; a.download = file.fileName;
      window.document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objectUrl);
    } catch (e: any) {
      message.error('Không tải được file: ' + (e?.message ?? ''));
    }
  };

  if (!document) return null;
  const files = filesQuery.data ?? [];

  return (
    <Drawer
      open={open} onClose={onClose}
      title={
        <Space>
          <FolderOpenOutlined style={{ color: '#5B6CFF' }} />
          <span>{document.name}</span>
          <Tag style={{ margin: 0 }}>{files.length} file</Tag>
        </Space>
      }
      width={620}
      extra={
        <Upload
          multiple
          showUploadList={false}
          beforeUpload={(file, fileList) => {
            // batch tất cả file 1 lần upload
            if (file === fileList[0]) upload(fileList);
            return false;
          }}
        >
          <Button type="primary" icon={<PlusOutlined />} loading={uploading}>Thêm file</Button>
        </Upload>
      }
    >
      {files.length === 0 ? (
        <Alert type="warning" showIcon message="Hồ sơ này chưa có file đính kèm." />
      ) : (
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {files.map((f) => (
            <div key={f.id}
              style={{
                background: '#fff', border: '1px solid #F0F2F7', borderRadius: 10,
                padding: '10px 14px',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 500, color: '#1F2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  <FileOutlined style={{ marginRight: 8, color: '#5B6CFF' }} />
                  {f.fileName}
                </div>
                <div style={{ fontSize: 12, color: '#9CA3AF', marginTop: 2 }}>
                  {formatBytes(f.sizeBytes)} · {f.contentType} · {formatDateTime(f.uploadedAt)}
                </div>
              </div>
              <Space size={4}>
                <Button type="text" icon={<DownloadOutlined />} onClick={() => downloadFile(f)} title="Tải xuống" />
                <Popconfirm title={`Xóa file "${f.fileName}"?`} onConfirm={() => removeFile.mutate(f.id)}
                  okText="Xóa" cancelText="Hủy"
                >
                  <Button type="text" danger icon={<DeleteOutlined />} title="Xóa" />
                </Popconfirm>
              </Space>
            </div>
          ))}
        </Space>
      )}

      <div style={{ marginTop: 16, color: '#9CA3AF', fontSize: 12, textAlign: 'right' }}>
        <ReloadOutlined onClick={() => filesQuery.refetch()} style={{ cursor: 'pointer', marginRight: 4 }} />
        Tổng: {formatBytes(files.reduce((s, f) => s + f.sizeBytes, 0))}
      </div>
    </Drawer>
  );
}
