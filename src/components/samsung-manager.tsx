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

    const ua = navigator.userAgent || '';
    let isSamsung = /samsung|samsungbrowser/i.test(ua);
    const nav = navigator as any;
    if (!isSamsung && nav.userAgentData && nav.userAgentData.brands) {
      isSamsung = nav.userAgentData.brands.some((b: any) => /samsung/i.test(b.brand));
    }
    if (!isSamsung) return;

    const root = document.documentElement;
    root.classList.add('samsung-browser');

    // Sync strict color-scheme: 'only dark' or 'only light' prevents browser heuristic color destruction
    const isDark = resolvedTheme === 'dark' || root.classList.contains('dark');
    root.style.colorScheme = isDark ? 'only dark' : 'only light';
  }, [resolvedTheme]);

  return null;
}
