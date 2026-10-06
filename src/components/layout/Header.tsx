import { useState, useRef, useEffect } from 'react';
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

interface HeaderProps {
  onOpenQuickAdd: () => void;
}

/* ── route → nav key mapping ──────────────────────────── */
const navItems = [
  { key: '/customers', label: 'Customers', icon: Users },
  { key: '/projects', label: 'Projects', icon: Building2 },
  { key: '/wages', label: 'Wages', icon: Calendar },
  { key: '/procurement', label: 'Procurement', icon: ShoppingCart },
  { key: '/settings', label: 'Settings', icon: Settings },
];

function resolveActiveKey(pathname: string) {
  if (pathname.startsWith('/customers')) return '/customers';
  if (pathname.startsWith('/projects') || pathname.startsWith('/sites')) return '/projects';
  if (pathname.startsWith('/wages') || pathname.startsWith('/employees') || pathname.startsWith('/attendance')) return '/wages';
  if (pathname.startsWith('/procurement') || pathname.startsWith('/purchases') || pathname.startsWith('/suppliers')) return '/procurement';
  if (pathname.startsWith('/settings') || pathname.startsWith('/service-types')) return '/settings';
  return '';
}

export function Header({ onOpenQuickAdd }: HeaderProps) {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const activeKey = resolveActiveKey(location.pathname);

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
          {/* ── Brand Mark ──────────────────────────── */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="glass-header-brand"
            aria-label="Go to dashboard"
          >
            <div className="glass-brand-mark">SC</div>
          </button>

          {/* ── Desktop Nav Links ───────────────────── */}
          <nav className="glass-nav" aria-label="Main navigation">
            {navItems.map((item, i) => (
              <button
                key={item.key}
                type="button"
                onClick={() => navigate(item.key)}
                className={`glass-nav-link ${activeKey === item.key ? 'active' : ''}`}
                style={{ transitionDelay: `${i * 40}ms` }}
              >
                <span className="glass-nav-label">{item.label}</span>
                <div className="glass-nav-underline" />
              </button>
            ))}
          </nav>

          {/* ── Right Actions ──────────────────────── */}
          <div className="glass-header-actions">
            {/* Quick Add */}
            <button
              type="button"
              onClick={onOpenQuickAdd}
              className="glass-action-btn glass-quick-add"
              aria-label="Open Quick Add Menu (Hotkey: Q)"
            >
              <Plus className="w-4 h-4" />
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

            {/* User Menu */}
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
                  <div className="px-4 py-2.5 border-b border-[#E2DDD5]/60">
                    <p className="text-xs font-bold text-[#242424]">{userName}</p>
                    <p className="text-[11px] text-[#6B6B6B] truncate">
                      {user?.email || 'staff@shivarivel.com'}
                    </p>
                    <span className="inline-block mt-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#F9F3E5] text-[#8C6514]">
                      {userRole}
                    </span>
                  </div>

                  <div className="pt-1">
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
        </div>
      </div>
    </header>
  );
}
