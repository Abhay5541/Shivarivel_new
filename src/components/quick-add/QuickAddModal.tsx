import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  UserPlus,
  HelpCircle,
  Compass,
  Calculator,
  Building2,
  ShoppingCart,
  ArrowDownLeft,
  ArrowUpRight,
  Banknote,
  CalendarCheck2,
  Receipt,
  CheckSquare,
  ClipboardList,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type ActionCategory = 'All' | 'Commercial' | 'Projects' | 'Procurement' | 'Finance & Labor';

interface QuickAction {
  id: string;
  title: string;
  category: 'Commercial' | 'Projects' | 'Procurement' | 'Finance & Labor';
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  route: string;
}

const actions: QuickAction[] = [
  // Commercial
  {
    id: 'customer',
    title: 'New Customer',
    category: 'Commercial',
    description: 'Register client profile, site location, phone, and billing details',
    icon: UserPlus,
    iconBg: 'bg-[#F9F3E5]',
    iconColor: 'text-[#C99A2E]',
    route: '/customers?new=1',
  },
  {
    id: 'enquiry',
    title: 'New Enquiry',
    category: 'Commercial',
    description: 'Capture prospective lead requirement (Planning, 3D Elevation, Civil)',
    icon: HelpCircle,
    iconBg: 'bg-[#F7F5F0]',
    iconColor: 'text-[#4A0E0E]',
    route: '/enquiries?new=1',
  },
  {
    id: 'site-visit',
    title: 'Site Visit',
    category: 'Commercial',
    description: 'Schedule plot inspection, topographical survey, or client consultation',
    icon: Compass,
    iconBg: 'bg-[#F7F5F0]',
    iconColor: 'text-[#4A0E0E]',
    route: '/site-visits?new=1',
  },
  {
    id: 'estimate',
    title: 'New Estimate',
    category: 'Commercial',
    description: 'Draft itemized bill of quantities (BOQ) valuation for client approval',
    icon: Calculator,
    iconBg: 'bg-[#F9F3E5]',
    iconColor: 'text-[#C99A2E]',
    route: '/estimates/new',
  },

  // Projects & Execution
  {
    id: 'project',
    title: 'New Project',
    category: 'Projects',
    description: 'Initialize active construction site with contract value and stage targets',
    icon: Building2,
    iconBg: 'bg-[#F7EFEF]',
    iconColor: 'text-[#4A0E0E]',
    route: '/projects/new',
  },
  {
    id: 'task',
    title: 'Add Task',
    category: 'Projects',
    description: 'Create site inspection, client follow-up, or material check reminder',
    icon: CheckSquare,
    iconBg: 'bg-[#F9F3E5]',
    iconColor: 'text-[#C99A2E]',
    route: '/tasks',
  },
  {
    id: 'daily-report',
    title: 'Add Daily Site Report',
    category: 'Projects',
    description: 'Submit evening site log: weather conditions, work done, and photos',
    icon: ClipboardList,
    iconBg: 'bg-[#F9F3E5]',
    iconColor: 'text-[#C99A2E]',
    route: '/daily-reports',
  },

  // Procurement
  {
    id: 'purchase',
    title: 'Add Purchase',
    category: 'Procurement',
    description: 'Log vendor delivery: cement, TMT steel, M-sand, with delivery challan',
    icon: ShoppingCart,
    iconBg: 'bg-[#F9F3E5]',
    iconColor: 'text-[#C99A2E]',
    route: '/purchases/new',
  },
  {
    id: 'expense',
    title: 'Add Expense',
    category: 'Procurement',
    description: 'Record direct site petty cash, equipment hire, machinery, or fuel',
    icon: Receipt,
    iconBg: 'bg-[#F7EFEF]',
    iconColor: 'text-[#4A0E0E]',
    route: '/expenses/new',
  },

  // Finance & Labor (Strict Rule 18 Non-Netting)
  {
    id: 'customer-payment',
    title: 'Record Customer Payment',
    category: 'Finance & Labor',
    description: 'Record client milestone receipt voucher against project contract',
    icon: ArrowDownLeft,
    iconBg: 'bg-[#EAF5EE]',
    iconColor: 'text-[#1E6B37]',
    route: '/customer-payments/new',
  },
  {
    id: 'supplier-payment',
    title: 'Record Supplier Payment',
    category: 'Finance & Labor',
    description: 'Disburse payment against pending material purchase bills',
    icon: ArrowUpRight,
    iconBg: 'bg-[#EFECE6]',
    iconColor: 'text-[#242424]',
    route: '/supplier-payments/new',
  },
  {
    id: 'employee-payment',
    title: 'Record Employee Payment',
    category: 'Finance & Labor',
    description: 'Disburse verified wage payout settlement or recover advance loan',
    icon: Banknote,
    iconBg: 'bg-[#F7EFEF]',
    iconColor: 'text-[#4A0E0E]',
    route: '/employee-payments/new',
  },
  {
    id: 'attendance',
    title: 'Mark Attendance',
    category: 'Finance & Labor',
    description: 'Open Fast Field Muster for 15-second multi-worker shift logging',
    icon: CalendarCheck2,
    iconBg: 'bg-[#EAF5EE]',
    iconColor: 'text-[#1E6B37]',
    route: '/attendance',
  },
];

