import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Users,
  Building2,
  ShoppingCart,
  Plus,
  X,
  UserPlus,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileBottomNavProps {
  onOpenQuickAdd?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenQuickAdd }) => {
  const navigate = useNavigate();
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);

  const handleAction = (route: string) => {
    setIsActionSheetOpen(false);
    navigate(route);
  };

  return (
    <>
      {/* Mobile Action Sheet Modal */}
      {isActionSheetOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
            onClick={() => setIsActionSheetOpen(false)}
          />
          <div className="fixed bottom-16 inset-x-0 bg-white rounded-t-2xl border-t border-[#E2DDD5] p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[80vh] overflow-y-auto">
            <div className="w-12 h-1.5 bg-[#E2DDD5] rounded-full mx-auto mb-3" />

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
                    New work location
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
            </div>
          </div>
        </div>
      )}

      {/* Persistent Bottom Bar */}
      <nav
        aria-label="Mobile Navigation"
        className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-[#E2DDD5] h-16 flex items-center justify-around z-30 px-2 select-none shadow-lg"
      >
        {/* 1. Customers */}
        <NavLink
          to="/customers"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] min-w-[56px]',
              isActive ? 'text-[#4A0E0E]' : 'text-[#6B6B6B] hover:text-[#242424]'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Users className={cn('w-5 h-5 mb-0.5', isActive && 'text-[#4A0E0E]')} />
              <span className="text-[10px] font-bold">Customers</span>
            </>
          )}
        </NavLink>

        {/* 2. Projects */}
        <NavLink
          to="/projects"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] min-w-[56px]',
              isActive ? 'text-[#4A0E0E]' : 'text-[#6B6B6B] hover:text-[#242424]'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Building2 className={cn('w-5 h-5 mb-0.5', isActive && 'text-[#4A0E0E]')} />
              <span className="text-[10px] font-bold">Projects</span>
            </>
          )}
        </NavLink>

        {/* 3. Central Add Action Button */}
        <div className="flex justify-center -mt-5">
          <button
            type="button"
            aria-label="Open Quick Add Menu"
            onClick={() => (onOpenQuickAdd ? onOpenQuickAdd() : setIsActionSheetOpen(true))}
            className="w-12 h-12 rounded-full bg-[#C99A2E] text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform cursor-pointer border-3 border-white hover:bg-[#B38722]"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        {/* 4. Wages */}
        <NavLink
          to="/wages"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] min-w-[56px]',
              isActive ? 'text-[#4A0E0E]' : 'text-[#6B6B6B] hover:text-[#242424]'
            )
          }
        >
          {({ isActive }) => (
            <>
              <Calendar className={cn('w-5 h-5 mb-0.5', isActive && 'text-[#4A0E0E]')} />
              <span className="text-[10px] font-bold">Wages</span>
            </>
          )}
        </NavLink>

        {/* 5. Procurement */}
        <NavLink
          to="/procurement"
          className={({ isActive }) =>
            cn(
              'flex flex-col items-center justify-center py-1 transition-colors min-h-[48px] min-w-[56px]',
              isActive ? 'text-[#4A0E0E]' : 'text-[#6B6B6B] hover:text-[#242424]'
            )
          }
        >
          {({ isActive }) => (
            <>
              <ShoppingCart className={cn('w-5 h-5 mb-0.5', isActive && 'text-[#4A0E0E]')} />
              <span className="text-[10px] font-bold">Procurement</span>
            </>
          )}
        </NavLink>
      </nav>
    </>
  );
};
