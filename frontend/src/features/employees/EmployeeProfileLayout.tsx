import { Alert, Button, Modal, Skeleton, Space, Tag } from 'antd';
import { LeftOutlined, RightOutlined, SettingOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useRef, useState } from 'react';
import { employeeApi } from './api';
import { Tab01General, type TabFormActions } from './Tab01General';
import { Tab02Personal } from './Tab02Personal';
import { Tab03Family } from './Tab03Family';
import { Tab04LaborContract } from './Tab04LaborContract';
import { Tab05BankAccount } from './Tab05BankAccount';
import { Tab06Degree } from './Tab06Degree';
import { Tab07Certificate } from './Tab07Certificate';
import { Tab08WorkExperience } from './Tab08WorkExperience';
import { Tab09WorkHistory } from './Tab09WorkHistory';
import { Tab18Documents } from './Tab18Documents';
import { ApiError } from '@/shared/api/apiError';

interface Props {
  employeeId: string;
  activeTab: string;
  onActiveTabChange: (key: string) => void;
  onCancel?: () => void;
  cancelLabel?: string;
}

const FIRST_TAB = 'tab-01-general';

export function EmployeeProfileLayout({
  employeeId, activeTab, onActiveTabChange,
  onCancel, cancelLabel = 'Hủy',
}: Props) {
  const tabsRef = useRef<HTMLDivElement>(null);
  const [actions, setActions] = useState<TabFormActions | null>(null);

  // Stable callback để không gây re-register liên tục trong useEffect của tab con.
  // Không reset actions khi switch tab — tab cũ unmount sẽ tự gửi state mới qua effect.
  const handleActionsChange = useCallback((a: TabFormActions) => setActions(a), []);

  const tabsQuery = useQuery({
    queryKey: ['employee', employeeId, 'tabs'],
    queryFn: () => employeeApi.tabs(employeeId),
    enabled: !!employeeId,
  });

  const tabs = tabsQuery.data?.tabs ?? [];

  useEffect(() => {
    if (!tabs.length) return;
    if (!tabs.find((t) => t.key === activeTab)) {
      onActiveTabChange(tabsQuery.data?.defaultTabKey ?? FIRST_TAB);
    }
  }, [tabs, activeTab, onActiveTabChange, tabsQuery.data?.defaultTabKey]);

  const scrollTabs = (dir: -1 | 1) => {
    tabsRef.current?.scrollBy({ left: dir * 240, behavior: 'smooth' });
  };

  const confirmIfDirty = (action: () => void) => {
    if (!actions?.dirty) { action(); return; }
    Modal.confirm({
      title: 'Có thay đổi chưa lưu',
      content: 'Các thay đổi trong tab hiện tại sẽ bị mất nếu rời đi. Bạn có muốn tiếp tục?',
      okText: 'Rời đi',
      cancelText: 'Ở lại',
      okButtonProps: { danger: true },
      centered: true,
      onOk: action,
    });
  };

  const tryChangeTab = (key: string) => {
    if (key === activeTab) return;
    confirmIfDirty(() => onActiveTabChange(key));
  };
  const tryCancel = () => onCancel && confirmIfDirty(onCancel);

  if (tabsQuery.isLoading) return <Skeleton active />;
  if (tabsQuery.isError) {
    const err = tabsQuery.error as ApiError;
    return <Alert type="error" showIcon message="Không tải được hồ sơ" description={err?.message ?? ''} />;
  }

  const currentTab = tabs.find((t) => t.key === activeTab);
  const formIdMap: Record<string, string> = {
    'tab-01-general': 'employee-form-tab-1',
    'tab-02-personal': 'employee-form-tab-2',
    'tab-05-bank-account': 'employee-form-tab-5',
  };
  const activeFormId = formIdMap[activeTab];
  // Tab dạng sublist (Tab 03/04, ...) tự xử lý CRUD bên trong → không cần footer Lưu của Layout.
  const isSublistTab = ['tab-03-family', 'tab-04-labor-contract',
    'tab-06-degree', 'tab-07-certificate', 'tab-08-work-experience', 'tab-09-work-history',
    'tab-18-document-list',
  ].includes(activeTab);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Tab nav */}
      <div
        style={{
          display: 'flex', alignItems: 'center',
          borderBottom: '1px solid #F0F2F7', background: '#FAFBFF',
          flexShrink: 0,
        }}
      >
        <Button type="text" icon={<LeftOutlined />} onClick={() => scrollTabs(-1)} />
        <div
          ref={tabsRef}
          style={{ flex: 1, display: 'flex', overflowX: 'auto', scrollBehavior: 'smooth', scrollbarWidth: 'none' }}
        >
          {tabs.map((t, i) => {
            const active = t.key === activeTab;
            const disabled = t.status === 'future';
            return (
              <button
                key={t.key}
                onClick={() => !disabled && tryChangeTab(t.key)}
                disabled={disabled}
                style={{
                  position: 'relative', flexShrink: 0,
                  padding: '12px 16px', border: 'none', background: 'transparent',
                  cursor: disabled ? 'not-allowed' : 'pointer',
                  fontSize: 13.5, fontWeight: active ? 700 : 500,
                  color: disabled ? '#CBD5E1' : active ? '#5B6CFF' : '#475569',
                  whiteSpace: 'nowrap', transition: 'color 120ms',
                }}
                onMouseEnter={(e) => { if (!disabled && !active) e.currentTarget.style.color = '#5B6CFF'; }}
                onMouseLeave={(e) => { if (!disabled && !active) e.currentTarget.style.color = '#475569'; }}
              >
                {i + 1}. {t.label}
                {disabled && <Tag style={{ marginLeft: 6, fontSize: 10, lineHeight: '14px', padding: '0 4px' }}>soon</Tag>}
                {active && (
                  <span
                    style={{
                      position: 'absolute', left: 12, right: 12, bottom: 0,
                      height: 3, background: '#5B6CFF', borderRadius: '3px 3px 0 0',
                    }}
                  />
                )}
              </button>
            );
          })}
        </div>
        <Button type="text" icon={<RightOutlined />} onClick={() => scrollTabs(1)} />
        <Button type="text" icon={<SettingOutlined />} title="Tùy chọn ẩn/hiện tab (sắp có)" disabled />
      </div>

      {/* Body */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16, background: '#fff' }}>
        {activeTab === 'tab-01-general' ? (
          <Tab01General employeeId={employeeId} onActionsChange={handleActionsChange} />
        ) : activeTab === 'tab-02-personal' ? (
          <Tab02Personal employeeId={employeeId} onActionsChange={handleActionsChange} />
        ) : activeTab === 'tab-03-family' ? (
          <Tab03Family employeeId={employeeId} />
        ) : activeTab === 'tab-04-labor-contract' ? (
          <Tab04LaborContract employeeId={employeeId} />
        ) : activeTab === 'tab-05-bank-account' ? (
          <Tab05BankAccount employeeId={employeeId} onActionsChange={handleActionsChange} />
        ) : activeTab === 'tab-06-degree' ? (
          <Tab06Degree employeeId={employeeId} />
        ) : activeTab === 'tab-07-certificate' ? (
          <Tab07Certificate employeeId={employeeId} />
        ) : activeTab === 'tab-08-work-experience' ? (
          <Tab08WorkExperience employeeId={employeeId} />
        ) : activeTab === 'tab-09-work-history' ? (
          <Tab09WorkHistory employeeId={employeeId} />
        ) : activeTab === 'tab-18-document-list' ? (
          <Tab18Documents employeeId={employeeId} />
        ) : (
          <Alert
            type={currentTab?.status === 'future' ? 'info' : 'warning'}
            showIcon
            message={
              currentTab?.status === 'future'
                ? 'Tab này chưa hỗ trợ trong MVP'
                : `Đang dựng nội dung tab "${currentTab?.label ?? ''}"`
            }
            description="Nội dung sẽ được bổ sung ở các sub-phase tiếp theo."
          />
        )}
      </div>

      {/* Footer ghim */}
      <div
        style={{
          flexShrink: 0,
          display: 'flex', justifyContent: 'flex-end',
          padding: '10px 16px',
          borderTop: '1px solid #F0F2F7',
          background: '#FAFBFF',
        }}
      >
        <Space size={8}>
          {onCancel && <Button onClick={tryCancel}>{cancelLabel}</Button>}
          {activeFormId && !isSublistTab && (
            <Button
              type="primary"
              form={activeFormId}
              htmlType="submit"
              loading={actions?.isSaving}
              disabled={!actions?.canSave}
            >
              Lưu thay đổi
            </Button>
          )}
        </Space>
      </div>
    </div>
  );
}
