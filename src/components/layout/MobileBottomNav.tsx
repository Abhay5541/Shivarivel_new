import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Building2,
  ShoppingCart,
  Plus,
  X,
  UserPlus,
  UserCheck,
  Calendar,
  LayoutDashboard,
} from 'lucide-react';
import { MagnifyingDock, type DockItem } from '@/components/ui/MagnifyingDock';

interface MobileBottomNavProps {
  onOpenQuickAdd?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenQuickAdd }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const handleAction = (route: string) => {
    setIsActionSheetOpen(false);
    navigate(route);
  };

  const activeKey =
    location.pathname.startsWith('/customers')
      ? '/customers'
      : location.pathname.startsWith('/projects')
      ? '/projects'
      : location.pathname.startsWith('/wages')
      ? '/wages'
      : location.pathname.startsWith('/procurement') || location.pathname.startsWith('/purchases') || location.pathname.startsWith('/suppliers')
      ? '/procurement'
      : '';

  const dockItems: DockItem[] = [
    {
      key: '/customers',
      label: 'Clients',
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
      key: 'quick-add',
      label: 'Add',
      Icon: Plus,
      isAction: true,
      onClick: () => (onOpenQuickAdd ? onOpenQuickAdd() : setIsActionSheetOpen(true)),
    },
    {
      key: '/wages',
      label: 'Wages',
      Icon: Calendar,
      onClick: () => navigate('/wages'),
    },
    {
      key: '/procurement',
      label: 'Purchases',
      Icon: ShoppingCart,
      onClick: () => navigate('/procurement'),
    },
  ];

  return (
    <>
      {/* Action Sheet Modal (PC & Mobile) */}
      {isActionSheetOpen && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity modal-backdrop-spring"
            onClick={() => setIsActionSheetOpen(false)}
          />
          <div className="fixed bottom-16 inset-x-0 sm:bottom-20 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl border border-[#E2DDD5] p-5 shadow-2xl modal-spring max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-[#E2DDD5] rounded-full mx-auto mb-3 sm:hidden" />

            <div className="flex items-center justify-between pb-3 mb-4 border-b border-[#E2DDD5]/60">
              <span className="text-sm font-bold text-[#242424] font-heading">
                Quick Action
              </span>
              <button
                type="button"
                aria-label="Close menu"
                onClick={() => setIsActionSheetOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F7F5F0] border border-[#E2DDD5] flex items-center justify-center text-[#6B6B6B]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pb-2">
              {/* Add Customer */}
              <button
                type="button"
                onClick={() => handleAction('/customers?new=1')}
                className="p-3.5 rounded-xl border border-[#E2DDD5] bg-[#F7F5F0]/60 hover:bg-[#F7F5F0] text-left flex flex-col gap-2 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#4A0E0E] text-white flex items-center justify-center shadow-xs">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#242424] block">
                    Add Customer
                  </span>
                  <span className="text-[10px] text-[#6B6B6B]">
                    Register client
                  </span>
                </div>
              </button>

              {/* Add Project */}
              <button
                type="button"
                onClick={() => handleAction('/projects?new=1')}
                className="p-3.5 rounded-xl border border-[#E2DDD5] bg-[#F7F5F0]/60 hover:bg-[#F7F5F0] text-left flex flex-col gap-2 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#C99A2E] text-white flex items-center justify-center shadow-xs">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#242424] block">
                    Add Project
                  </span>
                  <span className="text-[10px] text-[#6B6B6B]">
                    New project
                  </span>
                </div>
              </button>

              {/* Add Purchase */}
              <button
                type="button"
                onClick={() => handleAction('/procurement?new=1')}
                className="p-3.5 rounded-xl border border-[#E2DDD5] bg-[#F7F5F0]/60 hover:bg-[#F7F5F0] text-left flex flex-col gap-2 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#4A0E0E] text-white flex items-center justify-center shadow-xs">
                  <ShoppingCart className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#242424] block">
                    Add Purchase
                  </span>
                  <span className="text-[10px] text-[#6B6B6B]">
                    Materials bought
                  </span>
                </div>
              </button>

              {/* Add Laborer */}
              <button
                type="button"
                onClick={() => handleAction('/wages?laborer=1')}
                className="p-3.5 rounded-xl border border-[#E2DDD5] bg-[#F7F5F0]/60 hover:bg-[#F7F5F0] text-left flex flex-col gap-2 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#4A0E0E] text-white flex items-center justify-center shadow-xs">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#242424] block">
                    Add Laborer
                  </span>
                  <span className="text-[10px] text-[#6B6B6B]">
                    Register worker
                  </span>
                </div>
              </button>

              {/* Add Wage */}
              <button
                type="button"
                onClick={() => handleAction('/wages?new=1')}
                className="p-3.5 rounded-xl border border-[#E2DDD5] bg-[#F7F5F0]/60 hover:bg-[#F7F5F0] text-left flex flex-col gap-2 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#C99A2E] text-white flex items-center justify-center shadow-xs">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#242424] block">
                    Add Wage
                  </span>
                  <span className="text-[10px] text-[#6B6B6B]">
                    Record site labor
                  </span>
                </div>
              </button>

              {/* View Dashboard */}
              <button
                type="button"
                onClick={() => handleAction('/dashboard')}
                className="p-3.5 rounded-xl border border-[#E2DDD5] bg-[#F7F5F0]/60 hover:bg-[#F7F5F0] text-left flex flex-col gap-2 cursor-pointer"
              >
                <div className="w-9 h-9 rounded-lg bg-[#242424] text-white flex items-center justify-center shadow-xs">
                  <LayoutDashboard className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs font-bold text-[#242424] block">
                    Dashboard
                  </span>
                  <span className="text-[10px] text-[#6B6B6B]">
                    Executive overview
                  </span>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Persistent Glass Magnifying Dock Bar (Mobile & Tablet only) */}
      <div className="fixed bottom-3 inset-x-0 z-30 flex justify-center px-4 pointer-events-none select-none md:hidden">
        <div className="pointer-events-auto">
          <MagnifyingDock
            items={dockItems}
            activeKey={activeKey}
            magnify={1.35}
            spread={2}
            lift={10}
            labels={true}
          />
        </div>
      </div>
    </>
  );
};
