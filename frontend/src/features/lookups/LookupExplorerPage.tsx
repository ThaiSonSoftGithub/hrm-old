import { Empty, Input, Skeleton, Typography } from 'antd';
import {
  ApartmentOutlined, BankOutlined, BookOutlined, BranchesOutlined,
  EnvironmentOutlined, SearchOutlined, SolutionOutlined, UserOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { lookupApi } from './api';
import type { LookupCategoryDto } from './types';
import { LookupListContent } from './LookupListContent';

const groupMeta: Record<string, { label: string; order: number; icon: React.ReactNode; color: string }> = {
  Administrative: { label: 'Hành chính', order: 1, icon: <EnvironmentOutlined />, color: '#5B6CFF' },
  Personal:       { label: 'Cá nhân',     order: 2, icon: <UserOutlined />,        color: '#F59E0B' },
  Education:      { label: 'Đào tạo',     order: 3, icon: <BookOutlined />,        color: '#10B981' },
  Bank:           { label: 'Ngân hàng',   order: 4, icon: <BankOutlined />,        color: '#EC4899' },
  Labor:          { label: 'Lao động',    order: 5, icon: <SolutionOutlined />,    color: '#8B5CF6' },
  Organization:   { label: 'Tổ chức',     order: 6, icon: <ApartmentOutlined />,   color: '#0EA5E9' },
};

const fallbackMeta = { label: '', order: 99, icon: <BranchesOutlined />, color: '#94A3B8' };

export function LookupExplorerPage() {
  const navigate = useNavigate();
  const { categoryCode } = useParams<{ categoryCode: string }>();
  const [keyword, setKeyword] = useState('');

  const categoriesQuery = useQuery({
    queryKey: ['lookup-categories'],
    queryFn: () => lookupApi.listCategories(),
  });

  const grouped = useMemo(() => {
    const cats = (categoriesQuery.data ?? []).filter((c) =>
      !keyword || c.name.toLowerCase().includes(keyword.toLowerCase()) || c.code.toLowerCase().includes(keyword.toLowerCase())
    );
    const map = cats.reduce<Record<string, LookupCategoryDto[]>>((acc, c) => {
      (acc[c.group] ??= []).push(c);
      return acc;
    }, {});
    return Object.keys(map)
      .sort((a, b) => (groupMeta[a]?.order ?? 99) - (groupMeta[b]?.order ?? 99))
      .map((g) => ({
        key: g,
        meta: groupMeta[g] ?? { ...fallbackMeta, label: g },
        items: map[g].slice().sort((a, b) => a.name.localeCompare(b.name, 'vi')),
      }));
  }, [categoriesQuery.data, keyword]);

  const activeCategory = useMemo(
    () => (categoriesQuery.data ?? []).find((c) => c.code === categoryCode),
    [categoriesQuery.data, categoryCode],
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 142px)', minHeight: 0 }}>
      <div style={{ flexShrink: 0, marginBottom: 12 }}>
        <Typography.Title level={4} style={{ margin: 0, textTransform: 'uppercase' }}>
          Danh mục dùng chung
        </Typography.Title>
      </div>
      <div style={{ display: 'flex', gap: 12, flex: 1, minHeight: 0 }}>
        {/* SIDEBAR */}
        <div
          style={{
            width: 300, flexShrink: 0,
            background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
            display: 'flex', flexDirection: 'column', overflow: 'hidden',
          }}
        >
          <div style={{ padding: 12, borderBottom: '1px solid #F0F2F7' }}>
            <Input
              placeholder="Tìm danh mục..."
              allowClear
              prefix={<SearchOutlined style={{ color: '#9CA3AF' }} />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '6px 0' }}>
            {categoriesQuery.isLoading ? (
              <div style={{ padding: 12 }}><Skeleton active paragraph={{ rows: 6 }} /></div>
            ) : grouped.length === 0 ? (
              <Empty description="Không tìm thấy" style={{ marginTop: 24 }} />
            ) : (
              grouped.map(({ key, meta, items }) => (
                <div key={key} style={{ marginBottom: 4 }}>
                  <div
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '8px 14px',
                      fontSize: 11, fontWeight: 700,
                      color: meta.color, textTransform: 'uppercase',
                      letterSpacing: 0.5,
                    }}
                  >
                    <span
                      style={{
                        width: 22, height: 22, borderRadius: 6,
                        background: `${meta.color}1A`,
                        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12,
                      }}
                    >
                      {meta.icon}
                    </span>
                    <span style={{ flex: 1 }}>{meta.label}</span>
                    <span style={{ fontSize: 11, color: '#9CA3AF', fontWeight: 500 }}>{items.length}</span>
                  </div>
                  {items.map((c) => {
                    const active = c.code === categoryCode;
                    return (
                      <button
                        key={c.code}
                        onClick={() => navigate(`/lookups/${c.code}`)}
                        style={{
                          width: '100%', textAlign: 'left',
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8,
                          padding: '7px 14px 7px 44px', border: 'none',
                          background: active ? 'rgba(91, 108, 255, 0.10)' : 'transparent',
                          color: active ? '#5B6CFF' : '#374151',
                          fontWeight: active ? 600 : 500,
                          fontSize: 13.5, cursor: 'pointer',
                          transition: 'background 100ms, color 100ms',
                          borderLeft: active ? '3px solid #5B6CFF' : '3px solid transparent',
                          paddingLeft: active ? 41 : 44,
                        }}
                        onMouseEnter={(e) => {
                          if (!active) e.currentTarget.style.background = '#F4F6FB';
                        }}
                        onMouseLeave={(e) => {
                          if (!active) e.currentTarget.style.background = 'transparent';
                        }}
                      >
                        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </span>
                        <span
                          style={{
                            fontSize: 10,
                            color: active ? '#5B6CFF' : '#94A3B8',
                            fontFamily: "'JetBrains Mono', ui-monospace, monospace",
                          }}
                        >
                          {c.code}
                        </span>
                      </button>
                    );
                  })}
                </div>
              ))
            )}
          </div>
        </div>

        {/* CONTENT */}
        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
          {activeCategory ? (
            <LookupListContent key={activeCategory.code} category={activeCategory} />
          ) : (
            <div
              style={{
                flex: 1,
                background: '#fff', border: '1px solid #E5E7EB', borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description={
                  <span style={{ color: '#9CA3AF' }}>
                    Chọn một danh mục từ menu bên trái để bắt đầu
                  </span>
                }
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
