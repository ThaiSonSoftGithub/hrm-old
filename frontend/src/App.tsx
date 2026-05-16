import { ConfigProvider } from 'antd';
import viVN from 'antd/locale/vi_VN';
import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from '@/shared/auth/AuthContext';
import { queryClient } from '@/app/queryClient';
import { router } from '@/app/router';
import 'dayjs/locale/vi';

export function App() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#5B6CFF',
          colorInfo: '#5B6CFF',
          borderRadius: 8,
          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
          fontSize: 15,
          colorBgLayout: '#F4F6FB',
          colorTextBase: '#1F2937',
          colorBorder: '#E5E7EB',
          colorBorderSecondary: '#F0F2F7',
        },
        components: {
          Layout: {
            headerBg: '#FFFFFF',
            siderBg: '#FFFFFF',
            bodyBg: '#F4F6FB',
          },
          Menu: {
            horizontalItemSelectedColor: '#5B6CFF',
            itemSelectedBg: 'rgba(91, 108, 255, 0.08)',
            itemHoverColor: '#5B6CFF',
          },
          Button: { controlHeight: 36 },
          Table: {
            headerBg: '#F8FAFC',
            headerColor: '#475569',
            rowHoverBg: '#F4F6FB',
            cellPaddingBlock: 12,
          },
          Card: {
            headerBg: '#FFFFFF',
            borderRadiusLG: 12,
          },
          Tabs: {
            itemSelectedColor: '#5B6CFF',
            itemHoverColor: '#5B6CFF',
            inkBarColor: '#5B6CFF',
          },
        },
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <RouterProvider router={router} />
        </AuthProvider>
      </QueryClientProvider>
    </ConfigProvider>
  );
}

export default App;
