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
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/users/${params.username}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json();
      })
      .then((data) => {
        setProfile(data);
        // Fetch follow state
        fetch(`/api/follow?userId=${data.id}`)
          .then((r) => r.json())
          .then((f) => {
            setFollowerCount(f.followersCount ?? 0);
            setFollowingCount(f.followingCount ?? 0);
            setIsFollowing(f.isFollowing ?? false);
          });
      })
      .catch(() => setProfile(null))
      .finally(() => setLoading(false));

    // Get current user
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : { user: null }))
      .then((data) => setCurrentUserId(data.user?.id ?? null));
  }, [params.username]);

  async function toggleFollow() {
    if (!profile) return;
    setFollowLoading(true);
    const res = await fetch("/api/follow", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: profile.id }),
    });
    if (res.ok) {
      const data = await res.json();
      setIsFollowing(data.isFollowing);
      setFollowerCount((c) => c + (data.isFollowing ? 1 : -1));
    }
    setFollowLoading(false);
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="animate-pulse space-y-4">
          <div className="h-20 w-20 rounded-full bg-gray-200 dark:bg-gray-700" />
          <div className="h-6 w-48 rounded bg-gray-200 dark:bg-gray-700" />
          <div className="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-16 text-center">
        <p className="text-lg text-gray-500 dark:text-gray-400">User not found.</p>
      </div>
    );
  }

  const isOwnProfile = currentUserId === profile.id;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-100 text-2xl font-bold text-brand-700">
          {(profile.displayName || profile.username)[0]?.toUpperCase()}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {profile.displayName || profile.username}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">@{profile.username}</p>
          {profile.bio && (
            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{profile.bio}</p>
          )}
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            Joined {new Date(profile.createdAt).toLocaleDateString()}
          </p>
          <div className="mt-3 flex items-center gap-3">
            {!isOwnProfile && (
              <>
                <button
                  onClick={toggleFollow}
                  disabled={followLoading}
                  className={`rounded-md px-4 py-1.5 text-sm font-medium transition ${
                    isFollowing
                      ? "border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                      : "bg-brand-600 text-white hover:bg-brand-700"
                  } disabled:opacity-50`}
                >
                  {isFollowing ? "Following" : "Follow"}
                </button>
                <Link
                  href={`/messages/${profile.id}`}
                  className="rounded-md border border-gray-300 dark:border-gray-600 px-4 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  Message
                </Link>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:grid-cols-6">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">{followerCount}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Followers</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">{followingCount}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Following</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {profile._count.comments}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Comments</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {profile._count.likes}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Likes</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {profile._count.forumPosts}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Posts</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            {profile._count.submittedPatterns}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Patterns</div>
        </div>
      </div>

      {/* Saved Patterns */}
      {profile.savedPatterns.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Saved Patterns
          </h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {profile.savedPatterns.map((sp) => (
              <Link
                key={sp.flyPattern.id}
                href={`/patterns/${sp.flyPattern.slug}`}
                className="rounded-md border border-gray-200 dark:border-gray-700 p-3 hover:border-brand-300 hover:bg-brand-50"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {sp.flyPattern.name}
                </div>
                <div className="mt-1 text-xs capitalize text-gray-500 dark:text-gray-400">
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Recent Comments
          </h2>
          <div className="mt-3 space-y-3">
            {profile.comments.map((c) => (
              <div key={c.id} className="rounded-md border border-gray-200 dark:border-gray-700 p-3">
                <Link
                  href={`/patterns/${c.flyPattern.slug}`}
                  className="text-sm font-medium text-brand-600 hover:text-brand-700"
                >
                  {c.flyPattern.name}
                </Link>
                <p className="mt-1 text-sm text-gray-700 dark:text-gray-300 line-clamp-2">
                  {c.content}
                </p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Forum Posts</h2>
          <div className="mt-3 space-y-2">
            {profile.forumPosts.map((post) => (
              <Link
                key={post.id}
                href={`/forum/${post.id}`}
                className="block rounded-md border border-gray-200 dark:border-gray-700 p-3 hover:border-brand-300"
              >
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {post.title}
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500">
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
