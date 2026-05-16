import { Select } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { lookupApi } from '../api';

interface Props {
  categoryCode: string;
  value?: string | null;
  onChange?: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  parentId?: string | null;
  refId1?: string | null;
  allowClear?: boolean;
}

export function LookupItemSelect({ categoryCode, value, onChange, placeholder, disabled, parentId, refId1, allowClear = true }: Props) {
  const [keyword, setKeyword] = useState<string>('');
  const { data, isLoading } = useQuery({
    queryKey: ['lookup-items-options', categoryCode, keyword, parentId ?? null, refId1 ?? null],
    queryFn: () =>
      lookupApi.listItems(categoryCode, {
        keyword,
        isActive: true,
        page: 1,
        pageSize: 50,
        parentId: parentId ?? undefined,
        refId1: refId1 ?? undefined,
      }),
    enabled: !!categoryCode,
  });

  return (
    <Select
      showSearch
      filterOption={false}
      onSearch={setKeyword}
      value={value ?? undefined}
      onChange={(v) => onChange?.(v ?? null)}
      placeholder={placeholder ?? 'Chọn ...'}
      loading={isLoading}
      disabled={disabled}
      allowClear={allowClear}
      options={(data?.items ?? []).map((it) => ({ value: it.id, label: `${it.code} - ${it.name}` }))}
      style={{ width: '100%' }}
    />
  );
}
