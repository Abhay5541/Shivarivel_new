import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  CheckSquare,
  PhoneCall,
  Bell,
  Users,
  HelpCircle,
  Compass,
  Calculator,
  Building2,
  ListTodo,
  ClipboardList,
  Truck,
  Package,
  ShoppingCart,
  ReceiptIndianRupee,
  UserCheck,
  Clock4,
  Coins,
  HandCoins,
  Wallet,
  CreditCard,
  Receipt,
  PieChart,
  Calendar,
  BarChart3,
  ShoppingBag,
  Users2,
  FileSpreadsheet,
  Building,
  ShieldCheck,
  Briefcase,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

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
    title: 'MAIN',
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    ],
  },
  {
    title: 'BUSINESS',
    items: [
      { label: 'Customers', href: '/customers', icon: Users },
      { label: 'Enquiries', href: '/enquiries', icon: HelpCircle },
      { label: 'Site Visits', href: '/site-visits', icon: Compass },
      { label: 'Estimates', href: '/estimates', icon: Calculator },
    ],
  },
  {
    title: 'PROJECTS',
    items: [
      { label: 'Projects', href: '/projects', icon: Building2 },
      { label: 'Work Progress', href: '/work-progress', icon: ListTodo },
      { label: 'Daily Reports', href: '/daily-reports', icon: ClipboardList },
    ],
  },
  {
    title: 'PROCUREMENT',
    items: [
      { label: 'Suppliers', href: '/suppliers', icon: Truck },
      { label: 'Materials', href: '/materials', icon: Package },
      { label: 'Purchases', href: '/purchases', icon: ShoppingCart },
      { label: 'Supplier Payments', href: '/supplier-payments', icon: ReceiptIndianRupee },
    ],
  },
  {
    title: 'WORKFORCE',
    items: [
      { label: 'Employees', href: '/employees', icon: UserCheck },
      { label: 'Attendance', href: '/attendance', icon: Clock4 },
      { label: 'Wages', href: '/wages', icon: Coins },
      { label: 'Advances', href: '/advances', icon: HandCoins },
      { label: 'Employee Payments', href: '/employee-payments', icon: Wallet },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'Customer Payments', href: '/customer-payments', icon: CreditCard },
      { label: 'Supplier Payments', href: '/finance/supplier-payments', icon: ReceiptIndianRupee },
      { label: 'Employee Payments', href: '/finance/employee-payments', icon: Wallet },
      { label: 'Expenses', href: '/expenses', icon: Receipt },
      { label: 'Financial Summary', href: '/financial-summary', icon: PieChart },
    ],
  },
  {
    title: 'MY DAY',
    items: [
      { label: 'Today', href: '/today', icon: CalendarCheck },
      { label: 'Tasks', href: '/tasks', icon: CheckSquare },
      { label: 'Follow-ups', href: '/follow-ups', icon: PhoneCall },
      { label: 'Reminders', href: '/reminders', icon: Bell },
    ],
  },
  {
    title: 'REPORTS',
    items: [
      { label: 'Weekly', href: '/reports/weekly', icon: Calendar },
      { label: 'Project', href: '/reports/project', icon: BarChart3 },
      { label: 'Purchase', href: '/reports/purchase', icon: ShoppingBag },
      { label: 'Workforce', href: '/reports/workforce', icon: Users2 },
      { label: 'Payment', href: '/reports/payment', icon: FileSpreadsheet },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'Company Profile', href: '/settings/company', icon: Building, adminOnly: true },
      { label: 'Users & Roles', href: '/settings/users', icon: ShieldCheck, adminOnly: true },
      { label: 'Service Types', href: '/settings/service-types', icon: Briefcase, adminOnly: true },
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
        <div className="w-9 h-9 rounded-lg bg-[#4A0E0E] flex items-center justify-center text-white font-bold text-sm shadow-xs border border-[#C99A2E]/40 tracking-wider">
          SC
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
