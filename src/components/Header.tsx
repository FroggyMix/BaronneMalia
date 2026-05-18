import { ChevronLeft, Settings, Download, Upload, Trash2, AlertTriangle } from "lucide-react";
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

interface HeaderProps {
  title?: string;
  showBack?: boolean;
  showSettings?: boolean;
  onExport?: () => string;
  onImport?: (json: string) => boolean;
  onResetDemo?: () => void;
  onClearAll?: () => void;
}

export function Header({ title, showBack, showSettings, onExport, onImport, onResetDemo, onClearAll }: HeaderProps) {
  const navigate = useNavigate();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [clearDialogOpen, setClearDialogOpen] = useState(false);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 border-b border-[rgba(45,42,38,0.1)]"
      style={{
        backgroundColor: "#FAF6F0",
        paddingTop: "env(safe-area-inset-top, 0px)",
      }}
    >
      <div className="mx-auto max-w-lg flex items-center justify-between h-16 px-5">
        <div className="flex items-center gap-2">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-[rgba(45,42,38,0.05)] transition-colors"
            >
              <ChevronLeft size={24} className="text-[#2D2A26]" />
            </button>
          )}
          <h1
            className="text-xl font-bold tracking-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: "#2D2A26" }}
          >
            {title || "Baronne Malia"}
          </h1>
        </div>
        {showSettings && (
          <Sheet open={settingsOpen} onOpenChange={setSettingsOpen}>
            <SheetTrigger asChild>
              <button className="p-2 -mr-2 rounded-full hover:bg-[rgba(45,42,38,0.05)] transition-colors">
                <Settings size={22} className="text-[rgba(45,42,38,0.7)]" />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-[#FAF6F0] border-l border-[rgba(45,42,38,0.1)]">
              <SheetHeader>
                <SheetTitle className="text-[#2D2A26] font-bold text-lg">Paramètres</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-[#2D2A26] mb-3">Données</h3>
                  <div className="space-y-2">
                    {onExport && (
                      <button
                        onClick={handleExport}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#FAF6F0] transition-colors text-left"
                      >
                        <Download size={18} className="text-[#C8956C]" />
                        <span className="text-sm text-[#2D2A26]">Exporter les données (JSON)</span>
                      </button>
                    )}
                    {onImport && (
                      <>
                        <button
                          onClick={() => fileInputRef.current?.click()}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#FAF6F0] transition-colors text-left"
                        >
                          <Upload size={18} className="text-[#6B8FA3]" />
                          <span className="text-sm text-[#2D2A26]">Importer des données</span>
                        </button>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".json"
                          onChange={handleImport}
                          className="hidden"
                        />
                        {importError && (
                          <p className="text-xs text-[#C06B5A] mt-1 px-3">{importError}</p>
                        )}
                      </>
                    )}
                    {onResetDemo && (
                      <button
                        onClick={() => {
                          onResetDemo();
                          setSettingsOpen(false);
                        }}
                        className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#FAF6F0] transition-colors text-left"
                      >
                        <Upload size={18} className="text-[#7A8B6E]" />
                        <span className="text-sm text-[#2D2A26]">Charger les données de démo</span>
                      </button>
                    )}
                  </div>
                </div>

                {onClearAll && (
                  <div className="bg-white rounded-xl p-4 shadow-sm">
                    <h3 className="font-semibold text-[#2D2A26] mb-3">Zone dangereuse</h3>
                    <button
                      onClick={() => setClearDialogOpen(true)}
                      className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-[#FAF6F0] transition-colors text-left"
                    >
                      <Trash2 size={18} className="text-[#C06B5A]" />
                      <span className="text-sm text-[#C06B5A]">Tout effacer</span>
                    </button>
                  </div>
                )}

                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <h3 className="font-semibold text-[#2D2A26] mb-2">À propos</h3>
                  <p className="text-xs text-[rgba(45,42,38,0.6)] leading-relaxed">
                    Baronne Malia — Suivi de croissance pour Golden Retriever.
                    Données basées sur FEDIAF 2024, NRC 2006, et les standards vétérinaires.
                    Version 1.0.0
                  </p>
                </div>
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>

      <Dialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <DialogContent className="bg-[#FAF6F0] border border-[rgba(45,42,38,0.1)]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-[#C06B5A]">
              <AlertTriangle size={20} />
              Confirmer la suppression
            </DialogTitle>
            <DialogDescription className="text-[rgba(45,42,38,0.7)]">
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
