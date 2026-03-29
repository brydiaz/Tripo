"use client";

type ModalProps = {
  isOpen: boolean;
  title: string;
  description?: string;
  children?: React.ReactNode;
  onClose: () => void;
};

export default function Modal({
  isOpen,
  title,
  description,
  children,
  onClose,
}: ModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/60 p-5 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-[28px] border border-white/10 bg-[#141a22] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <p className="text-xs uppercase tracking-[0.25em] text-white/40">
          Tripo
        </p>

        <h2 className="mt-2 text-2xl font-bold text-white">{title}</h2>

        {description && (
          <p className="mt-2 text-sm text-white/60">{description}</p>
        )}

        <div className="mt-5">{children}</div>

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80 hover:bg-white/10"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}