import { useState, useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { QuickAddModal } from '@/components/quick-add/QuickAddModal';
import { SimpleCustomerModal } from '@/components/business/SimpleCustomerModal';
import { SimpleSiteModal } from '@/components/business/SimpleSiteModal';
import { SimplePurchaseModal } from '@/components/business/SimplePurchaseModal';
import { SimpleEmployeeModal } from '@/components/business/SimpleEmployeeModal';

const TOP_LEVEL_SPOKES = [
  '/customers',
  '/projects',
  '/wages',
  '/procurement',
  '/purchases',
  '/attendance',
  '/employees',
  '/materials',
  '/settings',
];

export function AppLayout() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [activeQuickAction, setActiveQuickAction] = useState<'customer' | 'project' | 'purchase' | 'laborer' | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);

  useEffect(() => {
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  // Mobile Hub-and-Spoke Back Gestures:
  // If user navigates Back from a top-level spoke, ensure they return cleanly to Dashboard
  useEffect(() => {
    const handlePopState = () => {
      const current = window.location.pathname;
      const prev = prevPathRef.current;
      const isCurrentSpoke = TOP_LEVEL_SPOKES.some((tab) => current === tab || current.startsWith(tab + '/'));
      const isPrevSpoke = TOP_LEVEL_SPOKES.some((tab) => prev === tab);

      if (isCurrentSpoke && isPrevSpoke && current !== prev) {
        navigate('/dashboard', { replace: true });
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col antialiased text-[#242424]">
      {/* Universal Top Header (Both PC & Mobile) */}
      <Header onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      {/* Scrollable Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-10 pt-2 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Unified Bottom Navigation */}
      <MobileBottomNav onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      {/* Signature Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        onSelectAction={(actionId) => {
          setIsQuickAddOpen(false);
          setActiveQuickAction(actionId);
        }}
      />

      {/* In-Place Quick Creation Modals (Direct, no URL redirect) */}
      <SimpleCustomerModal
        isOpen={activeQuickAction === 'customer'}
        onClose={() => setActiveQuickAction(null)}
      />

      <SimpleSiteModal
        isOpen={activeQuickAction === 'project'}
        onClose={() => setActiveQuickAction(null)}
      />

      <SimplePurchaseModal
        isOpen={activeQuickAction === 'purchase'}
        onClose={() => setActiveQuickAction(null)}
      />

      <SimpleEmployeeModal
        isOpen={activeQuickAction === 'laborer'}
        onClose={() => setActiveQuickAction(null)}
      />
    </div>
  );
}
