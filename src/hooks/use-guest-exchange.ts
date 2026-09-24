'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

// FEATURE FLAG: Set to false to instantly disable the guest conversion flow.
export const ENABLE_GUEST_FLOW = true;

interface UseGuestExchangeFlowProps {
  isLoggedIn: boolean;
  isResolved: boolean;
  profileSlug: string;
}

export function useGuestExchangeFlow({ isLoggedIn, isResolved, profileSlug }: UseGuestExchangeFlowProps) {
  const [showExchange, setShowExchange] = useState(false);
  const [showConversion, setShowConversion] = useState(false);
  const [guestSuccessData, setGuestSuccessData] = useState<{ id: string, erasureToken: string } | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const hasTriggeredRef = useRef(false);

  // Check if they've already seen it this session
  const getHasSeenPrompt = useCallback(() => {
    if (typeof window === 'undefined') return true;
    return sessionStorage.getItem(`tayz_guest_prompt_${profileSlug}`) === 'true';
  }, [profileSlug]);

  const setHasSeenPrompt = useCallback(() => {
    if (typeof window === 'undefined') return;
    sessionStorage.setItem(`tayz_guest_prompt_${profileSlug}`, 'true');
    hasTriggeredRef.current = true;
  }, [profileSlug]);

  useEffect(() => {
    if (!ENABLE_GUEST_FLOW) return;
    if (!isResolved) return; // Wait until viewer state is known
    if (isLoggedIn) return; // Never show auto-prompts to logged-in users
    if (getHasSeenPrompt()) return;
    
    // Start the 10 second timer
    timerRef.current = window.setTimeout(() => {
      if (!hasTriggeredRef.current && document.visibilityState === 'visible') {
        setHasSeenPrompt();
        setShowExchange(true);
      }
    }, 10000);

    return () => {
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, [isLoggedIn, isResolved, profileSlug, getHasSeenPrompt, setHasSeenPrompt]);

  const triggerGuestExchange = useCallback(() => {
    if (!ENABLE_GUEST_FLOW) return;
    if (isLoggedIn) return; // Do not interrupt logged-in users
    if (getHasSeenPrompt()) return; // Do not interrupt if they already saw it

    // Cancel the timer
    if (timerRef.current) {
      window.clearTimeout(timerRef.current);
    }
    
    // Show the exchange form immediately
    setHasSeenPrompt();
    setShowExchange(true);
  }, [isLoggedIn, getHasSeenPrompt, setHasSeenPrompt]);

  const handleManualExchangeClick = useCallback(() => {
    if (!isLoggedIn && ENABLE_GUEST_FLOW) {
      setHasSeenPrompt();
      if (timerRef.current) {
        window.clearTimeout(timerRef.current);
      }
    }
    setShowExchange(true);
  }, [isLoggedIn, setHasSeenPrompt]);

  const handleGuestFlowComplete = useCallback((wasSubmitted: boolean, successData?: { id: string, erasureToken: string }) => {
    setShowExchange(false);
    
    if (successData) {
      setGuestSuccessData(successData);
    }

    // If the guest flow is enabled, they are not logged in, we show the conversion pitch
    if (ENABLE_GUEST_FLOW && !isLoggedIn) {
      // Small timeout to allow the first drawer to close smoothly before opening the second
      setTimeout(() => setShowConversion(true), 300);
    }
  }, [isLoggedIn]);

  return {
    showExchange,
    setShowExchange,
    showConversion,
    setShowConversion,
    guestSuccessData,
    triggerGuestExchange,
    handleManualExchangeClick,
    handleGuestFlowComplete
  };
}
