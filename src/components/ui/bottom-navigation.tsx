import * as React from "react";
import { Home, Grid3x3, User, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavigationItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
}

const navigationItems: NavigationItem[] = [
  {
    id: "home",
    label: "Home",
    icon: <Home className="h-5 w-5" />,
    path: "/",
  },
  {
    id: "games",
    label: "Games",
    icon: <Grid3x3 className="h-5 w-5" />,
    path: "/games",
  },
  {
    id: "profile",
    label: "Profile",
    icon: <User className="h-5 w-5" />,
    path: "/profile",
  },
  {
    id: "settings",
    label: "Settings",
    icon: <Settings className="h-5 w-5" />,
    path: "/settings",
  },
];

interface BottomNavigationProps {
  activeItem?: string;
  onNavigate?: (path: string) => void;
  className?: string;
}

export function BottomNavigation({
  activeItem = "home",
  onNavigate,
  className,
}: BottomNavigationProps) {
  const isMobile = useIsMobile();

  if (!isMobile) {
    return null;
  }

  const handleNavigation = (path: string) => {
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div
      className={cn(
        "fixed bottom-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-t border-border",
        "safe-area-inset-bottom",
        className
      )}
    >
      <div className="flex items-center justify-around h-17 md:h-20">
        {navigationItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavigation(item.path)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-h-[44px] min-w-[44px] px-3 py-2 rounded-lg transition-all duration-200",
              "active:scale-95 touch-manipulation",
              activeItem === item.id
                ? "text-primary"
                : "text-muted-foreground hover:text-foreground"
            )}
            aria-label={item.label}
          >
            <div className={cn(
              "transition-transform duration-200",
              activeItem === item.id ? "scale-110" : "scale-100"
            )}>
              {item.icon}
            </div>
            <span className="text-xs font-medium leading-none">
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default BottomNavigation;