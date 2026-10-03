import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  CalendarCheck,
  Building2,
  Plus,
  Coins,
  Menu,
  X,
  Users,
  HelpCircle,
  Compass,
  Calculator,
  ListTodo,
  ClipboardList,
  Truck,
  Package,
  ShoppingCart,
  UserCheck,
  Clock4,
  FileBarChart,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  onOpenQuickAdd: () => void;
}

export function MobileBottomNav({ onOpenQuickAdd }: MobileBottomNavProps) {
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const moreSections = [
    {
      title: 'Business & CRM',
      items: [
        { label: 'Customers', href: '/customers', icon: Users },
        { label: 'Enquiries', href: '/enquiries', icon: HelpCircle },
        { label: 'Site Visits', href: '/site-visits', icon: Compass },
        { label: 'Estimates', href: '/estimates', icon: Calculator },
      ],
    },
    {
      title: 'Field & Operations',
      items: [
        { label: 'Work Progress', href: '/work-progress', icon: ListTodo },
        { label: 'Daily Reports', href: '/daily-reports', icon: ClipboardList },
        { label: 'Attendance', href: '/attendance', icon: Clock4 },
      ],
    },
    {
      title: 'Procurement & Labor',
      items: [
        { label: 'Suppliers', href: '/suppliers', icon: Truck },
        { label: 'Materials', href: '/materials', icon: Package },
        { label: 'Purchases', href: '/purchases', icon: ShoppingCart },
        { label: 'Employees', href: '/employees', icon: UserCheck },
      ],
    },
    {
      title: 'Administration',
      items: [
        { label: 'Reports', href: '/reports/weekly', icon: FileBarChart },
        { label: 'Settings', href: '/company-profile', icon: Settings },
      ],
    },
  ];

  return (
    <>
      {/* "More" Sheet Modal on Mobile */}
      {isMoreMenuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity"
            onClick={() => setIsMoreMenuOpen(false)}
          />
          <div className="fixed bottom-16 inset-x-0 bg-white rounded-t-2xl border-t border-[#E2DDD5] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[75vh] overflow-y-auto">
            {/* Grab Bar */}
            <div className="w-12 h-1.5 bg-[#E2DDD5] rounded-full mx-auto mb-3" />

            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2DDD5]/60">
              <div>
                <span className="text-sm font-bold text-[#242424] font-heading">
                  All ERP Modules
                </span>
                <p className="text-[11px] text-[#6B6B6B]">
                  Direct navigation to all departments
                </p>
              </div>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsMoreMenuOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F7F5F0] border border-[#E2DDD5] flex items-center justify-center text-[#6B6B6B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {moreSections.map((sec) => (
                <div key={sec.title} className="space-y-2">
                  <span className="text-[10px] font-bold text-[#6B6B6B] uppercase tracking-wider font-heading">
                    {sec.title}
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {sec.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.href}
                          to={item.href}
                          onClick={() => setIsMoreMenuOpen(false)}
                          className="flex items-center gap-2.5 p-2.5 rounded-xl border border-[#E2DDD5] hover:bg-[#F7F5F0] active:bg-[#F9F3E5] transition-colors"
                        >
                          <div className="w-8 h-8 rounded-lg bg-[#F7F5F0] flex items-center justify-center text-[#4A0E0E] shrink-0">
                            <Icon className="w-4 h-4" />
                          </div>
                          <span className="text-xs font-semibold text-[#242424] truncate">
                            {item.label}
                          </span>
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Primary Fixed Bottom Navigation (360px+ Mobile Viewport) */}
      <nav
        aria-label="Mobile Bottom Navigation"
        className="fixed bottom-0 inset-x-0 z-30 h-16 bg-white border-t border-[#E2DDD5] flex items-center justify-around px-1 lg:hidden select-none shadow-lg"
        style={{ paddingBottom: 'var(--safe-bottom, 0px)' }}
      >
        {/* Today */}
        <NavLink
          to="/today"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[48px]',
              isActive ? 'text-[#4A0E0E]' : 'text-[#6B6B6B] hover:text-[#242424]'
            )
          }
        >
          {({ isActive }) => (
            <>
              <CalendarCheck
                className={cn('w-5 h-5 mb-0.5', isActive && 'text-[#C99A2E]')}
              />
              <span className="text-[10px] font-semibold">Today</span>
            </>
          )}
        </NavLink>

        {/* Projects */}
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[48px]',
              isActive ? 'text-[#4A0E0E]' : 'text-[#6B6B6B] hover:text-[#242424]'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Building2
                className={cn('w-5 h-5 mb-0.5', isActive && 'text-[#C99A2E]')}
              />
              <span className="text-[10px] font-semibold">Projects</span>
            </>
          )}
        </NavLink>

        {/* Central Quick Add Action FAB Button */}
        <div className="flex-1 flex justify-center -mt-5">
          <button
            type="button"
            aria-label="Open Quick Add Menu"
            onClick={onOpenQuickAdd}
            className="w-13 h-13 rounded-full bg-[#C99A2E] text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform cursor-pointer border-3 border-white hover:bg-[#B38722]"
          >
            <Plus className="w-7 h-7" />
          </button>
        </div>

        {/* Money / Finance */}
        <NavLink
          to="/financial-summary"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center flex-1 py-1 transition-colors min-h-[48px]',
              isActive ? 'text-[#4A0E0E]' : 'text-[#6B6B6B] hover:text-[#242424]'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Coins
                className={cn('w-5 h-5 mb-0.5', isActive && 'text-[#C99A2E]')}
              />
              <span className="text-[10px] font-semibold">Money</span>
            </>
          )}
        </NavLink>

        {/* More */}
        <button
          type="button"
          aria-label="More navigation options"
          onClick={() => setIsMoreMenuOpen((prev) => !prev)}
          className={cn(
            'flex flex-col items-center justify-center flex-1 py-1 transition-colors cursor-pointer min-h-[48px]',
            isMoreMenuOpen ? 'text-[#4A0E0E]' : 'text-[#6B6B6B] hover:text-[#242424]'
          )}
        >
          <Menu className="w-5 h-5 mb-0.5" />
          <span className="text-[10px] font-semibold">More</span>
        </button>
      </nav>
    </>
  );
}
