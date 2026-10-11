import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Users,
  Building2,
  Calendar,
  Layers,
} from 'lucide-react';
import { MagnifyingDock, type DockItem } from '@/components/ui/MagnifyingDock';

export const MobileBottomNav: React.FC = () => {
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
    location.pathname.startsWith('/projects')
      ? '/projects'
      : location.pathname.startsWith('/employees')
      ? '/employees'
      : location.pathname.startsWith('/materials')
      ? '/materials'
      : location.pathname.startsWith('/wages')
      ? '/wages'
      : '';

  const dockItems: DockItem[] = [
    {
      key: '/projects',
      label: 'Projects',
      Icon: Building2,
      onClick: () => navigateTab('/projects'),
    },
    {
      key: '/employees',
      label: 'Employees',
      Icon: Users,
      onClick: () => navigateTab('/employees'),
    },
    {
      key: '/materials',
      label: 'Materials',
      Icon: Layers,
      onClick: () => navigateTab('/materials'),
    },
    {
      key: '/wages',
      label: 'Wages',
      Icon: Calendar,
      onClick: () => navigateTab('/wages'),
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

