import { HashRouter, Routes, Route, Navigate } from "react-router";
import { useEffect, createContext, useContext } from "react";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { useTheme } from "@/hooks/useTheme";
import { BottomNav } from "@/components/BottomNav";
import { HomePage } from "@/pages/HomePage";
import { SaisiePage } from "@/pages/SaisiePage";
import { CourbePage } from "@/pages/CourbePage";
import { ConseilsPage } from "@/pages/ConseilsPage";
import { WifiOff } from "lucide-react";

interface ThemeContextValue {
  theme: "light" | "dark" | "system";
  resolvedTheme: "light" | "dark";
  toggleTheme: () => void;
}

export const ThemeContext = createContext<ThemeContextValue>({
  theme: "system",
  resolvedTheme: "light",
  toggleTheme: () => {},
});

export function useThemeContext() {
  return useContext(ThemeContext);
}

function PawLoader() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#C8956C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="4" r="2" />
      <path d="M7.5 8.5C7.5 8.5 9 11 11 11C13 11 14.5 9 14.5 7.5" />
      <path d="M5.5 13C5.5 13 7 15.5 9 15.5C11 15.5 12.5 13.5 12.5 12" />
      <path d="M9.5 18C9.5 18 11 20 13 20C15 20 16.5 18 16.5 16.5" />
      <circle cx="17" cy="6" r="1.5" />
      <path d="M16 10C16 10 17 12 18.5 12C20 12 21 10.5 21 9" />
    </svg>
  );
}

function App() {
  const theme = useTheme();
  const {
    data,
    isLoaded,
    isOnline,
    isConfigured,
    addWeightEntry,
    addFeedingEntry,
    updateReference,
    exportData,
    importData,
    resetWithDemoData,
    clearAllData,
  } = useSupabaseData();

  const selectedReference = data.settings.selectedReference;

  // Auto-load demo data on first visit if empty and Supabase not configured
  useEffect(() => {
    if (isLoaded && data.weightHistory.length === 0 && !isConfigured) {
      const hasVisited = localStorage.getItem("baronne-malia-visited");
      if (!hasVisited) {
        resetWithDemoData();
        localStorage.setItem("baronne-malia-visited", "true");
      }
    }
  }, [isLoaded, data.weightHistory.length, isConfigured, resetWithDemoData]);

  if (!isLoaded) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ backgroundColor: "var(--bm-cream)" }}
      >
        <div className="text-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "var(--bm-pale-gold)" }}
          >
            <PawLoader />
          </div>
          <h1
            className="text-xl font-bold"
            style={{ fontFamily: "'Playfair Display', serif", color: "var(--bm-charcoal)" }}
          >
            Baronne Malia
          </h1>
          <p className="text-sm mt-1" style={{ color: "var(--bm-text-tertiary)" }}>
            {!isConfigured ? "Chargement..." : "Synchronisation..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        theme: theme.theme,
        resolvedTheme: theme.resolvedTheme,
        toggleTheme: theme.toggleTheme,
      }}
    >
      <HashRouter>
        <div
          className="min-h-screen"
          style={{ backgroundColor: "var(--bm-cream)" }}
        >
          {/* Offline indicator */}
          {!isOnline && isConfigured && (
            <div className="fixed top-0 left-0 right-0 z-[60] bg-[#C06B5A] text-white text-xs py-1.5 px-4 flex items-center justify-center gap-1.5">
              <WifiOff size={12} />
              Mode hors-ligne — les données seront synchronisées à la reconnexion
            </div>
          )}

          {!isConfigured && (
            <div className="fixed top-0 left-0 right-0 z-[60] bg-[#6B8FA3] text-white text-xs py-1.5 px-4 flex items-center justify-center gap-1.5">
              Mode local — configurez Supabase dans les paramètres pour le cloud
            </div>
          )}

          <Routes>
            <Route
              path="/"
              element={
                <HomePage
                  data={data}
                  selectedReference={selectedReference}
                  onExport={exportData}
                  onImport={importData}
                  onResetDemo={resetWithDemoData}
                  onClearAll={clearAllData}
                  updateReference={updateReference}
                />
              }
            />
            <Route
              path="/saisie"
              element={
                <SaisiePage
                  data={data}
                  onAddWeight={addWeightEntry}
                  onAddFeeding={addFeedingEntry}
                  selectedReference={selectedReference}
                  onExport={exportData}
                  onImport={importData}
                  onResetDemo={resetWithDemoData}
                  onClearAll={clearAllData}
                  onUpdateReference={updateReference}
                />
              }
            />
            <Route path="/courbe" element={<CourbePage data={data} selectedReference={selectedReference} onExport={exportData} onImport={importData} onResetDemo={resetWithDemoData} onClearAll={clearAllData} onUpdateReference={updateReference} />} />
            <Route path="/conseils" element={<ConseilsPage data={data} selectedReference={selectedReference} onExport={exportData} onImport={importData} onResetDemo={resetWithDemoData} onClearAll={clearAllData} onUpdateReference={updateReference} />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <BottomNav />
        </div>
      </HashRouter>
    </ThemeContext.Provider>
  );
}

export default App;
