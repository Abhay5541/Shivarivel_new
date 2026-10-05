import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, ChevronDown, LogOut, Plus } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

interface HeaderProps {
  onOpenQuickAdd: () => void;
}

export function Header({ onOpenQuickAdd }: HeaderProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format contextual title from pathname
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

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'K. Senthil Nathan';
  const userRole = user?.user_metadata?.role || 'Owner';

  return (
    <header className="h-16 px-6 bg-white border-b border-[#E2DDD5] flex items-center justify-between shrink-0 select-none">
      {/* Contextual Title & Breadcrumb */}
      <div className="flex items-center gap-3">
        <h1 className="text-base font-bold text-[#242424] font-heading">
          {title}
        </h1>
        <span className="hidden lg:inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F7F5F0] text-[#6B6B6B] border border-[#E2DDD5]">
          Shivarivel ERP
        </span>
      </div>

      {/* Action Toolbar */}
      <div className="flex items-center gap-3">
        {/* Quick Add Top Button */}
        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenQuickAdd}
          aria-label="Open Quick Add Menu (Hotkey: Q)"
          className="border-[#C99A2E]/50 text-[#4A0E0E] hover:bg-[#F9F3E5] gap-1.5 shadow-xs"
        >
          <Plus className="w-3.5 h-3.5 text-[#C99A2E]" />
          <span>Quick Add</span>
          <kbd className="hidden sm:inline-block ml-1 px-1 py-0.2 bg-[#F7F5F0] border border-[#E2DDD5] rounded text-[10px] text-[#6B6B6B]">
            Q
          </kbd>
        </Button>

        {/* Notifications Placeholder */}
        <button
          type="button"
          aria-label="View notifications"
          className="w-9 h-9 rounded-lg border border-[#E2DDD5] flex items-center justify-center text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F7F5F0] transition-colors relative cursor-pointer"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-[#C99A2E]" />
        </button>

        {/* User Profile Menu */}
        <div className="relative" ref={menuRef}>
          <button
            type="button"
            aria-label="User profile options menu"
            aria-expanded={isUserMenuOpen}
            aria-haspopup="true"
            onClick={() => setIsUserMenuOpen((prev) => !prev)}
            className="flex items-center gap-2.5 p-1 pl-2 rounded-lg border border-[#E2DDD5] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full bg-[#4A0E0E] text-white flex items-center justify-center text-xs font-bold">
              {userName.charAt(0).toUpperCase()}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#242424] leading-tight truncate max-w-[120px]">
                {userName}
              </span>
              <span className="text-[10px] text-[#6B6B6B] leading-tight font-medium">
                {userRole}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
          </button>

          {/* User Dropdown Popover */}
          {isUserMenuOpen && (
            <div
              role="menu"
              aria-orientation="vertical"
              className="absolute right-0 mt-2 w-56 bg-white border border-[#E2DDD5] rounded-xl shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
            >
              <div className="px-4 py-2 border-b border-[#E2DDD5]/60">
                <p className="text-xs font-bold text-[#242424]">{userName}</p>
                <p className="text-[11px] text-[#6B6B6B] truncate">
                  {user?.email || 'staff@shivarivel.com'}
                </p>
                <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F9F3E5] text-[#8C6514]">
                  {userRole}
                </span>
              </div>

              <div className="border-t border-[#E2DDD5]/60 pt-1">
                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    signOut();
                  }}
                  className="w-full flex items-center gap-2 px-4 py-2 text-xs text-[#9E2A2B] hover:bg-[#FCEEEE] transition-colors text-left cursor-pointer font-medium"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
