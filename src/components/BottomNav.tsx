import { Home, Scale, TrendingUp, BookOpen } from "lucide-react";
import { useLocation, useNavigate } from "react-router";
import type { TabRoute } from "@/types";

const TABS: { path: TabRoute; label: string; icon: React.ElementType }[] = [
  { path: "/", label: "Accueil", icon: Home },
  { path: "/saisie", label: "Saisie", icon: Scale },
  { path: "/courbe", label: "Courbe", icon: TrendingUp },
  { path: "/conseils", label: "Conseils", icon: BookOpen },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname as TabRoute;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t"
      style={{
        backgroundColor: "var(--bm-cream)",
        borderColor: "var(--bm-border)",
        paddingBottom: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <div className="mx-auto max-w-lg flex items-center justify-around h-16">
        {TABS.map((tab) => {
          const isActive = currentPath === tab.path;
          const Icon = tab.icon;
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              className="flex flex-col items-center justify-center gap-1 w-16 h-full relative transition-colors duration-200"
            >
              {isActive && (
                <span
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
                  style={{ backgroundColor: "var(--bm-gold)" }}
                />
              )}
              <Icon
                size={22}
                style={{
                  color: isActive ? "var(--bm-gold)" : "var(--bm-text-tertiary)",
                }}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className="text-[10px] font-medium"
                style={{
                  color: isActive ? "var(--bm-gold)" : "var(--bm-text-tertiary)",
                }}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
