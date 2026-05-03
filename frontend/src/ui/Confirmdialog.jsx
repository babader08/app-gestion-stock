import { useEffect } from "react";
import { AlertTriangle, Trash2, X } from "lucide-react";

/**
 * ConfirmDialog — composant de confirmation réutilisable
 *
 * Props :
 *  - isOpen     : boolean
 *  - onConfirm  : () => void
 *  - onCancel   : () => void
 *  - title      : string  (ex: "Supprimer le produit")
 *  - message    : string  (ex: "Cette action est irréversible.")
 *  - confirmLabel : string  (défaut: "Confirmer")
 *  - cancelLabel  : string  (défaut: "Annuler")
 *  - variant    : "danger" | "warning" | "info"  (défaut: "danger")
 */

export default function ConfirmDialog({
  isOpen,
  onConfirm,
  onCancel,
  title = "Confirmer l'action",
  message = "Êtes-vous sûr de vouloir continuer ? Cette action est irréversible.",
  confirmLabel = "Confirmer",
  cancelLabel = "Annuler",
  variant = "danger",
}) {
  // Fermer avec Escape
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && isOpen) onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onCancel]);

  // Bloquer le scroll quand ouvert
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const variants = {
    danger: {
      icon: <Trash2 size={22} />,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      confirmBtn: "bg-red-600 hover:bg-red-700 active:scale-95",
    },
    warning: {
      icon: <AlertTriangle size={22} />,
      iconBg: "bg-orange-100",
      iconColor: "text-orange-600",
      confirmBtn: "bg-orange-500 hover:bg-orange-600 active:scale-95",
    },
    info: {
      icon: <AlertTriangle size={22} />,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      confirmBtn: "bg-blue-600 hover:bg-blue-700 active:scale-95",
    },
  };

  const v = variants[variant] || variants.danger;

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onCancel}
        className="animate-in fade-in fixed inset-0 z-50 bg-black/40 backdrop-blur-sm duration-200"
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="animate-in zoom-in-95 w-full max-w-sm rounded-2xl bg-white shadow-2xl ring-1 ring-gray-100 duration-200">
          {/* Header */}
          <div className="flex items-start justify-between p-5 pb-0">
            <div
              className={`flex h-11 w-11 items-center justify-center rounded-xl ${v.iconBg} ${v.iconColor}`}
            >
              {v.icon}
            </div>
            <button
              onClick={onCancel}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            >
              <X size={18} />
            </button>
          </div>

          {/* Content */}
          <div className="px-5 pt-4 pb-5">
            <h3 className="text-base font-semibold text-gray-900">{title}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-gray-500">
              {message}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2 border-t border-gray-100 px-5 py-4">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-200 py-2.5 text-sm font-semibold text-gray-600 transition-all hover:bg-gray-50 active:scale-95"
            >
              {cancelLabel}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onCancel();
              }}
              className={`flex-1 rounded-xl py-2.5 text-sm font-semibold text-white transition-all duration-150 ${v.confirmBtn}`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
