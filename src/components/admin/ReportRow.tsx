"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { Check, ExternalLink, Loader2, X } from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import { resolveReport } from "@/lib/actions";
import type { Report } from "@/lib/types";
import { timeAgo } from "@/lib/utils";

export function ReportRow({ report }: { report: Report }) {
  const router = useRouter();
  const { push } = useToast();
  const [pending, startTransition] = useTransition();

  const act = (status: "resolved" | "dismissed") => {
    startTransition(async () => {
      const result = await resolveReport(report.id, status);
      push(result.ok ? (result.message ?? "Done.") : result.error, result.ok ? "success" : "error");
      if (result.ok) router.refresh();
    });
  };

  return (
    <li className="glass rounded-2xl p-4 sm:px-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold leading-snug">{report.reason}</p>
          <p className="mt-1 text-xs text-ink-faint">
            Reported {timeAgo(report.created_at)}
            {report.post_id && " · on a review"}
            {report.comment_id && " · on a comment"}
          </p>
        </div>

        {report.post_id && (
          <Link
            href={`/post/${report.post_id}`}
            className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-ink-muted transition-colors hover:border-brand-400/40 hover:text-brand-300"
          >
            <ExternalLink className="h-3 w-3" />
            View
          </Link>
        )}
      </div>

      <div className="mt-3.5 flex gap-2">
        <button
          type="button"
          onClick={() => act("resolved")}
          disabled={pending}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-success/30 bg-success/10 px-3 text-xs font-semibold text-success transition-colors hover:bg-success/20 disabled:opacity-50 sm:flex-none"
        >
          {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Mark resolved
        </button>

        <button
          type="button"
          onClick={() => act("dismissed")}
          disabled={pending}
          className="inline-flex h-9 flex-1 items-center justify-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.04] px-3 text-xs font-semibold text-ink-muted transition-colors hover:text-ink disabled:opacity-50 sm:flex-none"
        >
          <X className="h-3.5 w-3.5" />
          Dismiss
        </button>
      </div>
    </li>
  );
}
