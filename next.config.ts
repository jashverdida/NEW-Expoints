import type { NextConfig } from "next";

const supabaseHost = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co")
      .hostname;
  } catch {
    return "placeholder.supabase.co";
  }
})();

const nextConfig: NextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      // Supabase Storage buckets (avatars, post art).
      { protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" },
      // Cover art pulled from the public IGDB/RAWG-style CDNs used by the game picker.
      { protocol: "https", hostname: "images.igdb.com" },
      { protocol: "https", hostname: "media.rawg.io" },
    ],
  },
  experimental: {
    // Keeps server actions usable behind Vercel's proxy without extra config.
    serverActions: { bodySizeLimit: "4mb" },
  },
};

export default nextConfig;
