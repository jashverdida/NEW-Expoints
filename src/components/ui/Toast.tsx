"use client";

import { AnimatePresence, motion } from "framer-motion";
import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { CheckCircle2, Info, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastKind = "success" | "error" | "info";
interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

const ToastContext = createContext<{
  push: (message: string, kind?: ToastKind) => void;
}>({ push: () => {} });

export function useToast() {
  return useContext(ToastContext);
}

const STYLES: Record<ToastKind, { icon: React.ElementType; color: string; ring: string }> = {
  success: { icon: CheckCircle2, color: "text-success", ring: "ring-success/40" },
  error: { icon: XCircle, color: "text-danger", ring: "ring-danger/40" },
  info: { icon: Info, color: "text-brand-300", ring: "ring-brand-400/40" },
};

/**
 * Toasts for action feedback. Bottom-centre on mobile (above the tab bar),
 * bottom-right on desktop — never over the thumb zone.
 */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, kind, message }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}

      <div
        className={cn(
          "pointer-events-none fixed z-[90] flex flex-col gap-2",
          "bottom-[5.5rem] left-1/2 w-[min(92vw,26rem)] -translate-x-1/2",
          "sm:bottom-6 sm:left-auto sm:right-6 sm:translate-x-0",
        )}
      >
        <AnimatePresence initial={false}>
          {toasts.map((toast) => {
            const { icon: Icon, color, ring } = STYLES[toast.kind];
            return (
              <motion.div
                key={toast.id}
                layout
                initial={{ opacity: 0, y: 18, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.96 }}
                transition={{ type: "spring", stiffness: 420, damping: 32 }}
                className={cn(
                  "glass-strong pointer-events-auto flex items-start gap-3 rounded-2xl px-4 py-3 ring-1",
                  ring,
                )}
              >
                <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", color)} />
                <p className="text-sm leading-snug text-ink">{toast.message}</p>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