const categoryTabs: ActionCategory[] = [
  'All',
  'Commercial',
  'Projects',
  'Procurement',
  'Finance & Labor',
];

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ActionCategory>('All');

  // Handle escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const filteredActions = useMemo(() => {
    return actions.filter((act) => {
      const matchesSearch =
        act.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        act.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat =
        selectedCategory === 'All' || act.category === selectedCategory;
      return matchesSearch && matchesCat;
    });
  }, [searchTerm, selectedCategory]);

  if (!isOpen) return null;

  const handleSelect = (route: string) => {
    onClose();
    navigate(route);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-add-title"
      className="fixed inset-0 z-50 flex items-end lg:items-center justify-center select-none"
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[#242424]/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet Container */}
      <div className="relative w-full lg:max-w-3xl bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl border border-[#E2DDD5] z-10 max-h-[90vh] flex flex-col animate-in slide-in-from-bottom lg:zoom-in-95 duration-200">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-[#E2DDD5] rounded-full mx-auto mt-3 mb-1 lg:hidden" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2DDD5] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#C99A2E] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              +
            </div>
            <div>
              <h2
                id="quick-add-title"
                className="text-base font-bold text-[#242424] font-heading leading-tight"
              >
                Quick Add Actions
              </h2>
              <p className="text-[11px] text-[#6B6B6B] leading-tight">
                Create new record in under 30 seconds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden sm:inline-block text-[11px] text-[#6B6B6B]">
              Press <kbd className="px-1.5 py-0.5 bg-[#F7F5F0] border border-[#E2DDD5] rounded text-[10px]">Esc</kbd> to close
            </span>
            <button
              type="button"
              aria-label="Close Quick Add"
              onClick={onClose}
              className="w-8 h-8 rounded-lg border border-[#E2DDD5] flex items-center justify-center text-[#6B6B6B] hover:text-[#242424] hover:bg-[#F7F5F0] transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Search & Category Filter Rail */}
        <div className="px-6 py-3 border-b border-[#E2DDD5]/60 bg-[#F7F5F0]/40 space-y-2.5">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#6B6B6B]" />
            <input
              type="text"
              placeholder="Search actions (e.g. 'Customer', 'Purchase', 'Attendance', 'Payment')..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-9 pl-9 pr-4 text-xs bg-white border border-[#E2DDD5] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C99A2E] text-[#242424] placeholder:text-[#6B6B6B]/60"
              autoFocus
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
            {categoryTabs.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors shrink-0 cursor-pointer',
                  selectedCategory === cat
                    ? 'bg-[#4A0E0E] text-white'
                    : 'bg-white text-[#6B6B6B] border border-[#E2DDD5] hover:bg-[#F7F5F0] hover:text-[#242424]'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Action Grid (Thumb-Friendly Touch Targets) */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {filteredActions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleSelect(action.route)}
                className="flex items-start gap-3.5 p-3 rounded-xl border border-[#E2DDD5] bg-white hover:bg-[#F9F3E5]/60 hover:border-[#C99A2E] active:scale-[0.99] transition-all text-left group cursor-pointer shadow-2xs min-h-[64px]"
              >
                <div
                  className={cn(
                    'w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-transform group-hover:scale-105',
                    action.iconBg,
                    action.iconColor
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-1">
                    <span className="text-xs font-bold text-[#242424] group-hover:text-[#4A0E0E] transition-colors">
                      {action.title}
                    </span>
                    <span className="text-[10px] uppercase font-semibold tracking-wider text-[#6B6B6B] shrink-0">
                      {action.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#6B6B6B] line-clamp-2 mt-0.5 leading-snug">
                    {action.description}
                  </p>
                </div>
              </button>
            );
          })}

          {filteredActions.length === 0 && (
            <div className="col-span-1 sm:col-span-2 py-8 text-center text-xs text-[#6B6B6B]">
              No actions found matching "{searchTerm}"
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
