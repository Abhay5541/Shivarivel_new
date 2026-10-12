import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Building2,
  ShoppingCart,
  Calendar,
  Plus,
} from 'lucide-react';
import { MagnifyingDock, type DockItem } from '@/components/ui/MagnifyingDock';

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
      onClick: () => navigateTab('/customers'),
    },
    {
      key: '/projects',
      label: 'Projects',
      Icon: Building2,
      onClick: () => navigateTab('/projects'),
    },
    {
      key: 'quick-add',
      label: 'Add',
      Icon: Plus,
      isAction: true,
      onClick: () => onOpenQuickAdd && onOpenQuickAdd(),
    },
    {
      key: '/wages',
      label: 'Wages',
      Icon: Calendar,
      onClick: () => navigateTab('/wages'),
    },
    {
      key: '/procurement',
      label: 'Purchases',
      Icon: ShoppingCart,
      onClick: () => navigateTab('/procurement'),
    },
  ];

  return (
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
  );
};
