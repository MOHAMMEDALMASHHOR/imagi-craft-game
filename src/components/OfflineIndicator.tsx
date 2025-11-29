import { WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';

export function OfflineIndicator() {
  const isOnline = useNetworkStatus();

  if (isOnline) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed top-0 left-0 right-0 z-[100] safe-area-inset-top",
        "bg-destructive/95 backdrop-blur-sm text-destructive-foreground",
        "px-4 py-2 flex items-center justify-center gap-2",
        "animate-slide-up text-sm font-medium"
      )}
    >
      <WifiOff className="h-4 w-4" />
      <span>You&apos;re offline. Some features may be limited.</span>
    </div>
  );
}

export default OfflineIndicator;
