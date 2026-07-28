import Image from "next/image";

/**
 * The vertical box-art rail pinned to the right edge of the landing page —
 * restored from the original EXPoints design, where it was a signature piece of
 * the front page.
 *
 * Implementation notes:
 *  - The two source PNGs were 3.8MB and 6.9MB of mostly black padding. They're
 *    now trimmed, cropped to a single column and re-encoded as WebP (~95KB and
 *    ~118KB), so the rail costs about 3% of what it used to.
 *  - The track holds the pair twice and translates -50%, which puts the loop
 *    seam exactly on the duplicate and makes it invisible.
 *  - Masked top and bottom so the strip dissolves into the page instead of
 *    ending on a hard edge.
 *  - Decorative only: aria-hidden, and hidden below xl where there's no room
 *    for it beside the content.
 */
export function BoxArtRail() {
  const strips = [
    { src: "/brand/boxart-a.webp", height: 1480 },
    { src: "/brand/boxart-b.webp", height: 1611 },
  ];

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed right-5 top-4 z-20 hidden h-[calc(100dvh-2rem)] w-[178px] xl:block"
    >
      <div className="relative h-full overflow-hidden rounded-2xl border border-brand-300/15 bg-void/60 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.9)]">
        {/* Fades the strip into the background at both ends. */}
        <div
          className="absolute inset-0 z-10"
          style={{
            background:
              "linear-gradient(180deg, rgba(3,6,15,0.95) 0%, transparent 14%, transparent 86%, rgba(3,6,15,0.95) 100%)",
          }}
        />
        {/* Blue wash keeps the covers on-palette instead of clashing. */}
        <div className="absolute inset-0 z-10 bg-royal/25 mix-blend-color" />

        <div className="animate-boxart-scroll flex w-full flex-col">
          {[0, 1].map((pass) =>
            strips.map((strip) => (
              <Image
                key={`${pass}-${strip.src}`}
                src={strip.src}
                alt=""
                width={420}
                height={strip.height}
                priority={pass === 0}
                className="w-full shrink-0 opacity-90"
              />
            )),
          )}
        </div>
      </div>
    </div>
  );
}
