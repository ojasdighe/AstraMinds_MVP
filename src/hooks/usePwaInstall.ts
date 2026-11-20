import { useState, useEffect } from 'react';

// Module-level storage so all components share the same deferred event
let deferredPrompt: any = null;
const promptListeners = new Set<() => void>();

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    promptListeners.forEach((fn) => fn());
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    promptListeners.forEach((fn) => fn());
  });
}

export function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    Boolean((window.navigator as any).standalone)
  );
}

export function isIOSDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const ua = window.navigator.userAgent.toLowerCase();
  const isApple = /iphone|ipad|ipod/.test(ua);
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return isApple || isIPadOS;
}

export function usePwaInstall() {
  const [hasPrompt, setHasPrompt] = useState<boolean>(Boolean(deferredPrompt));
  const [isInstalled, setIsInstalled] = useState<boolean>(false);
  const [showIOSModal, setShowIOSModal] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const dismissedUntil = localStorage.getItem('astraminds_pwa_dismissed_until');
    if (!dismissedUntil) return false;
    return Date.now() < Number(dismissedUntil);
  });

  useEffect(() => {
    setIsInstalled(isStandaloneMode());

    const updatePrompt = () => {
      setHasPrompt(Boolean(deferredPrompt));
      setIsInstalled(isStandaloneMode());
    };

    promptListeners.add(updatePrompt);
    return () => {
      promptListeners.delete(updatePrompt);
    };
  }, []);

  const promptInstall = async () => {
    // If running on iOS Safari
    if (isIOSDevice()) {
      setShowIOSModal(true);
      return;
    }

    // If native prompt is available
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        deferredPrompt = null;
        setHasPrompt(false);
        setIsInstalled(true);
      }
      return;
    }

    // Fallback: Show instructions modal for browsers where prompt isn't directly triggerable
    setShowIOSModal(true);
  };

  const dismissBanner = () => {
    setIsDismissed(true);
    // Dismiss for 7 days
    const sevenDays = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('astraminds_pwa_dismissed_until', String(sevenDays));
  };

  const canInstall = !isInstalled && (hasPrompt || isIOSDevice() || true);

  return {
    canInstall,
    isInstalled,
    isIOS: isIOSDevice(),
    hasNativePrompt: hasPrompt,
    isDismissed,
    showIOSModal,
    setShowIOSModal,
    promptInstall,
    dismissBanner,
  };
}
