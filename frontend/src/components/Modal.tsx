/**
 * Genel modal sarmalayıcısı.
 *
 * designs/assets/lifeos.css'deki `.cm-bg` / `.cm` yapısı temel alındı.
 * Backdrop'a tıklayınca kapanır; ESC tuşuyla da. Form içeriği `children`
 * olarak geçilir — modal sadece çerçeveyi yönetir.
 */
import { useEffect, type ReactNode } from "react";
import { Icon } from "@/utils/icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  icon?: string;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function Modal({ open, onClose, icon, title, children, footer }: ModalProps) {
  // ESC ile kapatma
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="cm-bg show"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="cm">
        <div className="cm-head">
          {icon && (
            <div className="ci">
              <Icon name={icon} size={18} strokeWidth={1.9} />
            </div>
          )}
          <h3>{title}</h3>
        </div>
        <div className="cm-body">
          {children}
          {footer && <div className="cm-foot">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
