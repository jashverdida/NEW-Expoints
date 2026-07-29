"use client";

import Image from "next/image";
import { Linkedin, Mail } from "lucide-react";

export interface Dev {
  name: string;
  role: string;
  /** Second line under the role — the specifics of what they own. */
  focus: string;
  email: string;
  linkedin: string;
  photo: string;
  /** Accent colour; drives the glow, rings and role text. */
  accent: string;
  accentSoft: string;
}

/*
 * LAYOUT
 * The portrait deliberately breaks out above the card instead of sitting
 * inside it — the previous version clipped the tops of everyone's heads,
 * because the stage had overflow-hidden and the image was taller than it.
 *
 * The geometry:
 *   mt-28        6.5rem of clear space above the card for the overflow
 *   stage h-44   11rem tall, clips only the rings and bloom
 *   portrait     -top-28 → bottom of stage, so it spans that space plus the
 *                stage and lands exactly on the stage's lower edge
 *
 * The card itself keeps overflow-visible so nothing clips the portrait; only
 * the inner stage clips, which is what keeps the rotating rings tidy.
 */
const OVERHANG = "-top-28";

export function DevCard({ dev }: { dev: Dev }) {
  return (
    <article
      className="group relative mt-28 flex flex-col rounded-3xl border bg-void/40 backdrop-blur-sm transition-all duration-500"
      style={{
        borderColor: `${dev.accent}26`,
        boxShadow: `0 20px 55px -32px ${dev.accent}`,
      }}
    >
      {/*
        Accent bar along the top edge.

        z-10 keeps it BELOW the portrait (z-20) on purpose: the figure should
        occlude the line where they overlap, which is what sells the effect of
        standing in front of the card. At z-30 it drew straight across
        everyone's face.
      */}
      <span
        aria-hidden="true"
        className="absolute inset-x-0 top-0 z-10 h-[3px] rounded-t-3xl opacity-70 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, ${dev.accent}, transparent)` }}
      />

      {/* ── Stage: bloom + rings, clipped to the card ── */}
      <div className="relative h-44 overflow-hidden rounded-t-3xl">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 h-56 w-56 -translate-x-1/2 -translate-y-1/2 rounded-full opacity-30 blur-3xl transition-all duration-700 group-hover:scale-125 group-hover:opacity-75"
          style={{ background: dev.accent }}
        />

        {/* Two rings turning opposite ways — one spinning element reads as a
            loading spinner; two opposed reads as deliberate. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <svg
            viewBox="0 0 200 200"
            className="h-60 w-60 opacity-25 transition-all duration-700 group-hover:scale-110 group-hover:opacity-60"
            style={{ color: dev.accent, animation: "dev-spin 24s linear infinite" }}
            fill="none"
            stroke="currentColor"
          >
            <polygon points="100,10 178,55 178,145 100,190 22,145 22,55" strokeWidth="1.5" />
            <circle cx="100" cy="100" r="72" strokeWidth="0.75" strokeDasharray="5 9" />
          </svg>
        </span>
        <span
          aria-hidden="true"
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        >
          <svg
            viewBox="0 0 200 200"
            className="h-44 w-44 opacity-20 transition-all duration-700 group-hover:scale-125 group-hover:opacity-50"
            style={{ color: dev.accentSoft, animation: "dev-spin-reverse 18s linear infinite" }}
            fill="none"
            stroke="currentColor"
          >
            <polygon points="100,25 165,100 100,175 35,100" strokeWidth="1.25" />
          </svg>
        </span>
      </div>

      {/*
        ── Portrait ──
        Sits outside the clipped stage and above it in the stacking order, so
        heads and shoulders rise clear of the card's top edge. object-bottom
        anchors the figure so it grows upward on hover rather than drifting.
        The mask feathers the lower edge into the card.
      */}
      <div
        className={`pointer-events-none absolute inset-x-0 ${OVERHANG} z-20 bottom-[calc(100%-11rem)] flex justify-center`}
      >
        <Image
          src={dev.photo}
          alt={dev.name}
          width={640}
          height={790}
          className="h-full w-auto object-contain object-bottom transition-transform duration-700 ease-out group-hover:scale-[1.07]"
          style={{
            filter: `drop-shadow(0 14px 30px ${dev.accent}66)`,
            maskImage: "linear-gradient(180deg, #000 86%, transparent 99%)",
            WebkitMaskImage: "linear-gradient(180deg, #000 86%, transparent 99%)",
          }}
        />
      </div>

      {/* ── Details ──
          z-30 so the name and buttons always sit above the portrait, whose
          masked lower edge extends into this area. */}
      <div className="relative z-30 flex flex-1 flex-col px-5 pb-5 text-center">
        <h3 className="font-display text-lg font-extrabold tracking-tight">{dev.name}</h3>

        <p
          className="mt-1 font-display text-[0.68rem] font-bold uppercase tracking-[0.16em]"
          style={{ color: dev.accent }}
        >
          {dev.role}
        </p>

        <p className="mt-2 text-xs leading-relaxed text-ink-muted">{dev.focus}</p>

        {/*
          mt-auto on the email pushes it and the buttons to the bottom of the
          card. The grid already stretches all three cards to match the tallest,
          but the bios differ by a line, so without this the shorter cards left
          their buttons floating mid-card and nothing lined up along the base.
        */}
        <a
          href={`mailto:${dev.email}`}
          className="mt-auto block truncate pt-3 text-[0.7rem] text-ink-faint transition-colors hover:text-ink-muted"
        >
          {dev.email}
        </a>

        <div className="mt-3 flex gap-2">
          <a
            href={`mailto:${dev.email}`}
            className="btn-ghost inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-semibold"
          >
            <Mail className="h-3.5 w-3.5" />
            Email
          </a>
          <a
            href={dev.linkedin}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-10 flex-1 items-center justify-center gap-1.5 rounded-xl text-xs font-bold text-[#04121f] transition-transform hover:-translate-y-0.5"
            style={{
              background: `linear-gradient(135deg, ${dev.accentSoft}, ${dev.accent})`,
              boxShadow: `0 8px 22px -10px ${dev.accent}`,
            }}
          >
            <Linkedin className="h-3.5 w-3.5" />
            LinkedIn
          </a>
        </div>
      </div>
    </article>
  );
}
