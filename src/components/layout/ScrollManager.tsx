import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Memory cache for scroll positions per route key
const scrollPositions = new Map<string, number>();

export function ScrollManager() {
  const location = useLocation();
  const navType = useNavigationType();

  // 1. Keep track of current scroll position before navigating away
  useEffect(() => {
    const handleScroll = () => {
      scrollPositions.set(location.key, window.scrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [location.key]);

  // 2. On navigation, restore saved position for Back/Forward (POP) or scroll to top for PUSH
  useEffect(() => {
    if (navType === 'POP') {
      const savedPosition = scrollPositions.get(location.key);
      if (savedPosition !== undefined) {
        // Request animation frame for DOM paint completion
        requestAnimationFrame(() => {
          window.scrollTo({ top: savedPosition, behavior: 'instant' });
        });
        return;
      }
    }

    // Default for new forward navigation: reset to top
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [location.key, navType]);

  return null;
}
