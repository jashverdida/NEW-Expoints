"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import { AlertTriangle, Ban, EyeOff, ShieldCheck, Trash2, UserCheck, X } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Replacement for window.confirm / window.prompt.
 *
 * The browser dialogs can't be styled at all — they render as an OS chrome box
 * with the origin printed at the top, which looked like a phishing warning in
 * the middle of an otherwise designed admin panel.
 *
 * Promise-based so call sites read like the thing they replaced:
 *
 *   const result = await confirm({ variant: "danger", title: "Ban @x?" });
 *   if (!result) return;              // cancelled
 *   doTheThing(result.reason);        // reason is "" when no field was asked for
 */

export type ConfirmVariant = "danger" | "warning" | "success" | "info";

export interface ConfirmOptions {
  variant?: ConfirmVariant;
  title: string;
  body?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Renders a textarea and returns its value on confirm. */
  reason?: {
    label?: string;
    placeholder?: string;
    defaultValue?: string;
    required?: boolean;
    hint?: string;
  };
  /** Optional slot above the title — an avatar and handle, say. */
  subject?: React.ReactNode;
}

export interface ConfirmResult {
  reason: string;
}

const VARIANTS: Record<
  ConfirmVariant,
  { icon: React.ElementType; accent: string; button: string }
> = {
  danger: { icon: Ban, accent: "#f43f5e", button: "bg-danger text-white hover:brightness-110" },
  warning: {
    icon: EyeOff,
    accent: "#fbbf24",
    button: "bg-exp text-[#2a1a00] hover:brightness-110",
  },
  success: {
    icon: UserCheck,
    accent: "#34d399",
    button: "bg-success text-[#04231a] hover:brightness-110",
  },
  info: {
    icon: ShieldCheck,
    accent: "#38bdf8",
    button: "bg-brand-400 text-ink-on-accent hover:brightness-110",
  },
};

/** Swaps the default icon for a few common actions. */
const ICON_OVERRIDES: Record<string, React.ElementType> = {
  delete: Trash2,
  remove: Trash2,
  hide: EyeOff,
  promote: ShieldCheck,
  demote: AlertTriangle,
};

function iconFor(options: ConfirmOptions) {
  const key = Object.keys(ICON_OVERRIDES).find((word) =>
    options.title.toLowerCase().includes(word),
  );
  return key ? ICON_OVERRIDES[key] : VARIANTS[options.variant ?? "danger"].icon;
}

const ConfirmContext = createContext<(options: ConfirmOptions) => Promise<ConfirmResult | null>>(
  async () => null,
);

export function useConfirm() {
  return useContext(ConfirmContext);
}

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [reason, setReason] = useState("");
  const resolver = useRef<((value: ConfirmResult | null) => void) | null>(null);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);

  const confirm = useCallback((next: ConfirmOptions) => {
    setOptions(next);
    setReason(next.reason?.defaultValue ?? "");
    return new Promise<ConfirmResult | null>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const close = useCallback((result: ConfirmResult | null) => {
    resolver.current?.(result);
    resolver.current = null;
    setOptions(null);
  }, []);

  // Escape cancels. Enter confirms, but not from inside the textarea, where a
  // newline is the expected behaviour.
  useEffect(() => {
    if (!options) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(null);
      }
      if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        confirmButtonRef.current?.click();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [options, close]);

  // Move focus into the dialog when it opens.
  useEffect(() => {
    if (options && !options.reason) confirmButtonRef.current?.focus();
  }, [options]);

  const value = useMemo(() => confirm, [confirm]);

  const variant = options?.variant ?? "danger";
  const style = VARIANTS[variant];
  const Icon = options ? iconFor(options) : Ban;
  const blocked = Boolean(options?.reason?.required && !reason.trim());

  return (
    <ConfirmContext.Provider value={value}>
      {children}

      <AnimatePresence>
        {options && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-[100] grid place-items-end bg-abyss/80 backdrop-blur-sm sm:place-items-center"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-title"
            onClick={(e) => {
              if (e.target === e.currentTarget) close(null);
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 28, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 18, scale: 0.98 }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
              className="popover relative w-full max-w-md overflow-hidden rounded-t-3xl pb-safe sm:rounded-3xl sm:pb-0"
            >
              {/* Variant accent along the top edge. */}
              <span
                aria-hidden="true"
                className="absolute inset-x-0 top-0 h-1"
                style={{
                  background: `linear-gradient(90deg, transparent, ${style.accent}, transparent)`,
                }}
              />
              {/* Bloom behind the icon. */}
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full opacity-35 blur-3xl"
                style={{ background: style.accent }}
              />

              <button
                type="button"
                onClick={() => close(null)}
                aria-label="Cancel"
                className="absolute right-4 top-4 z-10 grid h-9 w-9 place-items-center rounded-lg text-ink-faint transition-colors hover:bg-white/8 hover:text-ink"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="relative p-6 sm:p-7">
                <span
                  className="mb-4 grid h-14 w-14 place-items-center rounded-2xl ring-1"
                  style={{
                    background: `${style.accent}1f`,
                    color: style.accent,
                    boxShadow: `0 0 34px -8px ${style.accent}`,
                  }}
                >
                  <Icon className="h-6 w-6" />
                </span>

                {options.subject && <div className="mb-3">{options.subject}</div>}

                <h2
                  id="confirm-title"
                  className="font-display text-xl font-extrabold leading-tight tracking-tight sm:text-2xl"
                >
                  {options.title}
                </h2>

                {options.body && (
                  <p className="mt-2 text-sm leading-relaxed text-ink-muted">{options.body}</p>
                )}

                {options.reason && (
                  <label className="mt-5 block">
                    <span className="mb-1.5 flex items-baseline justify-between font-display text-[0.7rem] font-bold uppercase tracking-widest text-ink-muted">
                      {options.reason.label ?? "Reason"}
                      {!options.reason.required && (
                        <span className="font-sans font-normal normal-case tracking-normal text-ink-faint">
                          Optional
                        </span>
                      )}
                    </span>
                    <textarea
                      autoFocus
                      rows={3}
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      placeholder={options.reason.placeholder}
                      className="field resize-y text-sm leading-relaxed"
                    />
                    {options.reason.hint && (
                      <span className="mt-1.5 block text-[0.7rem] leading-relaxed text-ink-faint">
                        {options.reason.hint}
                      </span>
                    )}
                  </label>
                )}

                <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:justify-end">
                  <button
                    type="button"
                    onClick={() => close(null)}
                    className="btn-ghost inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm"
                  >
                    {options.cancelLabel ?? "Cancel"}
                  </button>
                  <button
                    ref={confirmButtonRef}
                    type="button"
                    disabled={blocked}
                    onClick={() => close({ reason: reason.trim() })}
                    className={cn(
                      "inline-flex h-11 items-center justify-center rounded-xl px-6 text-sm font-bold transition-all",
                      "disabled:cursor-not-allowed disabled:opacity-40",
                      style.button,
                    )}
                    style={{ boxShadow: `0 10px 26px -12px ${style.accent}` }}
                  >
                    {options.confirmLabel ?? "Confirm"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ConfirmContext.Provider>
  );
}
