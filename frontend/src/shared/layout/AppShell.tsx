import { Layout } from 'antd';
import { Outlet } from 'react-router-dom';
import { HeaderBar } from './HeaderBar';
import { TopNav } from './TopNav';

const { Header, Content } = Layout;

export function AppShell() {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header
        style={{
          background: '#fff',
          padding: 0,
          height: 'auto',
          lineHeight: '1.5',
          boxShadow: '0 1px 4px rgba(15, 23, 42, 0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <HeaderBar />
        <TopNav />
      </Header>
      <Content style={{ padding: 16, background: '#F4F6FB', overflow: 'auto' }}>
        <Outlet />
      </Content>
    </Layout>
  );
}
