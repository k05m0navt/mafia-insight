/**
 * Custom hook for managing mobile menu state
 *
 * Handles mobile menu open/close state with automatic closing
 * when screen size changes from mobile to desktop or when navigating to another page.
 */

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';

interface UseMobileMenuReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useMobileMenu(): UseMobileMenuReturn {
  const pathname = usePathname();
  const [openPath, setOpenPath] = useState<string | null>(null);
  const isOpen = openPath === pathname;

  const open = useCallback(() => {
    setOpenPath(pathname);
  }, [pathname]);

  const close = useCallback(() => {
    setOpenPath(null);
  }, []);

  const toggle = useCallback(() => {
    setOpenPath((previous) => (previous === pathname ? null : pathname));
  }, [pathname]);

  // Auto-close when screen size changes from mobile to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        close();
      }
    };

    // Add event listener
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [close]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        close();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [close, isOpen]);

  // Also handle browser back/forward navigation
  useEffect(() => {
    const handlePopState = () => {
      close();
    };

    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [close]);

  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
