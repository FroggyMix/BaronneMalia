import { ChevronLeft, Settings, Download, Upload, Trash2, AlertTriangle, Sun, Moon, Monitor, ChevronDown, ChevronUp } from "lucide-react";
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
  selectedReference?: string;
  onExport?: () => string;
  onImport?: (json: string) => boolean;
  onResetDemo?: () => void;
  onClearAll?: () => void;
  onUpdateReference?: (referenceId: string) => void;
}

interface CollapsibleSectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function CollapsibleSection({ title, defaultOpen = false, children }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <div className="rounded-xl shadow-sm" style={{ backgroundColor: "var(--bm-card-bg)" }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 transition-colors rounded-xl"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <h3 className="font-semibold text-sm" style={{ color: "var(--bm-charcoal)" }}>{title}</h3>
        {isOpen ? (
          <ChevronUp size={16} style={{ color: "var(--bm-text-secondary)" }} />
        ) : (
          <ChevronDown size={16} style={{ color: "var(--bm-text-secondary)" }} />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4">{children}</div>}
    </div>
  );
}

export function Header({
  title,
  showBack,
  selectedReference,
  onExport,
  onImport,
  onResetDemo,
  onClearAll,
  onUpdateReference,
}: HeaderProps) {
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
          setImportError("Format de fichier invalide. Veuillez selectionner un fichier d'export Baronne Malia.");
        }
      } catch {
        setImportError("Erreur lors de la lecture du fichier.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const themeIcon = theme === "dark" ? <Moon size={18} /> : theme === "light" ? <Sun size={18} /> : <Monitor size={18} />;
  const themeLabel = theme === "dark" ? "Sombre" : theme === "light" ? "Clair" : "Systeme";

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
            title={`Theme: ${themeLabel}`}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            {themeIcon}
          </button>
          {/* Settings button */}
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
            <SheetContent
              side="right"
              className="w-80 border-l flex flex-col"
              style={{ backgroundColor: "var(--bm-cream)", borderColor: "var(--bm-border)", padding: 0 }}
            >
              {/* Fixed header */}
              <SheetHeader className="px-5 pt-5 pb-3 flex-shrink-0">
                <SheetTitle className="font-bold text-lg" style={{ color: "var(--bm-charcoal)" }}>
                  Parametres
                </SheetTitle>
              </SheetHeader>

              {/* Scrollable content */}
              <div
                className="flex-1 overflow-y-auto px-5 pb-8 space-y-3"
                style={{ overscrollBehavior: "contain" }}
              >
                {/* Growth Reference section */}
                {onUpdateReference && selectedReference && (
                  <CollapsibleSection title="Referentiel de croissance" defaultOpen={true}>
                    <div className="space-y-1.5">
                      {GROWTH_REFERENCES.map((ref) => (
                        <button
                          key={ref.id}
                          onClick={() => onUpdateReference(ref.id)}
                          className="w-full flex items-start gap-2 p-2 rounded-lg transition-colors text-left"
                          style={
                            selectedReference === ref.id
                              ? { backgroundColor: "var(--bm-pale-gold)" }
                              : {}
                          }
                          onMouseEnter={(e) => {
                            if (selectedReference !== ref.id) e.currentTarget.style.backgroundColor = "var(--bm-surface)";
                          }}
                          onMouseLeave={(e) => {
                            if (selectedReference !== ref.id) e.currentTarget.style.backgroundColor = "transparent";
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-xs" style={{ color: "var(--bm-charcoal)" }}>
                                {ref.shortLabel}
                              </span>
                              <span
                                className="px-1 py-0 rounded text-[9px] font-medium"
                                style={{
                                  backgroundColor: ref.quality === "A" || ref.quality === "A-" ? "#D4E0CD" : "#F0E2D0",
                                  color: ref.quality === "A" || ref.quality === "A-" ? "#7A8B6E" : "#C8956C",
                                }}
                              >
                                {ref.quality}
                              </span>
                              {ref.recommended && (
                                <span
                                  className="px-1 py-0 rounded text-[9px] font-medium"
                                  style={{ backgroundColor: "var(--bm-pale-gold)", color: "var(--bm-gold)" }}
                                >
                                  recommande
                                </span>
                              )}
                            </div>
                            <p className="text-[10px] leading-tight mt-0.5" style={{ color: "var(--bm-text-tertiary)" }}>
                              {ref.description}
                            </p>
                          </div>
                          {selectedReference === ref.id && (
                            <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 mt-1" style={{ backgroundColor: "var(--bm-gold)" }} />
                          )}
                        </button>
                      ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Theme section */}
                <CollapsibleSection title="Theme" defaultOpen={false}>
                  <div className="flex gap-2">
                    {[
                      { value: "light" as const, label: "Clair", icon: Sun },
                      { value: "dark" as const, label: "Sombre", icon: Moon },
                      { value: "system" as const, label: "Auto", icon: Monitor },
                    ].map((t) => (
                      <button
                        key={t.value}
                        onClick={() => toggleTheme()}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-medium transition-all"
                        style={
                          theme === t.value
                            ? { backgroundColor: "var(--bm-gold)", color: "#fff" }
                            : { backgroundColor: "var(--bm-surface)", color: "var(--bm-text-secondary)", border: "1px solid var(--bm-border)" }
                        }
                      >
                        <t.icon size={14} />
                        {t.label}
                      </button>
                    ))}
                  </div>
                </CollapsibleSection>

                {/* Data section */}
                {(onExport || onImport || onResetDemo) && (
                  <CollapsibleSection title="Donnees" defaultOpen={false}>
                    <div className="space-y-1">
                      {onExport && (
                        <button
                          onClick={handleExport}
                          className="w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left text-xs"
                          style={{ color: "var(--bm-charcoal)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <Download size={14} style={{ color: "var(--bm-gold)" }} />
                          Exporter les donnees (JSON)
                        </button>
                      )}
                      {onImport && (
                        <>
                          <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left text-xs"
                            style={{ color: "var(--bm-charcoal)" }}
                            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                          >
                            <Upload size={14} style={{ color: "#6B8FA3" }} />
                            Importer des donnees
                          </button>
                          <input ref={fileInputRef} type="file" accept=".json" onChange={handleImport} className="hidden" />
                          {importError && (
                            <p className="text-xs text-[#C06B5A] px-2">{importError}</p>
                          )}
                        </>
                      )}
                      {onResetDemo && (
                        <button
                          onClick={() => {
                            onResetDemo();
                            setSettingsOpen(false);
                          }}
                          className="w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left text-xs"
                          style={{ color: "var(--bm-charcoal)" }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "var(--bm-surface)")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                        >
                          <Upload size={14} style={{ color: "#7A8B6E" }} />
                          Charger les donnees de demo
                        </button>
                      )}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Danger zone */}
                {onClearAll && (
                  <CollapsibleSection title="Zone dangereuse" defaultOpen={false}>
                    <button
                      onClick={() => setClearDialogOpen(true)}
                      className="w-full flex items-center gap-2 p-2 rounded-lg transition-colors text-left text-xs"
                    >
                      <Trash2 size={14} className="text-[#C06B5A]" />
                      <span className="text-[#C06B5A]">Tout effacer</span>
                    </button>
                  </CollapsibleSection>
                )}

                {/* About */}
                <div className="rounded-xl p-3" style={{ backgroundColor: "var(--bm-card-bg)" }}>
                  <p className="text-[10px] leading-relaxed" style={{ color: "var(--bm-text-tertiary)" }}>
                    Baronne Malia — Suivi de croissance Golden Retriever.
                    Donnees : FEDIAF 2024, NRC 2006, WALTHAM, AKC/GRCA.
                    v2.2.0
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
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
              Cette action est irreversible. Toutes les donnees seront supprimees.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setClearDialogOpen(false)}>
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
