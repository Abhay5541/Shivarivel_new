import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Users,
  Building2,
  Truck,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import logoImg from '@/Asserts/shivarivel_svc_logo.png';

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'MENU',
    items: [
      { label: 'Customers', href: '/customers', icon: Users },
      { label: 'Projects', href: '/projects', icon: Building2 },
      { label: 'Wages', href: '/wages', icon: Calendar },
      { label: 'Procurement', href: '/procurement', icon: Truck },
    ],
  },
];

export function Sidebar({ className }: { className?: string }) {
  const { user } = useAuth();
  const userRole = user?.user_metadata?.role || 'Owner';
  const isSupervisor = userRole.toLowerCase().includes('supervisor');

  return (
    <aside
      className={cn(
        'w-[250px] shrink-0 bg-white border-r border-[#E2DDD5] flex flex-col h-screen select-none',
        className
      )}
    >
      {/* Brand Header */}
      <div className="h-16 px-5 border-b border-[#E2DDD5] flex items-center gap-3 shrink-0 bg-white">
        <div className="w-9 h-9 rounded-lg bg-black overflow-hidden flex items-center justify-center shadow-xs border border-[#C99A2E]/40 shrink-0">
          <img src={logoImg} alt="Shivarivel" className="w-full h-full object-cover scale-[1.15]" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-bold tracking-tight text-[#242424] font-heading truncate">
            SHIVARIVEL
          </span>
          <span className="text-[10px] uppercase tracking-wider text-[#6B6B6B] font-medium truncate">
            Construction &amp; Interiors
          </span>
        </div>
      </div>

      {/* Navigation Links Scroll Container */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
        {navSections.map((section) => {
          // If supervisor, optionally hide admin-only sections if all items are adminOnly
          const visibleItems = isSupervisor
            ? section.items.filter((item) => !item.adminOnly)
            : section.items;

          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] font-bold tracking-wider text-[#6B6B6B] uppercase font-heading">
                {section.title}
              </div>
              <div className="space-y-0.5 pt-0.5">
                {visibleItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.href}
                      to={item.href}
                      className={({ isActive }) =>
                        cn(
                          'flex items-center gap-2.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-colors group relative',
                          isActive
                            ? 'bg-[#F9F3E5] text-[#4A0E0E] font-semibold'
                            : 'text-[#242424] hover:bg-[#F7F5F0] hover:text-[#4A0E0E]'
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <Icon
                            className={cn(
                              'w-4 h-4 shrink-0 transition-colors',
                              isActive
                                ? 'text-[#C99A2E]'
                                : 'text-[#6B6B6B] group-hover:text-[#4A0E0E]'
                            )}
                          />
                          <span className="truncate">{item.label}</span>
                          {isActive && (
                            <span className="absolute left-0 top-1 bottom-1 w-1 bg-[#C99A2E] rounded-r-full" />
                          )}
                        </>
                      )}
                    </NavLink>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* System Status Footer */}
      <div className="p-3 border-t border-[#E2DDD5] bg-[#F7F5F0]/50 shrink-0 text-[11px] text-[#6B6B6B] flex items-center justify-between">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[#1E6B37]" />
          <span className="font-medium">System Online</span>
        </span>
        <span className="font-mono text-[10px] text-[#6B6B6B]/80 font-semibold">
          {isSupervisor ? 'Supervisor' : 'Owner/Admin'}
        </span>
      </div>
    </aside>
  );
}
