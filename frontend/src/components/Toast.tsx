/**
 * Toast bildirim sistemi (designs/assets/lifeos.css `.toast` sınıfını kullanır).
 *
 * Provider'ı `main.tsx`'te yerleştirip; herhangi bir component `useToast()`
 * hook'u ile `toast.show("mesaj")` çağırabilir.
 *
 * Tek anda bir toast gösterilir, 2 saniye sonra otomatik kaybolur.
 */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { Icon } from "@/utils/icons";

interface ToastState {
  message: string;
  kind: "ok" | "info" | "warn";
}

interface ToastCtx {
  show: (message: string, kind?: ToastState["kind"]) => void;
}

const Context = createContext<ToastCtx | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);

  const show = useCallback((message: string, kind: ToastState["kind"] = "ok") => {
    setToast({ message, kind });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  return (
    <Context.Provider value={{ show }}>
      {children}
      {toast && (
        <div
          className="toast"
          style={{
            display: "flex",
            background:
              toast.kind === "warn" ? "var(--h-crit-d)" : "var(--ink)",
          }}
        >
          <Icon
            name={toast.kind === "warn" ? "info" : "check"}
            size={14}
            strokeWidth={2}
          />
          {toast.message}
        </div>
      )}
    </Context.Provider>
  );
}

export function useToast(): ToastCtx {
  const ctx = useContext(Context);
  if (!ctx) {
    // Provider yokken çağrılırsa sessiz no-op
    return { show: () => {} };
  }
  return ctx;
}
