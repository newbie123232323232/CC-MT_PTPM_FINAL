import { Outlet } from 'react-router-dom';
import MobileBottomNav from '../components/MobileBottomNav';

export default function AppShellLayout() {
  return (
    <div className='app-shell'>
      <Outlet />
      <MobileBottomNav />
    </div>
  );
}
