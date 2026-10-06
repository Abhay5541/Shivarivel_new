import { useState, useRef, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import './Header.css';
import {
  Bell,
  ChevronDown,
  LogOut,
  Plus,
  Users,
  Building2,
  ShoppingCart,
  Calendar,
  Settings,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { MagnifyingDock, type DockItem } from '@/components/ui/MagnifyingDock';
import logoImg from '@/Asserts/shivarivel_svc_logo.png';

interface HeaderProps {
  onOpenQuickAdd: () => void;
}

function resolveActiveKey(pathname: string) {
  if (pathname.startsWith('/customers')) return '/customers';
  if (pathname.startsWith('/projects') || pathname.startsWith('/sites')) return '/projects';
  if (pathname.startsWith('/wages') || pathname.startsWith('/employees') || pathname.startsWith('/attendance')) return '/wages';
  if (pathname.startsWith('/procurement') || pathname.startsWith('/purchases') || pathname.startsWith('/suppliers')) return '/procurement';
  return '';
}

export function Header({ onOpenQuickAdd }: HeaderProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeKey = resolveActiveKey(location.pathname);

  // Desktop Center Nav Items for the Magnifying Dock
  const desktopDockItems: DockItem[] = useMemo(
    () => [
      {
        key: '/customers',
        label: 'Customers',
        Icon: Users,
        onClick: () => navigate('/customers'),
      },
      {
        key: '/projects',
        label: 'Projects',
        Icon: Building2,
        onClick: () => navigate('/projects'),
      },
      {
        key: '/wages',
        label: 'Wages',
        Icon: Calendar,
        onClick: () => navigate('/wages'),
      },
      {
        key: '/procurement',
        label: 'Procurement',
        Icon: ShoppingCart,
        onClick: () => navigate('/procurement'),
      },
    ],
    [navigate]
  );

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

  const userName =
    user?.user_metadata?.full_name ||
    user?.email?.split('@')[0] ||
    'K. Senthil Nathan';
  const userRole = user?.user_metadata?.role || 'Owner';

  return (
    <header className="glass-header-wrapper">
      <div className="glass-header">
        <div className="glass-header-inner">
          {/* ── Brand Mark (Left Zone) ──────────────────────────── */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="glass-header-brand"
            aria-label="Go to dashboard"
          >
            <div className="glass-brand-mark">
              <img
                src={logoImg}
                alt="Shivarivel Official Logo"
                className="w-full h-full object-cover scale-[1.15]"
              />
            </div>
            <div className="hidden sm:flex flex-col text-left leading-none">
              <span className="font-cinzel font-bold text-[13px] tracking-[0.14em] text-[#242424] uppercase">
                SHIVARIVEL
              </span>
              <span className="font-inter text-[8.5px] font-bold tracking-[0.22em] text-[#C9A24A] uppercase mt-0.5">
                Construction &amp; Interiors
              </span>
            </div>
          </button>

          {/* ── Desktop Center Nav: The Magnifying Dock ───── */}
          <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 items-center justify-center pointer-events-auto">
            <MagnifyingDock
              items={desktopDockItems}
              activeKey={activeKey}
              magnify={1.38}
              spread={2}
              lift={6}
              labels={true}
              tipPosition="bottom"
              className="gdock--header"
            />
          </div>

          {/* ── Right Utility Suite (Quick Add, Bell, Profile) ────────────────── */}
          <div className="glass-header-actions">
            {/* Quick Add CTA — shown on PC/desktop only (mobile has bottom center +) */}
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="glass-action-btn glass-quick-add hidden md:inline-flex cursor-pointer"
              aria-label="Open Quick Add Menu (Hotkey: Q)"
            >
              <Plus className="w-4 h-4 text-[#4A0E0E]" />
              <span className="glass-action-label">Quick Add</span>
              <kbd className="glass-kbd">Q</kbd>
            </button>

            {/* Notifications */}
            <button
              type="button"
              aria-label="View notifications"
              className="glass-action-icon"
            >
              <Bell className="w-4 h-4" />
              <span className="glass-notif-dot" />
            </button>

            {/* User Profile Menu with Settings & Log Out */}
            <div className="relative" ref={menuRef}>
              <button
                type="button"
                aria-label="User profile options menu"
                aria-expanded={isUserMenuOpen}
                aria-haspopup="true"
                onClick={() => setIsUserMenuOpen((prev) => !prev)}
                className="glass-user-btn"
              >
                <div className="glass-user-avatar">
                  {userName.charAt(0).toUpperCase()}
                </div>
                <ChevronDown className="w-3 h-3 text-[#6B6B6B] hidden md:block" />
              </button>

              {/* User Dropdown Popover */}
              {isUserMenuOpen && (
                <div
                  role="menu"
                  aria-orientation="vertical"
                  className="glass-user-dropdown"
                >
                  {/* User Profile Details */}
                  <div className="px-4 py-2.5 border-b border-[#E2DDD5]/60">
                    <p className="text-xs font-bold text-[#242424]">{userName}</p>
                    <p className="text-[11px] text-[#6B6B6B] truncate">
                      {user?.email || 'staff@shivarivel.com'}
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F9F3E5] text-[#8C6514]">
                      {userRole}
                    </span>
                  </div>

                  {/* Settings & Master Data */}
                  <div className="py-1 border-b border-[#E2DDD5]/60">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        navigate('/settings');
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#242424] hover:bg-[#F7F5F0] hover:text-[#4A0E0E] transition-colors text-left cursor-pointer font-medium"
                    >
                      <Settings className="w-3.5 h-3.5 text-[#6B6B6B]" />
                      <span>Settings & Master Data</span>
                    </button>
                  </div>

                  {/* Log Out */}
                  <div className="pt-1">
                    <button
                      type="button"
                      role="menuitem"
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        signOut();
                      }}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-[#9E2A2B] hover:bg-[#FCEEEE] transition-colors text-left cursor-pointer font-medium"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Log Out</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
