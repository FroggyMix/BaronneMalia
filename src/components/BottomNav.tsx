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
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-[rgba(45,42,38,0.1)]"
      style={{
        backgroundColor: "#FAF6F0",
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
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[#C8956C]" />
              )}
              <Icon
                size={22}
                className={isActive ? "text-[#C8956C]" : "text-[rgba(45,42,38,0.4)]"}
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span
                className={`text-[10px] font-medium ${
                  isActive ? "text-[#C8956C]" : "text-[rgba(45,42,38,0.4)]"
                }`}
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
