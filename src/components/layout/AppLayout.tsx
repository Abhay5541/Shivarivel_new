import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { MobileHeader } from './MobileHeader';
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
    <div className="min-h-screen bg-[#F7F5F0] flex antialiased text-[#242424]">
      {/* Desktop Fixed Sidebar */}
      <Sidebar className="hidden lg:flex" />

      {/* Main Application Column */}
      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        {/* Desktop Header */}
        <div className="hidden lg:block">
          <Header onOpenQuickAdd={() => setIsQuickAddOpen(true)} />
        </div>

        {/* Mobile Header */}
        <MobileHeader />

        {/* Scrollable Main Content Area */}
        <main className="flex-1 overflow-y-auto pb-20 lg:pb-8">
          <Outlet />
        </main>

        {/* Mobile Bottom Navigation */}
        <MobileBottomNav onOpenQuickAdd={() => setIsQuickAddOpen(true)} />
      </div>

      {/* Desktop Floating Gold FAB */}
      <button
        type="button"
        aria-label="Open Quick Add Menu (Hotkey: Q)"
        onClick={() => setIsQuickAddOpen(true)}
        className="hidden lg:flex fixed bottom-8 right-8 z-40 w-14 h-14 rounded-full bg-[#C99A2E] text-white items-center justify-center shadow-lg hover:shadow-xl hover:bg-[#B38722] hover:scale-105 active:scale-95 transition-all cursor-pointer border-2 border-white"
        title="Quick Add (Press 'Q')"
      >
        <Plus className="w-7 h-7" />
      </button>

      {/* Signature Quick Add Modal & Bottom Sheet */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
      />
    </div>
  );
}
