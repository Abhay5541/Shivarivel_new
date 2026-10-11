import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  UserPlus,
  Building2,
  ShoppingCart,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface QuickAction {
  id: string;
  title: string;
  category: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  route: string;
}

const actions: QuickAction[] = [
  {
    id: 'customer',
    title: 'Add Customer',
    category: 'Customers',
    description: 'Register customer name, phone, and location',
    icon: UserPlus,
    iconBg: 'bg-[#F9F3E5]',
    iconColor: 'text-[#C99A2E]',
    route: '/customers?new=1',
  },
  {
    id: 'project',
    title: 'Add Project',
    category: 'Projects',
    description: 'Register project name, client, and location',
    icon: Building2,
    iconBg: 'bg-[#F7EFEF]',
    iconColor: 'text-[#4A0E0E]',
    route: '/projects?new=1',
  },
  {
    id: 'purchase',
    title: 'Add Purchase',
    category: 'Procurement',
    description: 'Log materials bought for a specific project or general stock',
    icon: ShoppingCart,
    iconBg: 'bg-[#F9F3E5]',
    iconColor: 'text-[#C99A2E]',
    route: '/procurement?new=1',
  },
  {
    id: 'laborer',
    title: 'Add Laborer',
    category: 'Wages',
    description: 'Register laborer name, phone, and auto-generated ID',
    icon: UserCheck,
    iconBg: 'bg-[#F7EFEF]',
    iconColor: 'text-[#4A0E0E]',
    route: '/wages?laborer=1',
  },
  {
    id: 'wage',
    title: 'Add Wage',
    category: 'Wages',
    description: 'Record daily wage entry for laborer on a project',
    icon: Calendar,
    iconBg: 'bg-[#F9F3E5]',
    iconColor: 'text-[#C99A2E]',
    route: '/wages?new=1',
  },
];

export function QuickAddModal({ isOpen, onClose }: QuickAddModalProps) {
  const navigate = useNavigate();

  // Handle escape key to close
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onClose();
      }
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
        className="fixed inset-0 bg-[#242424]/60 backdrop-blur-xs transition-opacity modal-backdrop-spring"
        onClick={onClose}
      />

      {/* Modal / Bottom Sheet Container */}
      <div className="relative w-full lg:max-w-2xl bg-white rounded-t-2xl lg:rounded-2xl shadow-2xl border border-[#E2DDD5] z-10 max-h-[90vh] flex flex-col modal-spring">
        {/* Mobile Drag Indicator */}
        <div className="w-12 h-1.5 bg-[#E2DDD5] rounded-full mx-auto mt-3 mb-1 lg:hidden" />

        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-[#E2DDD5] flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#DFB95E] to-[#C9A24A] text-white flex items-center justify-center font-bold text-sm shadow-[0_2px_8px_rgba(201,162,74,0.35)]">
              +
            </div>
            <div>
              <h2
                id="quick-add-title"
                className="text-base font-bold text-[#242424] font-heading leading-tight"
              >
                Quick Add Actions
              </h2>
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

        {/* Action Grid (Always displays all options directly) */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                type="button"
                onClick={() => handleSelect(action.route)}
                className="flex items-start gap-3.5 p-3.5 rounded-xl border border-[#E2DDD5] bg-white hover:bg-[#F9F3E5]/60 hover:border-[#C99A2E] active:scale-[0.99] transition-all text-left group cursor-pointer shadow-2xs min-h-[68px]"
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
        </div>
      </div>
    </div>
  );
}
