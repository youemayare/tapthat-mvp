'use client';

import { useEffect } from 'react';
import { useTheme } from 'next-themes';

/**
 * Detects Samsung Internet Browser and dynamically applies the `.samsung-browser`
 * root class along with strict `color-scheme` controls.
 *
 * This ensures that on Samsung Internet, the browser's aggressive Forced Dark Mode
 * transformation algorithm is safely managed without affecting any other browsers.
 */
export function SamsungManager() {
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') return;

    const isSamsung = /samsungbrowser/i.test(navigator.userAgent);
    if (!isSamsung) return;

    const root = document.documentElement;
    root.classList.add('samsung-browser');

    // Sync strict color-scheme: 'only dark' or 'only light' prevents browser heuristic color destruction
    const isDark = resolvedTheme === 'dark' || root.classList.contains('dark');
    root.style.colorScheme = isDark ? 'only dark' : 'only light';
  }, [resolvedTheme]);

  return null;
}
