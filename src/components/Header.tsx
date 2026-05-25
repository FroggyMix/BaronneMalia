import { ChevronLeft, Settings, Download, Upload, Trash2, AlertTriangle, Sun, Moon, Monitor } from "lucide-react";
import { useState, useRef } from "react";
import { useNavigate } from "react-router";
import { saveAs } from "file-saver";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useThemeContext } from "@/App";
import { GROWTH_REFERENCES } from "@/data/growthReferences";

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSettings?: boolean;
  selectedReference?: string;
  onExport?: () => string;
  onImport?: (json: string) => boolean;
  onResetDemo?: () => void;
  onClearAll?: () => void;
  onUpdateReference?: (referenceId: string) => void;
}

export function Header({ title, showBack, showSettings, selectedReference, onExport, onImport, onResetDemo, onClearAll, onUpdateReference }: HeaderProps) {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, toggleTheme } = useThemeContext();

  const handleExport = () => {
    if (onExport) {
      const json = onExport();
      const blob = new Blob([json], { type: "application/json" });
      const dateStr = new Date().toISOString().split("T")[0];
      saveAs(blob, `baronne-malia-data-${dateStr}.json`);
    }
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onImport) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = event.target?.result as string;
        const success = onImport(json);
        if (success) {
          setImportError("");
          setSettingsOpen(false);
          window.location.reload();
        } else {
          setImportError("Format de fichier invalide. Veuillez sélectionner un fichier d'export Baronne Malia.");
        }
      } catch {
        setImportError("Erreur lors de la lecture du fichier.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const themeIcon = theme === "dark" ? <Moon size={18} /> : theme === "light" ? <Sun size={18} /> : <Monitor size={18} />;
  const themeLabel = theme === "dark" ? "Sombre" : theme === "light" ? "Clair" : "Système";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b"
      style={{
        backgroundColor: "var(--bm-cream)",
        borderColor: "var(--bm-border)",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div className="mx-auto max-w-lg flex items-center justify-between h-16 px-5">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full transition-colors"
              style={{ color: "var(--bm-charcoal)" }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: "var(--bm-charcoal)" }}
          >
            {title || "Baronne Malia"}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 -mr-1 rounded-full transition-colors"
            style={{ color: "var(--bm-text-secondary)" }}
            title={`Thème: ${themeLabel}`}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {themeIcon}
          </button>
          {showSettings && (
            <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
              <SheetTrigger asChild>
                <button
                  className="p-2 -mr-2 rounded-full transition-colors"
                  style={{ color: "var(--bm-text-secondary)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                  onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                >
                  <Settings size={22} />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="w-80 border-l" style={{ backgroundColor: "var(--bm-cream)", borderColor: "var(--bm-border)" }}>
                <SheetHeader>
                  <SheetTitle className="font-bold text-lg" style={{ color: "var(--bm-charcoal)" }}>Paramètres</SheetTitle>
                </SheetHeader>
                <div className="mt-6 space-y-4">
                  {/* Growth Reference section */}
                  {onUpdateReference && (
                    <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: "var(--bm-card-bg)" }}>
                      <h3 className="font-semibold mb-3" style={{ color: "var(--bm-charcoal)" }}>Référentiel de croissance</h3>
                      <div className="space-y-2">
                        {GROWTH_REFERENCES.map((ref) => (
                          <button
                            key={ref.id}
                            onClick={() => onUpdateReference(ref.id)}
                            className="w-full flex items-start gap-3 p-3 rounded-lg transition-colors text-left"
                            style={
                              selectedReference === ref.id
                                ? { backgroundColor: "var(--bm-pale-gold)", border: "1px solid var(--bm-gold)" }
                                : { backgroundColor: "transparent" }
                            }
                            onMouseEnter={(e) => {
                              if (selectedReference !== ref.id) e.currentTarget.style.backgroundColor = "var(--bm-surface)";
                            }}
                            onMouseLeave={(e) => {
                              if (selectedReference !== ref.id) e.currentTarget.style.backgroundColor = "transparent";
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm" style={{ color: "var(--bm-charcoal)" }}>{ref.shortLabel}</span>
                                <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{
                                  backgroundColor: ref.quality === 'A' || ref.quality === 'A-' ? '#D4E0CD' : '#F0E2D0',
                                  color: ref.quality === 'A' || ref.quality === 'A-' ? '#7A8B6E' : '#C8956C',
                                }}>
                                  {ref.quality}
                                </span>
                                {ref.recommended && (
                                  <span className="px-1.5 py-0.5 rounded text-[10px] font-medium" style={{ backgroundColor: 'var(--bm-pale-gold)', color: 'var(--bm-gold)' }}>
                                    Recommandé
                                  </span>
                                )}
                              </div>
                              <p className="text-xs mt-0.5" style={{ color: "var(--bm-text-tertiary)" }}>{ref.description}</p>
                            </div>
                            {selectedReference === ref.id && (
                              <div className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5" style={{ backgroundColor: "var(--bm-gold)" }} />
                            )}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Theme section */}
                  <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: "var(--bm-card-bg)" }}>
                    <h3 className="font-semibold mb-3" style={{ color: "var(--bm-charcoal)" }}>Thème</h3>
                    <div className="flex gap-2">
                      {([
                        { value: "light" as const, label: "Clair", icon: Sun },
                        { value: "dark" as const, label: "Sombre", icon: Moon },
                        { value: "system" as const, label: "Auto", icon: Monitor },
                      ]).map((t) => (
                        <button
                          key={t.value}
                          onClick={() => {
                            if (t.value === "light" || t.value === "dark" || t.value === "system") {
                              toggleTheme();
                            }
                          }}
                          className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                            theme === t.value
                              ? "shadow-sm"
                              : "border hover:opacity-80"
                          }`}
                          style={
                            theme === t.value
                              ? { backgroundColor: "var(--bm-gold)", color: "#fff", borderColor: "transparent" }
                              : { backgroundColor: "var(--bm-surface)", color: "var(--bm-text-secondary)", borderColor: "var(--bm-border)" }
                          }
                        >
                          <t.icon size={16} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: "var(--bm-card-bg)" }}>
                    <h3 className="font-semibold mb-3" style={{ color: "var(--bm-charcoal)" }}>Données</h3>
                    <div className="space-y-2">
                      {onExport && (
                        <button
                          onClick={handleExport}
                          className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                          style={{ color: "var(--bm-charcoal)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <Download size={18} style={{ color: "var(--bm-gold)" }} />
                          <span className="text-sm">Exporter les données (JSON)</span>
                        </button>
                      )}
                      {onImport && (
                        <>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                            style={{ color: "var(--bm-charcoal)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <Upload size={18} style={{ color: "#6B8FA3" }} />
                            <span className="text-sm">Importer des données</span>
                          </button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".json"
                            onChange={handleImport}
                            className="hidden"
                          />
                          {importError && (
                            <p className="text-xs mt-1 px-3 text-[#C06B5A]">{importError}</p>
                          )}
                        </>
                      )}
                      {onResetDemo && (
                        <button
                          onClick={() => {
                            onResetDemo();
                            setSettingsOpen(false);
                          }}
                          className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                          style={{ color: "var(--bm-charcoal)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <Upload size={18} style={{ color: "#7A8B6E" }} />
                          <span className="text-sm">Charger les données de démo</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {onClearAll && (
                    <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: "var(--bm-card-bg)" }}>
                      <h3 className="font-semibold mb-3" style={{ color: "var(--bm-charcoal)" }}>Zone dangereuse</h3>
                      <button
                        onClick={() => setClearDialogOpen(true)}
                        className="w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left"
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                      >
                        <Trash2 size={18} className="text-[#C06B5A]" />
                        <span className="text-sm text-[#C06B5A]">Tout effacer</span>
                      </button>
                    </div>
                  )}

                  <div className="rounded-xl p-4 shadow-sm" style={{ backgroundColor: "var(--bm-card-bg)" }}>
                    <h3 className="font-semibold mb-2" style={{ color: "var(--bm-charcoal)" }}>À propos</h3>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--bm-text-secondary)" }}>
                      Baronne Malia — Suivi de croissance pour Golden Retriever.
                      Données basées sur FEDIAF 2024, NRC 2006, et les standards vétérinaires.
                      Version 2.1.0
                    </p>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          )}
        </div>
      </div>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="border" style={{ backgroundColor: "var(--bm-cream)", borderColor: "var(--bm-border)" }}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#C06B5A]">
              <AlertTriangle size={20} />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription style={{ color: "var(--bm-text-secondary)" }}>
              Cette action est irréversible. Toutes les données de poids et d'alimentation seront supprimées.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearDialogOpen(false)} className="border-[rgba(45,42,38,0.2)]">
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                onClearAll?.();
                setClearDialogOpen(false);
                setSettingsOpen(false);
              }}
              className="bg-[#C06B5A] hover:bg-[#a8584a]"
            >
              Tout effacer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </header>
  );
}
