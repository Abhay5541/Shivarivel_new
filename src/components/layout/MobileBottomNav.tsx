import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Building2,
  ShoppingCart,
  Calendar,
  Plus,
} from 'lucide-react';

interface MobileBottomNavProps {
  onOpenQuickAdd?: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({ onOpenQuickAdd }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateTab = (route: string) => {
    if (location.pathname === '/' || location.pathname === '/dashboard') {
      navigate(route);
    } else {
      navigate(route, { replace: true });
    }
  };

  const isCustomers = location.pathname.startsWith('/customers');
  const isProjects = location.pathname.startsWith('/projects');
  const isWages = location.pathname.startsWith('/wages') || location.pathname.startsWith('/employees');
  const isProcurement =
    location.pathname.startsWith('/procurement') ||
    location.pathname.startsWith('/purchases') ||
    location.pathname.startsWith('/suppliers');

  return (
    <nav
      aria-label="Mobile Navigation"
      className="fixed bottom-0 inset-x-0 z-30 flex justify-center px-4 pb-[max(10px,env(safe-area-inset-bottom,0px))] pointer-events-none select-none md:hidden"
    >
      <div className="w-full max-w-sm bg-white/95 backdrop-blur-2xl border border-[#E8E4DC] rounded-3xl shadow-[0_8px_30px_rgba(0,0,0,0.08)] px-3 py-2 flex items-center justify-between pointer-events-auto">
        {/* Clients */}
        <button
          type="button"
          onClick={() => navigateTab('/customers')}
          className={`flex flex-col items-center justify-center py-0.5 px-2 rounded-xl transition-all cursor-pointer min-w-[50px] ${
            isCustomers
              ? 'text-[#4A0E0E] font-bold'
              : 'text-[#6B6B6B] hover:text-[#242424] font-medium'
          }`}
        >
          <Users className={`w-5 h-5 transition-transform ${isCustomers ? 'text-[#4A0E0E]' : ''}`} />
          <span className="text-[10px] tracking-tight mt-0.5 leading-none font-sans font-semibold">Clients</span>
          {isCustomers ? (
            <span className="w-5 h-0.5 rounded-full bg-[#4A0E0E] mt-1" />
          ) : (
            <span className="w-5 h-0.5 rounded-full bg-transparent mt-1" />
          )}
        </button>

        {/* Projects */}
        <button
          type="button"
          onClick={() => navigateTab('/projects')}
          className={`flex flex-col items-center justify-center py-0.5 px-2 rounded-xl transition-all cursor-pointer min-w-[50px] ${
            isProjects
              ? 'text-[#4A0E0E] font-bold'
              : 'text-[#6B6B6B] hover:text-[#242424] font-medium'
          }`}
        >
          <Building2 className={`w-5 h-5 transition-transform ${isProjects ? 'text-[#4A0E0E]' : ''}`} />
          <span className="text-[10px] tracking-tight mt-0.5 leading-none font-sans font-semibold">Projects</span>
          {isProjects ? (
            <span className="w-5 h-0.5 rounded-full bg-[#4A0E0E] mt-1" />
          ) : (
            <span className="w-5 h-0.5 rounded-full bg-transparent mt-1" />
          )}
        </button>

        {/* Central Prominent Quick Add CTA */}
        <button
          type="button"
          onClick={onOpenQuickAdd}
          aria-label="Open Quick Add Menu"
          className="relative -top-2 flex flex-col items-center justify-center group cursor-pointer focus:outline-none"
        >
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#DFB95E] via-[#C9A24A] to-[#B88E35] text-white flex items-center justify-center shadow-[0_4px_16px_rgba(201,162,74,0.45)] border-2 border-white group-active:scale-90 transition-transform">
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className="text-[9.5px] font-bold tracking-tight text-[#8F6A18] mt-0.5 leading-none">
            Add
          </span>
        </button>

        {/* Wages */}
        <button
          type="button"
          onClick={() => navigateTab('/wages')}
          className={`flex flex-col items-center justify-center py-0.5 px-2 rounded-xl transition-all cursor-pointer min-w-[50px] ${
            isWages
              ? 'text-[#4A0E0E] font-bold'
              : 'text-[#6B6B6B] hover:text-[#242424] font-medium'
          }`}
        >
          <Calendar className={`w-5 h-5 transition-transform ${isWages ? 'text-[#4A0E0E]' : ''}`} />
          <span className="text-[10px] tracking-tight mt-0.5 leading-none font-sans font-semibold">Wages</span>
          {isWages ? (
            <span className="w-5 h-0.5 rounded-full bg-[#4A0E0E] mt-1" />
          ) : (
            <span className="w-5 h-0.5 rounded-full bg-transparent mt-1" />
          )}
        </button>

        {/* Purchases */}
        <button
          type="button"
          onClick={() => navigateTab('/procurement')}
          className={`flex flex-col items-center justify-center py-0.5 px-2 rounded-xl transition-all cursor-pointer min-w-[50px] ${
            isProcurement
              ? 'text-[#4A0E0E] font-bold'
              : 'text-[#6B6B6B] hover:text-[#242424] font-medium'
          }`}
        >
          <ShoppingCart className={`w-5 h-5 transition-transform ${isProcurement ? 'text-[#4A0E0E]' : ''}`} />
          <span className="text-[10px] tracking-tight mt-0.5 leading-none font-sans font-semibold">Purchases</span>
          {isProcurement ? (
            <span className="w-5 h-0.5 rounded-full bg-[#4A0E0E] mt-1" />
          ) : (
            <span className="w-5 h-0.5 rounded-full bg-transparent mt-1" />
          )}
        </button>
      </div>
    </nav>
  );
};
