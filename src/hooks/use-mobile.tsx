import * as React from "react";

const MOBILE_BREAKPOINT = 768;
const TABLET_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isMobile;
}

export function useIsTablet() {
  const [isTablet, setIsTablet] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${MOBILE_BREAKPOINT}px) and (max-width: ${TABLET_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT);
    };
    mql.addEventListener("change", onChange);
    setIsTablet(window.innerWidth >= MOBILE_BREAKPOINT && window.innerWidth < TABLET_BREAKPOINT);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return !!isTablet;
}

export function useOrientation() {
  const [orientation, setOrientation] = React.useState<'portrait' | 'landscape' | undefined>(undefined);

  React.useEffect(() => {
    const updateOrientation = () => {
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape');
    };

    const mql = window.matchMedia("(orientation: portrait)");
    mql.addEventListener("change", updateOrientation);
    updateOrientation();

    return () => mql.removeEventListener("change", updateOrientation);
  }, []);

  return orientation;
}

export function useIsTouchDevice() {
  const [isTouchDevice, setIsTouchDevice] = React.useState<boolean | undefined>(undefined);

  React.useEffect(() => {
    const checkTouch = () => {
      setIsTouchDevice(
        'ontouchstart' in window ||
        navigator.maxTouchPoints > 0 ||
        (navigator as any).msMaxTouchPoints > 0
      );
    };

    checkTouch();
    return () => {}; // No cleanup needed for touch detection
  }, []);

  return !!isTouchDevice;
}

export function useIsMobileDevice() {
  const isMobile = useIsMobile();
  const isTouchDevice = useIsTouchDevice();

  return isMobile && isTouchDevice;
}

export function useIsStandalone() {
  const [isStandalone, setIsStandalone] = React.useState<boolean>(false);

  React.useEffect(() => {
    // Check if app is running in standalone mode (installed as PWA)
    const checkStandalone = () => {
      // Check for iOS Safari standalone mode
      const isIOSStandalone = 'standalone' in window.navigator && 
        (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
      
      const isInStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches ||
        isIOSStandalone ||
        document.referrer.includes('android-app://');
      setIsStandalone(isInStandaloneMode);
    };

    checkStandalone();

    // Also listen for display mode changes
    const mql = window.matchMedia('(display-mode: standalone)');
    mql.addEventListener('change', checkStandalone);

    return () => mql.removeEventListener('change', checkStandalone);
  }, []);

  return isStandalone;
}

export function useNetworkStatus() {
  const [isOnline, setIsOnline] = React.useState<boolean>(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}
