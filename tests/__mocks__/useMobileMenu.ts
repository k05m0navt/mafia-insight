import { vi } from 'vitest';

export const useMobileMenu = () => ({
  isOpen: false,
  toggle: vi.fn(),
  close: vi.fn(),
  open: vi.fn(),
});
