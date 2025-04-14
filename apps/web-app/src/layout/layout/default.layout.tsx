import AppHeader from '../components/AppBar';
import { Outlet, ScrollRestoration } from 'react-router';

export default function AppLayout() {
  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'linear-gradient(9deg,rgba(2, 0, 36, 1) 0%, rgba(0, 0, 0, 1) 35%, rgba(84, 117, 128, 1) 100%)',
      }}
    >
      <ScrollRestoration />

      <div className="relative">
        <AppHeader />
      </div>

      <Outlet />
    </div>
  );
}
