"use client";

import { PlaceResult } from "@/lib/geo";

type SearchBarProps = {
  value: string;
  results: PlaceResult[];
  isSearching: boolean;
  error: string;
  isOpen: boolean;
  disabled?: boolean;
  onChange: (value: string) => void;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (result: PlaceResult) => void | Promise<void>;
};

export default function SearchBar({
  value,
  results,
  isSearching,
  error,
  isOpen,
  disabled = false,
  onChange,
  onOpen,
  onClose,
  onSelect,
}: SearchBarProps) {
  return (
    <div className="absolute left-4 right-4 top-4 z-[945]">
      <div className="rounded-[24px] border border-white/10 bg-black/65 p-3 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.35)]">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value}
            disabled={disabled}
            onChange={(e) => {
              onChange(e.target.value);
              onOpen();
            }}
            onFocus={() => {
              if (results.length > 0) onOpen();
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
            }}
            placeholder="Buscar destino"
            className="flex-1 rounded-2xl border border-white/10 bg-white/8 px-4 py-3 text-sm text-white outline-none placeholder:text-white/35 focus:border-[#2D9CDB]/50 disabled:opacity-60"
          />

        </div>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        {isOpen && results.length > 0 && (
          <div className="mt-3 max-h-56 overflow-y-auto rounded-2xl border border-white/10 bg-white/6 p-2">
            {results.map((result, index) => (
              <button
                key={`${result.name}-${index}`}
                onClick={() => void onSelect(result)}
                className="block w-full rounded-xl px-3 py-3 text-left transition hover:bg-white/10"
              >
                <p className="text-sm font-medium text-white">{result.name}</p>
              </button>
            ))}
          </div>
        )}

        <p className="mt-3 text-xs text-white/45">
          También puedes tocar el mapa para elegir un destino.
        </p>
      </div>
    </div>
  );
}
