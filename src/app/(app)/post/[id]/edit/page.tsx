import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { EditPostForm } from "@/components/compose/EditPostForm";
import { getCurrentProfile, getPost } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Edit review",
  robots: { index: false, follow: false },
};

export default async function EditPostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const postId = Number(id);
  if (!Number.isFinite(postId)) notFound();

  const [post, viewer] = await Promise.all([getPost(postId), getCurrentProfile()]);
  if (!post) notFound();
  if (!viewer) redirect("/login");

  // Authors only. Admins can hide or delete from the post menu, but editing
  // someone else's words would misattribute them.
  if (viewer.id !== post.author_id) redirect(`/post/${postId}`);

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 sm:px-6">
      <Link
        href={`/post/${postId}`}
        className="group mb-5 inline-flex items-center gap-2 text-sm font-semibold text-ink-muted transition-colors hover:text-ink"
      >
        <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
        Back to review
      </Link>

      <header className="mb-6">
        <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
          <span className="text-gradient">Edit review</span>
        </h1>
        <p className="mt-2 text-sm text-ink-muted">
          Fix a typo, sharpen a take, or change your score.
        </p>
      </header>

      <EditPostForm post={post} />
    </div>
  );
}
