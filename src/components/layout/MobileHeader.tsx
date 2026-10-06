import { useLocation } from 'react-router-dom';
import { Bell, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import logoImg from '@/Asserts/shivarivel_svc_logo.png';

export function MobileHeader() {
  const location = useLocation();
  const { signOut } = useAuth();

  const path = location.pathname.replace(/^\//, '');
  const title = path
    ? path
        .split('/')
        .map((segment) =>
          segment
            .split('-')
            .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
            .join(' ')
        )
        .join(' / ')
    : 'Dashboard';

  return (
    <header className="h-14 px-4 bg-white border-b border-[#E2DDD5] flex items-center justify-between shrink-0 lg:hidden sticky top-0 z-30 select-none">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-7 h-7 rounded-md bg-black overflow-hidden flex items-center justify-center shrink-0 border border-[#C99A2E]/40">
          <img src={logoImg} alt="Shivarivel" className="w-full h-full object-cover scale-[1.15]" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-xs font-bold text-[#242424] font-heading truncate">
            {title}
          </span>
          <span className="text-[9px] text-[#6B6B6B] uppercase tracking-wider font-medium truncate">
            Shivarivel ERP
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          aria-label="View notifications"
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F7F5F0] transition-colors relative"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#C99A2E]" />
        </button>

        <button
          type="button"
          aria-label="Log Out"
          onClick={() => signOut()}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B6B6B] hover:text-[#9E2A2B] hover:bg-[#FCEEEE] transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
}
