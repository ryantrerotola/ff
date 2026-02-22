"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

interface ProfileComment {
  id: string;
  content: string;
  createdAt: string;
  flyPattern: { name: string; slug: string };
}

interface ProfilePost {
  id: string;
  title: string;
  createdAt: string;
}

interface SavedPatternItem {
  flyPattern: {
    id: string;
    name: string;
    slug: string;
    category: string;
    difficulty: string;
  };
}

interface UserProfile {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
  _count: {
    comments: number;
    likes: number;
    forumPosts: number;
    submittedPatterns: number;
  };
  comments: ProfileComment[];
  forumPosts: ProfilePost[];
  savedPatterns: SavedPatternItem[];
}

export default function ProfilePage() {
  const params = useParams<{ username: string }>();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${params.username}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));
  }, [params.username]);

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-20 w-20 rounded-full bg-gray-200" />
          <div className="h-6 w-48 rounded bg-gray-200" />
          <div className="h-4 w-32 rounded bg-gray-200" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg text-gray-500">User not found.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
          {(profile.displayName || profile.username)[0]?.toUpperCase()}
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {profile.displayName || profile.username}
          </h1>
          <p className="text-sm text-gray-500">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-2 text-sm text-gray-700">{profile.bio}</p>
          )}
          <p className="mt-1 text-xs text-gray-400">
            Joined {new Date(profile.createdAt).toLocaleDateString()}
          </p>
          <Link
            href={`/messages/${profile.id}`}
            className="mt-2 inline-block rounded-md bg-brand-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-700"
          >
            Message
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-4 gap-4 rounded-lg border border-gray-200 p-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {profile._count.comments}
          </div>
          <div className="text-xs text-gray-500">Comments</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {profile._count.likes}
          </div>
          <div className="text-xs text-gray-500">Likes</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {profile._count.forumPosts}
          </div>
          <div className="text-xs text-gray-500">Posts</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">
            {profile._count.submittedPatterns}
          </div>
          <div className="text-xs text-gray-500">Patterns</div>
        </div>
      </div>

      {/* Saved Patterns */}
      {profile.savedPatterns.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Saved Patterns
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {profile.savedPatterns.map((sp) => (
              <Link
                key={sp.flyPattern.id}
                href={`/patterns/${sp.flyPattern.slug}`}
                className="rounded-md border border-gray-200 p-3 hover:border-brand-300 hover:bg-brand-50"
              >
                <div className="text-sm font-medium text-gray-900">
                  {sp.flyPattern.name}
                </div>
                <div className="mt-1 text-xs capitalize text-gray-500">
                  {sp.flyPattern.category} &middot; {sp.flyPattern.difficulty}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Recent Comments */}
      {profile.comments.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">
            Recent Comments
          </h2>
          <div className="mt-3 space-y-3">
            {profile.comments.map((c) => (
              <div key={c.id} className="rounded-md border border-gray-200 p-3">
                <Link
                  href={`/patterns/${c.flyPattern.slug}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  {c.flyPattern.name}
                </Link>
                <p className="mt-1 text-sm text-gray-700 line-clamp-2">
                  {c.content}
                </p>
                <p className="mt-1 text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Recent Forum Posts */}
      {profile.forumPosts.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900">Forum Posts</h2>
          <div className="mt-3 space-y-2">
            {profile.forumPosts.map((post) => (
              <Link
                key={post.id}
                href={`/forum/${post.id}`}
                className="block rounded-md border border-gray-200 p-3 hover:border-brand-300"
              >
                <div className="text-sm font-medium text-gray-900">
                  {post.title}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(post.createdAt).toLocaleDateString()}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
