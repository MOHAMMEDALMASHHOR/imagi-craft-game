import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Download, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsMobile } from '@/hooks/use-mobile';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    // Check if already installed (standalone mode)
    // Check for iOS Safari standalone mode
    const isIOSStandalone = 'standalone' in window.navigator && 
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    const isInStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || isIOSStandalone;
    setIsStandalone(isInStandaloneMode);

    // Check if iOS using feature detection and user agent as fallback
    // We need UA detection here as there's no reliable feature detection for iOS vs Android
    const isIOSDevice = /iPad|iPhone|iPod/.test(navigator.userAgent) && 
      !('MSStream' in window);
    setIsIOS(isIOSDevice);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('installPromptDismissed');
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0;
    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

    // Show again after 7 days
    if (dismissedTime && daysSinceDismissed < 7) {
      return;
    }

    // Listen for the beforeinstallprompt event (Android/Chrome)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Delay showing the prompt slightly
      setTimeout(() => setShowPrompt(true), 3000);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS, show the prompt after a delay if not installed
    if (isIOSDevice && !isInStandaloneMode) {
      setTimeout(() => setShowPrompt(true), 5000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('installPromptDismissed', Date.now().toString());
  };

  // Don't show if already installed or not on mobile
  if (isStandalone || !showPrompt || !isMobile) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed bottom-20 left-4 right-4 z-50 animate-slide-up-mobile",
        "bg-card/95 backdrop-blur-xl rounded-2xl border border-primary/20",
        "shadow-[0_0_30px_rgba(139,92,246,0.3)] p-4"
      )}
    >
      <button
        onClick={handleDismiss}
        className="absolute top-2 right-2 p-1 rounded-full hover:bg-muted transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-4 w-4 text-muted-foreground" />
      </button>

      <div className="flex items-start gap-4">
        <div className="p-3 rounded-xl bg-gradient-to-br from-primary to-accent">
          <Smartphone className="h-6 w-6 text-white" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground mb-1">
            Install Brain Games
          </h3>
          
          {isIOS ? (
            <p className="text-sm text-muted-foreground mb-3">
              Tap <span className="inline-flex items-center mx-1 px-1 py-0.5 bg-muted rounded text-xs">
                <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18 16v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"/>
                </svg>
              </span> then &quot;Add to Home Screen&quot;
            </p>
          ) : (
            <p className="text-sm text-muted-foreground mb-3">
              Add to your home screen for quick access and offline play
            </p>
          )}

          {!isIOS && (
            <Button
              onClick={handleInstall}
              size="sm"
              className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90"
            >
              <Download className="h-4 w-4 mr-2" />
              Install App
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export default InstallPrompt;
