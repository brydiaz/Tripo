"use client";

type DevPanelProps = {
  isOpen: boolean;
  isRecording: boolean;
  isDemoMode: boolean;
  isRouting: boolean;
  secure: boolean;
  geo: boolean;
  onToggleOpen: () => void;
  onToggleDemoMode: () => void;
  onStartNavigation: () => void | Promise<void>;
};

export default function DevPanel({
  isOpen,
  isRecording,
  isDemoMode,
  isRouting,
  secure,
  geo,
  onToggleOpen,
  onToggleDemoMode,
  onStartNavigation,
}: DevPanelProps) {
  return (
    <div className="pointer-events-none absolute right-4 top-24 z-[950]">
      <div className="flex flex-col items-end gap-3">
        {isOpen && (
          <div className="pointer-events-auto w-[260px] rounded-[24px] border border-white/10 bg-black/70 p-4 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
            <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">
              Herramientas DEV
            </p>

            <div className="mt-3 rounded-2xl bg-white/6 p-3">
              <p className="text-xs text-white/55">Estado</p>
              <p className="mt-1 text-sm font-semibold text-white">
                {isRecording
                  ? "Grabando recorrido"
                  : isDemoMode
                  ? "Modo demo activo"
                  : "GPS activo"}
              </p>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-white/60">
              <div className="rounded-xl bg-white/6 p-2">
                secure: {String(secure)}
              </div>
              <div className="rounded-xl bg-white/6 p-2">
                geo: {String(geo)}
              </div>
            </div>

            <div className="mt-3 flex flex-col gap-2">
              <button
                onClick={onToggleDemoMode}
                className={`rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  isDemoMode
                    ? "bg-[#f59e0b]/20 text-[#ffd08a]"
                    : "bg-white/10 text-white hover:bg-white/15"
                }`}
              >
                {isDemoMode ? "Desactivar demo" : "Modo demo"}
              </button>

              <button
                onClick={() => void onStartNavigation()}
                className="rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                {isRouting ? "Calculando..." : "Probar navegación"}
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onToggleOpen}
          className="pointer-events-auto rounded-full border border-white/10 bg-black/60 px-4 py-3 text-sm font-bold text-white backdrop-blur-xl shadow-[0_12px_30px_rgba(0,0,0,0.35)]"
        >
          DEV
        </button>
      </div>
    </div>
  );
}
