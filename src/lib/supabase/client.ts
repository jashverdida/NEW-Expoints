"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client. Uses the anon key, so every query is subject to
 * RLS — the policies in schema.sql are what actually protect the data.
 *
 * Used for realtime subscriptions and avatar uploads. All *writes* that matter
 * go through server actions instead, so they can be validated and revalidated.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
