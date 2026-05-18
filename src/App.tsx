import { HashRouter, Routes, Route, Navigate } from "react-router";
import { useSupabaseData } from "@/hooks/useSupabaseData";
import { BottomNav } from "@/components/BottomNav";
import { HomePage } from "@/pages/HomePage";
import { SaisiePage } from "@/pages/SaisiePage";
import { CourbePage } from "@/pages/CourbePage";
import { ConseilsPage } from "@/pages/ConseilsPage";
import { useEffect } from "react";
import { WifiOff } from "lucide-react";

function App() {
  const {
    data,
    isLoaded,
    isOnline,
    isConfigured,
    addWeightEntry,
    addFeedingEntry,
    exportData,
    importData,
    resetWithDemoData,
    clearAllData,
  } = useSupabaseData();

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
      <div className="min-h-screen bg-[#FAF6F0] flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 rounded-full bg-[#F0E2D0] flex items-center justify-center mx-auto mb-4">
            <PawLoader />
          </div>
          <h1
            className="text-xl font-bold text-[#2D2A26]"
            style={{ fontFamily: "'Playfair Display', serif" }}
          >
            Baronne Malia
          </h1>
          <p className="text-sm text-[rgba(45,42,38,0.5)] mt-1">
            {!isConfigured ? "Chargement..." : "Synchronisation..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <HashRouter>
      <div className="min-h-screen bg-[#FAF6F0]">
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
                onExport={exportData}
                onImport={importData}
                onResetDemo={resetWithDemoData}
                onClearAll={clearAllData}
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
              />
            }
          />
          <Route path="/courbe" element={<CourbePage data={data} />} />
          <Route path="/conseils" element={<ConseilsPage data={data} />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <BottomNav />
      </div>
    </HashRouter>
  );
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

export default App;
