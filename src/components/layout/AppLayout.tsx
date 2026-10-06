import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { MobileBottomNav } from './MobileBottomNav';
import { QuickAddModal } from '@/components/quick-add/QuickAddModal';

export function AppLayout() {
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);

  // Global keyboard shortcut for Quick Add (Q or Cmd+K / Ctrl+K)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (
        (e.key === 'q' || e.key === 'Q') &&
        !['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)
      ) {
        e.preventDefault();
        setIsQuickAddOpen((prev) => !prev);
      } else if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsQuickAddOpen((prev) => !prev);
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#F7F5F0] flex flex-col antialiased text-[#242424]">
      {/* Universal Top Header (Both PC & Mobile) */}
      <Header onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      {/* Scrollable Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 pt-2 px-4 sm:px-6 lg:px-8 max-w-7xl w-full mx-auto">
        <Outlet />
      </main>

      {/* Unified Bottom Navigation (Both PC & Mobile with 4 Options + Central Plus) */}
      <MobileBottomNav onOpenQuickAdd={() => setIsQuickAddOpen(true)} />

      {/* Signature Quick Add Modal */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  );
}
