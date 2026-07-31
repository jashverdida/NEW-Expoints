"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { useT } from "@/components/shell/PrefsProvider";
import { cn } from "@/lib/utils";

const FIELDS = [
  { value: "title", label: "Title" },
  { value: "content", label: "Body text" },
  { value: "author", label: "Author" },
] as const;

type Field = (typeof FIELDS)[number]["value"];

/**
 * Feed search with a field selector, carrying over the title/author/content
 * filter from the original dashboard.
 *
 * Submits by navigating — results are rendered on the server, so there's no
 * client-side result list to keep in sync and deep links are shareable.
 */
export function SearchBar({ className }: { className?: string }) {
  const router = useRouter();
  const params = useSearchParams();

  const [query, setQuery] = useState(params.get("q") ?? "");
  const [field, setField] = useState<Field>((params.get("field") as Field) ?? "title");
  const [menuOpen, setMenuOpen] = useState(false);
  const t = useT();
  const menuRef = useRef<HTMLDivElement>(null);

  // Keep the input in sync when the URL changes from elsewhere (e.g. back).
  useEffect(() => setQuery(params.get("q") ?? ""), [params]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [menuOpen]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/feed");
      return;
    }
    router.push(`/feed?q=${encodeURIComponent(trimmed)}&field=${field}`);
  };

  const clear = () => {
    setQuery("");
    router.push("/feed");
  };

  return (
    <form onSubmit={submit} className={cn("relative flex-1", className)}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />

      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("header.searchPlaceholder")}
        aria-label={t("header.searchLabel")}
        className="field h-11 !pl-10 pr-[7.5rem] text-sm [&::-webkit-search-cancel-button]:hidden"
      />

      <div className="absolute right-1.5 top-1/2 flex -translate-y-1/2 items-center gap-1">
        {query && (
          <button
            type="button"
            onClick={clear}
            aria-label="Clear search"
            className="rounded-lg p-1.5 text-ink-faint transition-colors hover:text-ink"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

        <div ref={menuRef} className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-haspopup="listbox"
            aria-expanded={menuOpen}
            className="flex h-8 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 text-[0.7rem] font-semibold text-ink-muted transition-colors hover:text-ink"
          >
            {FIELDS.find((f) => f.value === field)?.label}
            <ChevronDown className={cn("h-3 w-3 transition-transform", menuOpen && "rotate-180")} />
          </button>

          {menuOpen && (
            <div
              role="listbox"
              className="popover absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-xl p-1"
            >
              {FIELDS.map((f) => (
                <button
                  key={f.value}
                  type="button"
                  role="option"
                  aria-selected={field === f.value}
                  onClick={() => {
                    setField(f.value);
                    setMenuOpen(false);
                  }}
                  className={cn(
                    "block w-full rounded-lg px-3 py-2 text-left text-sm transition-colors",
                    field === f.value
                      ? "bg-brand-500/20 font-semibold text-brand-200"
                      : "text-ink-muted hover:bg-white/5 hover:text-ink",
                  )}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
