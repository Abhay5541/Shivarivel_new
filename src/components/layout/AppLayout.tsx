import { useEffect, useRef } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';

const TOP_LEVEL_SPOKES = [
  '/projects',
  '/wages',
  '/attendance',
  '/employees',
  '/materials',
  '/customers',
  '/settings',
];

export function AppLayout() {
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
      <Header />

      {/* Scrollable Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-10 pt-2 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Unified Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

