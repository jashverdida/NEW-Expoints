"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Camera, ImageIcon, Loader2, Save, Trash2 } from "lucide-react";
import { updateProfile } from "@/lib/actions";
import { createClient } from "@/lib/supabase/client";
import { Avatar } from "@/components/ui/Avatar";
import { useToast } from "@/components/ui/Toast";
import type { ActionResult, Profile } from "@/lib/types";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="btn-primary inline-flex h-12 items-center justify-center gap-2 rounded-xl px-7 font-display text-sm uppercase tracking-widest disabled:opacity-70"
    >
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
      Save changes
    </button>
  );
}

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
// Banners are wide, so they get more headroom than a square avatar.
const MAX_BANNER_BYTES = 4 * 1024 * 1024;

export function SettingsForm({ profile }: { profile: Profile }) {
  const { push } = useToast();
  const [state, action] = useActionState<ActionResult | null, FormData>(updateProfile, null);

  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url);
  const [bannerUrl, setBannerUrl] = useState(profile.banner_url);
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const bannerRef = useRef<HTMLInputElement>(null);
  const [bioLength, setBioLength] = useState(profile.bio?.length ?? 0);

  useEffect(() => {
    if (!state) return;
    push(state.ok ? (state.message ?? "Saved.") : state.error, state.ok ? "success" : "error");
  }, [state, push]);

  /**
   * Uploads straight from the browser to Supabase Storage, then stores the
   * resulting public URL with the rest of the form. The old flow POSTed the
   * image through PHP, which meant the whole file crossed the server twice.
   *
   * The path is prefixed with the user's uid because the storage RLS policy
   * only allows writes inside a folder matching auth.uid().
   */
  const handleUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    kind: "avatar" | "banner",
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const limit = kind === "banner" ? MAX_BANNER_BYTES : MAX_AVATAR_BYTES;

    if (!file.type.startsWith("image/")) {
      push("Pick an image file.", "error");
      return;
    }
    if (file.size > limit) {
      push(`${kind === "banner" ? "Banners" : "Avatars"} must be under ${limit / 1024 / 1024} MB.`, "error");
      return;
    }

    setUploading(kind);
    try {
      const supabase = createClient();
      const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
      // Path must start with the user's uid — the storage RLS policy only
      // permits writes inside a folder matching auth.uid().
      const path = `${profile.id}/${kind}-${Date.now()}.${ext}`;

      const { error } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, cacheControl: "3600" });

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(path);

      if (kind === "banner") setBannerUrl(publicUrl);
      else setAvatarUrl(publicUrl);

      push(`${kind === "banner" ? "Banner" : "Avatar"} uploaded. Save to apply it.`, "success");
    } catch (error) {
      push(error instanceof Error ? error.message : "Upload failed.", "error");
    } finally {
      setUploading(null);
      const ref = kind === "banner" ? bannerRef : fileRef;
      if (ref.current) ref.current.value = "";
    }
  };

  return (
    <form action={action} className="space-y-5">
      {/* Carry uploaded URLs through with the rest of the form. */}
      <input type="hidden" name="avatar_url" value={avatarUrl ?? ""} />
      <input type="hidden" name="banner_url" value={bannerUrl ?? ""} />

      {/* ── Banner + avatar ── */}
      <section className="glass overflow-hidden rounded-3xl">
        {/* Live preview: the banner with the avatar overlapping it, exactly how
            it renders on the profile page. */}
        <div className="relative">
          <div
            className="h-32 w-full sm:h-40"
            style={
              bannerUrl
                ? {
                    backgroundImage: `url(${bannerUrl})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }
                : {
                    background:
                      "linear-gradient(120deg, rgba(56,160,255,0.35), rgba(139,92,246,0.28) 55%, rgba(5,11,30,0.6))",
                  }
            }
          />
          <div className="absolute inset-0 bg-gradient-to-t from-void/80 to-transparent" />

          <button
            type="button"
            onClick={() => bannerRef.current?.click()}
            disabled={uploading !== null}
            className="absolute right-3 top-3 inline-flex h-9 items-center gap-2 rounded-xl border border-white/20 bg-abyss/70 px-3 text-xs font-semibold text-ink backdrop-blur transition-colors hover:border-brand-400/50 disabled:opacity-60"
          >
            {uploading === "banner" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <ImageIcon className="h-3.5 w-3.5" />
            )}
            {uploading === "banner" ? "Uploading…" : bannerUrl ? "Change banner" : "Add banner"}
          </button>

          {bannerUrl && (
            <button
              type="button"
              onClick={() => setBannerUrl(null)}
              className="absolute right-3 top-14 inline-flex h-9 items-center gap-2 rounded-xl border border-danger/40 bg-abyss/70 px-3 text-xs font-semibold text-danger backdrop-blur transition-colors hover:bg-danger/15"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Remove
            </button>
          )}

          <div className="absolute -bottom-10 left-5 sm:left-6">
            <Avatar
              username={profile.username}
              avatarUrl={avatarUrl}
              level={profile.level}
              size="xl"
            />
          </div>
        </div>

        <div className="px-5 pb-5 pt-14 sm:px-6 sm:pb-6">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={uploading !== null}
            className="btn-ghost inline-flex h-11 items-center gap-2 rounded-xl px-5 text-sm disabled:opacity-60"
          >
            {uploading === "avatar" ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Camera className="h-4 w-4" />
            )}
            {uploading === "avatar" ? "Uploading…" : "Change avatar"}
          </button>
          <p className="mt-2 text-xs text-ink-faint">
            Avatar: square, max 2 MB. Banner: wide (about 3:1), max 4 MB. JPG, PNG, GIF or WebP.
          </p>

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleUpload(e, "avatar")}
            className="hidden"
          />
          <input
            ref={bannerRef}
            type="file"
            accept="image/*"
            onChange={(e) => handleUpload(e, "banner")}
            className="hidden"
          />
        </div>
      </section>

      {/* ── Identity ── */}
      <section className="glass space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="rule-label mb-1">Identity</h2>

        <label className="block">
          <span className="mb-1.5 block font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
            Username
          </span>
          <div className="relative">
            <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 font-display font-bold text-ink-faint">
              @
            </span>
            <input
              name="username"
              defaultValue={profile.username}
              maxLength={24}
              pattern="[A-Za-z0-9_]{3,24}"
              className="field !pl-8"
            />
          </div>
          <span className="mt-1 block text-[0.7rem] text-ink-faint">
            Changing this changes your profile URL. Old links will stop working.
          </span>
        </label>

        <label className="block">
          <span className="mb-1.5 block font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
            Display name
          </span>
          <input
            name="display_name"
            defaultValue={profile.display_name ?? ""}
            maxLength={60}
            placeholder="What people see first"
            className="field"
          />
        </label>

        <label className="block">
          <span className="mb-1.5 flex items-baseline justify-between font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
            Bio
            <span className="stat font-normal normal-case tracking-normal text-ink-faint">
              {bioLength}/500
            </span>
          </span>
          <textarea
            name="bio"
            defaultValue={profile.bio ?? ""}
            rows={4}
            maxLength={500}
            onChange={(e) => setBioLength(e.target.value.length)}
            placeholder="Tell the forum what you play and what you think about it."
            className="field resize-y leading-relaxed"
          />
        </label>
      </section>

      {/* ── Gaming ── */}
      <section className="glass space-y-4 rounded-3xl p-5 sm:p-6">
        <h2 className="rule-label mb-1">Gaming</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
              Favourite game
            </span>
            <input
              name="favorite_game"
              defaultValue={profile.favorite_game ?? ""}
              maxLength={120}
              placeholder="Bloodborne"
              className="field"
            />
          </label>

          <label className="block">
            <span className="mb-1.5 block font-display text-[0.72rem] font-bold uppercase tracking-widest text-ink-muted">
              Favourite genre
            </span>
            <input
              name="favorite_genre"
              defaultValue={profile.favorite_genre ?? ""}
              maxLength={60}
              placeholder="Action RPG"
              className="field"
            />
          </label>
        </div>
      </section>

      <div className="flex justify-end">
        <Submit />
      </div>
    </form>
  );
}
