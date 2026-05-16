import { Alert, Card, Col, Form, Input, Row, Select, Skeleton, message } from 'antd';
import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { employeeApi } from './api';
import type { BankAccountInput } from './types';
import type { TabFormActions } from './Tab01General';
import { lookupApi } from '@/features/lookups/api';
import { ApiError } from '@/shared/api/apiError';

interface Props {
  employeeId: string;
  onActionsChange?: (a: TabFormActions) => void;
}

export function Tab05BankAccount({ employeeId, onActionsChange }: Props) {
  const [form] = Form.useForm();
  const qc = useQueryClient();
  const [dirty, setDirty] = useState(false);
  const [bankId, setBankId] = useState<string | undefined>();

  const account = useQuery({
    queryKey: ['employee', employeeId, 'bank-account'],
    queryFn: () => employeeApi.getBankAccount(employeeId),
  });

  const banks = useQuery({
    queryKey: ['lookup-options', 'Bank'],
    queryFn: () => lookupApi.listItems('Bank', { page: 1, pageSize: 200 }),
  });
  const branches = useQuery({
    queryKey: ['lookup-options', 'BankBranch', bankId],
    queryFn: () => lookupApi.listItems('BankBranch', { page: 1, pageSize: 500, parentId: bankId }),
    enabled: !!bankId,
  });

  useEffect(() => {
    if (!account.data) return;
    const a = account.data;
    setBankId(a.bankId ?? undefined);
    form.setFieldsValue({
      accountNumber: a.accountNumber,
      accountHolderName: a.accountHolderName,
      bankId: a.bankId,
      bankBranchId: a.bankBranchId,
      note: a.note,
    });
    setDirty(false);
  }, [account.data, form]);

  const save = useMutation({
    mutationFn: (v: any) => {
      const body: BankAccountInput = {
        accountNumber: v.accountNumber ?? null,
        accountHolderName: v.accountHolderName ?? null,
        bankId: v.bankId ?? null,
        bankBranchId: v.bankBranchId ?? null,
        note: v.note ?? null,
      };
      return employeeApi.updateBankAccount(employeeId, body);
    },
    onSuccess: () => {
      message.success('Đã lưu thông tin tài khoản');
      setDirty(false);
      qc.invalidateQueries({ queryKey: ['employee', employeeId, 'bank-account'] });
    },
    onError: (e) => message.error((e as ApiError)?.message ?? 'Không lưu được'),
  });

  useEffect(() => {
    onActionsChange?.({
      canSave: !!account.data && !save.isPending && dirty,
      isSaving: save.isPending,
      dirty,
      submit: () => form.submit(),
    });
  }, [account.data, save.isPending, form, onActionsChange, dirty]);

  if (account.isLoading) return <Skeleton active />;
  if (account.isError) {
    const err = account.error as ApiError;
    return <Alert type="error" showIcon message="Không tải được tab Tài khoản ngân hàng" description={err?.message ?? ''} />;
  }

  const bankOpts = (banks.data?.items ?? []).map((b) => ({ value: b.id, label: `${b.code} - ${b.name}` }));
  const branchOpts = (branches.data?.items ?? []).map((b) => ({ value: b.id, label: b.name }));

  return (
    <Form form={form} name="employee-form-tab-5" layout="vertical"
      onValuesChange={(changed) => {
        setDirty(true);
        if (Object.prototype.hasOwnProperty.call(changed, 'bankId')) {
          setBankId(changed.bankId ?? undefined);
          form.setFieldValue('bankBranchId', undefined);
        }
      }}
      onFinish={(v) => save.mutate(v)}
    >
      <Card size="small" title="Thông tin tài khoản ngân hàng">
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Số tài khoản" name="accountNumber">
              <Input maxLength={64} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Chủ tài khoản" name="accountHolderName">
              <Input maxLength={128} />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Ngân hàng" name="bankId">
              <Select allowClear showSearch optionFilterProp="label"
                options={bankOpts} loading={banks.isLoading} placeholder="Chọn ngân hàng" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item label="Chi nhánh ngân hàng" name="bankBranchId"
              help={!bankId ? 'Chọn ngân hàng trước' : undefined}
            >
              <Select allowClear showSearch optionFilterProp="label" disabled={!bankId}
                options={branchOpts} loading={branches.isLoading}
                placeholder={bankId ? 'Chọn chi nhánh' : '—'}
                notFoundContent={branches.data?.items.length === 0 ? 'Ngân hàng chưa có chi nhánh' : undefined}
              />
            </Form.Item>
          </Col>
          <Col span={24}>
            <Form.Item label="Ghi chú" name="note">
              <Input.TextArea rows={3} maxLength={2000} />
            </Form.Item>
          </Col>
        </Row>
      </Card>
    </Form>
  );
}
