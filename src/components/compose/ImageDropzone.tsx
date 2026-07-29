"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { ImagePlus, Loader2, ShieldAlert, Trash2, UploadCloud } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

/**
 * Drag-and-drop image attachment.
 *
 * Three ways in, because people reach for different ones:
 *   · drag a file onto the box
 *   · click it — opens the file browser on desktop, the photo gallery on
 *     mobile (`accept="image/*"` is what makes iOS/Android offer the gallery
 *     and camera rather than a generic file list)
 *   · paste from the clipboard, which is how most screenshots arrive
 *
 * The upload goes straight from the browser to Supabase Storage, so the file
 * never passes through a server action — that keeps us clear of the 4MB body
 * limit and means a big image doesn't block the post from being written.
 * The resulting public URL rides along in a hidden input.
 */
export function ImageDropzone({
  name = "image_url",
  userId,
  defaultValue,
}: {
  name?: string;
  userId: string;
  defaultValue?: string | null;
}) {
  const { push } = useToast();
  const [url, setUrl] = useState<string | null>(defaultValue ?? null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const zoneRef = useRef<HTMLDivElement>(null);

  const upload = useCallback(
    async (file: File) => {
      if (!ACCEPTED.includes(file.type)) {
        push("That file type isn't supported. Use JPG, PNG, WebP, GIF or AVIF.", "error");
        return;
      }
      if (file.size > MAX_BYTES) {
        push(`Images must be under ${MAX_BYTES / 1024 / 1024} MB.`, "error");
        return;
      }

      setUploading(true);
      try {
        const supabase = createClient();
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
        // Path must start with the uploader's uid — the storage policy only
        // allows writes inside a folder matching auth.uid().
        const path = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

        const { error } = await supabase.storage
          .from("post-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (error) throw error;

        const {
          data: { publicUrl },
        } = supabase.storage.from("post-images").getPublicUrl(path);

        setUrl(publicUrl);
      } catch (error) {
        push(error instanceof Error ? error.message : "Upload failed.", "error");
      } finally {
        setUploading(false);
      }
    },
    [push, userId],
  );

  // Paste-to-attach. Scoped to when the composer is on screen rather than a
  // global listener, so it can't hijack a paste into the text fields.
  useEffect(() => {
    const onPaste = (event: ClipboardEvent) => {
      const item = Array.from(event.clipboardData?.items ?? []).find((i) =>
        i.type.startsWith("image/"),
      );
      if (!item) return;
      const file = item.getAsFile();
      if (file) {
        event.preventDefault();
        void upload(file);
      }
    };

    const node = zoneRef.current?.closest("form");
    node?.addEventListener("paste", onPaste as EventListener);
    return () => node?.removeEventListener("paste", onPaste as EventListener);
  }, [upload]);

  const onDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (file) void upload(file);
  };

  return (
    <div ref={zoneRef}>
      <span className="mb-1.5 flex items-center justify-between font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
        Image
        <span className="font-sans font-normal normal-case tracking-normal text-ink-faint">
          Optional
        </span>
      </span>

      {/* The value the form actually submits. */}
      <input type="hidden" name={name} value={url ?? ""} />

      {url ? (
        <figure className="group relative overflow-hidden rounded-2xl border border-brand-400/25">
          <Image
            src={url}
            alt="Attached preview"
            width={1200}
            height={675}
            className="max-h-80 w-full object-cover"
            unoptimized
          />

          <figcaption className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-3 bg-gradient-to-t from-void via-void/85 to-transparent px-4 pb-3 pt-8">
            <span className="flex items-center gap-1.5 text-[0.7rem] text-ink-muted">
              <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-exp" />
              An admin reviews every uploaded image.
            </span>
            <button
              type="button"
              onClick={() => setUrl(null)}
              className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-danger/40 bg-abyss/80 px-3 text-xs font-semibold text-danger backdrop-blur transition-colors hover:bg-danger/20"
            >
              <Trash2 className="h-3 w-3" />
              Remove
            </button>
          </figcaption>
        </figure>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          disabled={uploading}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed px-6 py-9 transition-all",
            dragging
              ? "scale-[1.01] border-brand-400 bg-brand-500/12"
              : "border-white/15 bg-white/[0.02] hover:border-brand-400/50 hover:bg-brand-500/6",
            uploading && "cursor-wait opacity-70",
          )}
        >
          <span
            className={cn(
              "grid h-11 w-11 place-items-center rounded-2xl transition-colors",
              dragging ? "bg-brand-500/25 text-brand-200" : "bg-white/6 text-ink-faint",
            )}
          >
            {uploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : dragging ? (
              <UploadCloud className="h-5 w-5" />
            ) : (
              <ImagePlus className="h-5 w-5" />
            )}
          </span>

          <span className="text-sm font-semibold text-ink">
            {uploading ? "Uploading…" : dragging ? "Drop it" : "Add an image"}
          </span>
          <span className="text-center text-xs leading-relaxed text-ink-faint">
            Drag one in, paste from your clipboard, or{" "}
            <span className="font-semibold text-brand-300">tap to browse</span>
            <br />
            JPG, PNG, WebP, GIF or AVIF · up to 5&nbsp;MB
          </span>
        </button>
      )}

      {/* accept="image/*" is what makes phones offer the gallery and camera
          instead of a generic document picker. */}
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) void upload(file);
          e.target.value = "";
        }}
      />
    </div>
  );
}
