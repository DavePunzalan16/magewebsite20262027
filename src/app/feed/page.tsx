"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";
import { siteConfig } from "@/data/portfolio";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import {
  Heart, MessageCircle, Share2, Bookmark, Send, ImageIcon,
  MoreHorizontal, Trash2, EyeOff, Pin, ArrowLeft, X,
} from "lucide-react";

interface FeedPost {
  id: number;
  user_id: string;
  content: string;
  image_url: string | null;
  category: string;
  is_pinned: boolean;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null };
  reactions: number;
  comments: number;
  shares: number;
  userReacted: boolean;
  userBookmarked: boolean;
}

interface CommentItem {
  id: number;
  content: string;
  created_at: string;
  profiles?: { full_name: string | null; avatar_url: string | null };
}

const categories = ["All", "General", "Artwork", "Gaming", "Anime", "Meme", "Announcement"];

const fallbackPosts: FeedPost[] = [
  { id: 901, user_id: "", content: "🎉 Welcome to the M.A.G.E. Guild Feed! This is your space to share thoughts, art, memes, and connect with fellow guild members. Cast your passion!", image_url: null, category: "announcement", is_pinned: true, created_at: "2026-07-04T10:00:00Z", profiles: { full_name: "Guild Master", avatar_url: null }, reactions: 24, comments: 8, shares: 3, userReacted: false, userBookmarked: false },
  { id: 902, user_id: "", content: "Just finished a pixel art version of our guild emblem! ⚔️🎨 What do you guys think? Took me about 3 hours.", image_url: "/images/mageicon.jpg", category: "artwork", is_pinned: false, created_at: "2026-07-03T15:30:00Z", profiles: { full_name: "ArtMage", avatar_url: null }, reactions: 18, comments: 6, shares: 2, userReacted: false, userBookmarked: false },
  { id: 903, user_id: "", content: "Anyone up for a Valorant 5v5 tonight? Guild members only custom match! Drop a ❤️ if you're in. 🎮", image_url: null, category: "gaming", is_pinned: false, created_at: "2026-07-03T12:00:00Z", profiles: { full_name: "GamerNigel", avatar_url: null }, reactions: 31, comments: 12, shares: 1, userReacted: false, userBookmarked: false },
  { id: 904, user_id: "", content: "The new season of Jujutsu Kaisen hits different. No spoilers but episode 5 had me screaming 🤯🔥", image_url: null, category: "anime", is_pinned: false, created_at: "2026-07-02T20:00:00Z", profiles: { full_name: "AnimeFan", avatar_url: null }, reactions: 45, comments: 19, shares: 5, userReacted: false, userBookmarked: false },
  { id: 905, user_id: "", content: "When the professor says 'no homework' but gives a surprise quiz instead 💀😂 #UECaloocanMoments", image_url: null, category: "meme", is_pinned: false, created_at: "2026-07-02T14:00:00Z", profiles: { full_name: "MemeLord", avatar_url: null }, reactions: 67, comments: 23, shares: 8, userReacted: false, userBookmarked: false },
  { id: 906, user_id: "", content: "📢 REMINDER: Monthly meeting this Wednesday 5PM at AVR Room 2. Attendance is required for all members!", image_url: null, category: "announcement", is_pinned: false, created_at: "2026-07-01T09:00:00Z", profiles: { full_name: "Secretary Rose", avatar_url: null }, reactions: 12, comments: 4, shares: 1, userReacted: false, userBookmarked: false },
  { id: 907, user_id: "", content: "Working on cosplay props for Arcane Convergence 2026! Going as Raiden Shogun ⚡ Any other cosplayers in the guild?", image_url: null, category: "general", is_pinned: false, created_at: "2026-06-30T18:00:00Z", profiles: { full_name: "CosplayQueen", avatar_url: null }, reactions: 28, comments: 9, shares: 2, userReacted: false, userBookmarked: false },
  { id: 908, user_id: "", content: "One Piece chapter 1120 discussion thread! 🏴‍☠️ What are your theories about the final saga? No spoilers for anime-only watchers please!", image_url: null, category: "anime", is_pinned: false, created_at: "2026-06-29T21:00:00Z", profiles: { full_name: "PirateKing", avatar_url: null }, reactions: 39, comments: 27, shares: 4, userReacted: false, userBookmarked: false },
];

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [activeCategory, setActiveCategory] = useState("All");
  const [newPost, setNewPost] = useState("");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postPreview, setPostPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, CommentItem[]>>({});
  const [commentText, setCommentText] = useState("");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Realtime: new posts appear without refresh
  useRealtimeFeed({
    onNewPost: useCallback((newPost: Record<string, unknown>) => {
      setPosts((prev) => {
        // Deduplicate
        if (prev.some((p) => p.id === newPost.id)) return prev;
        return [{ ...newPost, reactions: 0, comments: 0, shares: 0, userReacted: false, userBookmarked: false } as FeedPost, ...prev];
      });
    }, []),
    onReactionChange: useCallback((_reaction: Record<string, unknown>, event: "INSERT" | "DELETE") => {
      const postId = _reaction.post_id as number;
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, reactions: p.reactions + (event === "INSERT" ? 1 : -1) } : p));
    }, []),
    enabled: true,
  });

  // Fetch posts
  const fetchPosts = useCallback(async (reset = false) => {
    const newOffset = reset ? 0 : offset;
    const cat = activeCategory === "All" ? "" : activeCategory.toLowerCase();

    try {
      // Direct Supabase query (more reliable than API route with RLS)
      const supabase = createClient();
      let query = supabase.from("posts").select("*, profiles(full_name, avatar_url)")
        .eq("is_hidden", false)
        .order("is_pinned", { ascending: false })
        .order("created_at", { ascending: false })
        .range(newOffset, newOffset + 14);

      if (cat) query = query.eq("category", cat);

      const { data } = await query;

      if (data && data.length > 0) {
        const enriched = data.map((p) => ({ ...p, reactions: 0, comments: 0, shares: 0, userReacted: false, userBookmarked: false }));
        setPosts((prev) => reset ? enriched : [...prev, ...enriched]);
        setHasMore(data.length >= 15);
        setOffset(newOffset + data.length);
      } else if (reset) {
        // Show fallback welcome posts if DB is empty
        setPosts(fallbackPosts);
        setHasMore(false);
      }
    } catch {
      if (reset) setPosts(fallbackPosts);
    }
    setLoading(false);
  }, [offset, activeCategory]);

  useEffect(() => { fetchPosts(true); }, [activeCategory]);

  // Infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !loading && hasMore) fetchPosts();
    }, { threshold: 0.5 });
    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loading, fetchPosts]);

  // Post
  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    setPosting(true);

    let imageUrl: string | null = null;
    if (postFile) imageUrl = await uploadFile(postFile, "feed");

    const supabase = createClient();
    const { data } = await supabase.from("posts").insert({
      user_id: user.id, content: newPost, image_url: imageUrl, category: "general",
    }).select("*, profiles(full_name, avatar_url)").single();

    if (data) {
      setPosts((prev) => [{ ...data, reactions: 0, comments: 0, shares: 0, userReacted: false, userBookmarked: false }, ...prev]);
    }
    setNewPost(""); setPostFile(null); setPostPreview(null); setPosting(false);
  };

  // React
  const handleReact = async (postId: number) => {
    if (!user) return;
    // Optimistic update
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, userReacted: !p.userReacted, reactions: p.reactions + (p.userReacted ? -1 : 1) } : p));
    // Persist
    try {
      const supabase = createClient();
      const { data: existing } = await supabase.from("reactions").select("id").eq("post_id", postId).eq("user_id", user.id).single();
      if (existing) { await supabase.from("reactions").delete().eq("id", existing.id); }
      else { await supabase.from("reactions").insert({ post_id: postId, user_id: user.id, emoji: "❤️" }); }
    } catch {}
  };

  // Bookmark
  const handleBookmark = async (postId: number) => {
    if (!user) return;
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, userBookmarked: !p.userBookmarked } : p));
    try {
      const supabase = createClient();
      const { data } = await supabase.from("bookmarks").select("id").eq("post_id", postId).eq("user_id", user.id).single();
      if (data) { await supabase.from("bookmarks").delete().eq("id", data.id); }
      else { await supabase.from("bookmarks").insert({ post_id: postId, user_id: user.id }); }
    } catch {}
  };

  // Comment
  const handleComment = async (postId: number) => {
    if (!commentText.trim() || !user) return;
    const supabase = createClient();
    const { data } = await supabase.from("comments").insert({ post_id: postId, user_id: user.id, content: commentText })
      .select("*, profiles(full_name, avatar_url)").single();
    if (data) {
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), data] }));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
    }
    setCommentText("");
  };

  // Load comments
  const loadComments = async (postId: number) => {
    if (comments[postId]) return;
    const supabase = createClient();
    const { data } = await supabase.from("comments").select("*, profiles(full_name, avatar_url)")
      .eq("post_id", postId).eq("is_hidden", false).order("created_at", { ascending: true }).limit(30);
    if (data) setComments((prev) => ({ ...prev, [postId]: data }));
  };

  // Delete
  const handleDelete = async (postId: number) => {
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setMenuOpen(null);
  };

  // Share
  const handleShare = (post: FeedPost) => {
    if (navigator.share) navigator.share({ title: "M.A.G.E. Post", text: post.content.slice(0, 100), url: window.location.href });
    else navigator.clipboard.writeText(post.content);
    setPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, shares: p.shares + 1 } : p));
    if (user) {
      try {
        const supabase = createClient();
        supabase.from("shares").insert({ post_id: post.id, user_id: user.id });
      } catch {}
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-dark-gray/20 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[650px] items-center gap-3 px-4">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-offwhite hover:text-white"><ArrowLeft className="h-4 w-4" /></Link>
          <Image src={siteConfig.iconImage} alt="" width={24} height={24} className="rounded-full" />
          <h1 className="font-display text-[20px] text-white">Guild Feed</h1>
        </div>
      </div>

      <div className="mx-auto max-w-[650px] px-4 py-5">
        {/* Composer */}
        {user && (
          <div className="mb-5 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
            <textarea value={newPost} onChange={(e) => setNewPost(e.target.value)} placeholder="Share something with the guild..." rows={2}
              className="w-full resize-none bg-transparent font-body text-[13px] text-white placeholder:text-offwhite/30 focus:outline-none" />
            {postPreview && (
              <div className="relative mt-2 inline-block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={postPreview} alt="" className="h-20 w-auto rounded-[6px] object-cover" />
                <button onClick={() => { setPostFile(null); setPostPreview(null); }} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[9px] text-white">×</button>
              </div>
            )}
            <div className="mt-2 flex items-center justify-between border-t border-dark-gray/20 pt-2">
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 rounded px-2 py-1 font-body text-[11px] text-offwhite/40 hover:text-offwhite" type="button">
                <ImageIcon className="h-3.5 w-3.5" /> Photo
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPostFile(f); setPostPreview(URL.createObjectURL(f)); } }} className="hidden" />
              <button onClick={handlePost} disabled={!newPost.trim() || posting} className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 font-body text-[11px] font-bold text-black disabled:opacity-40">
                <Send className="h-3 w-3" /> {posting ? "..." : "Post"}
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
          {categories.map((c) => (
            <button key={c} onClick={() => { setActiveCategory(c); setOffset(0); setLoading(true); }}
              className={`shrink-0 rounded-full px-3 py-1 font-body text-[11px] font-medium transition-all ${activeCategory === c ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-surface/30 text-offwhite/40 hover:text-offwhite"}`}>
              {c}
            </button>
          ))}
        </div>

        {/* Posts */}
        {loading && posts.length === 0 ? (
          <div className="flex flex-col gap-4">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-[12px] bg-surface/30" />)}</div>
        ) : posts.length === 0 ? (
          <p className="py-10 text-center font-body text-[13px] text-offwhite/40">No posts yet. Be the first to share!</p>
        ) : (
          <div className="flex flex-col gap-4">
            {posts.map((post) => (
              <article key={post.id} className="rounded-[12px] border border-dark-gray/30 bg-surface/20 overflow-hidden">
                {post.is_pinned && <div className="flex items-center gap-1.5 bg-primary/5 px-4 py-1 border-b border-dark-gray/20"><Pin className="h-3 w-3 text-primary" /><span className="font-body text-[9px] font-bold uppercase tracking-wider text-primary">Pinned</span></div>}
                <div className="p-4">
                  {/* Author */}
                  <div className="mb-2.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-body text-[11px] font-bold text-primary">
                        {(post.profiles?.full_name || "M").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-body text-[12px] font-semibold text-white">{post.profiles?.full_name || "Guild Member"}</p>
                        <p className="font-body text-[9px] text-offwhite/35">{new Date(post.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })} · <span className="capitalize">{post.category}</span></p>
                      </div>
                    </div>
                    <div className="relative">
                      <button onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)} className="rounded-full p-1 text-offwhite/20 hover:text-offwhite"><MoreHorizontal className="h-4 w-4" /></button>
                      {menuOpen === post.id && (
                        <div className="absolute right-0 top-full z-10 mt-1 w-32 rounded-[8px] border border-dark-gray/30 bg-[#0c0015] p-1 shadow-lg">
                          {(user?.id === post.user_id || user?.email === "admin@gmail.com") && <button onClick={() => handleDelete(post.id)} className="flex w-full items-center gap-2 rounded px-2 py-1 font-body text-[11px] text-red-400 hover:bg-red-500/10"><Trash2 className="h-3 w-3" />Delete</button>}
                          <button onClick={() => setMenuOpen(null)} className="flex w-full items-center gap-2 rounded px-2 py-1 font-body text-[11px] text-offwhite/50 hover:bg-white/5"><EyeOff className="h-3 w-3" />Hide</button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <p className="mb-3 font-body text-[13px] leading-relaxed text-offwhite/85 whitespace-pre-wrap">{post.content}</p>
                  {post.image_url && <div className="mb-3 overflow-hidden rounded-[8px] border border-dark-gray/20">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={post.image_url} alt="" className="w-full max-h-[350px] object-cover" loading="lazy" />
                  </div>}

                  {/* Actions */}
                  <div className="flex items-center gap-1 border-t border-dark-gray/20 pt-2.5">
                    <button onClick={() => handleReact(post.id)} className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[11px] transition-all ${post.userReacted ? "bg-red-500/10 text-red-400" : "text-offwhite/35 hover:text-offwhite"}`}>
                      <Heart className={`h-3.5 w-3.5 ${post.userReacted ? "fill-current" : ""}`} />{post.reactions || ""}
                    </button>
                    <button onClick={() => { setExpandedComments(expandedComments === post.id ? null : post.id); loadComments(post.id); }} className="flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[11px] text-offwhite/35 hover:text-offwhite">
                      <MessageCircle className="h-3.5 w-3.5" />{post.comments || ""}
                    </button>
                    <button onClick={() => handleShare(post)} className="flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[11px] text-offwhite/35 hover:text-offwhite">
                      <Share2 className="h-3.5 w-3.5" />{post.shares || ""}
                    </button>
                    <button onClick={() => handleBookmark(post.id)} className={`ml-auto rounded-full px-2.5 py-1 ${post.userBookmarked ? "text-primary" : "text-offwhite/25 hover:text-offwhite"}`}>
                      <Bookmark className={`h-3.5 w-3.5 ${post.userBookmarked ? "fill-current" : ""}`} />
                    </button>
                  </div>

                  {/* Comments */}
                  {expandedComments === post.id && (
                    <div className="mt-3 border-t border-dark-gray/20 pt-3">
                      {(comments[post.id] || []).map((c) => (
                        <div key={c.id} className="mb-2 flex gap-2">
                          <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-surface font-body text-[9px] text-offwhite/50">{(c.profiles?.full_name || "?").charAt(0)}</div>
                          <div className="rounded-[6px] bg-background/30 px-2.5 py-1.5">
                            <p className="font-body text-[10px] font-semibold text-offwhite/70">{c.profiles?.full_name || "Member"}</p>
                            <p className="font-body text-[11px] text-offwhite/60">{c.content}</p>
                          </div>
                        </div>
                      ))}
                      {user && (
                        <div className="mt-2 flex gap-2">
                          <input type="text" value={commentText} onChange={(e) => setCommentText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                            placeholder="Comment..." className="flex-1 rounded-full border border-dark-gray/30 bg-background/30 px-3 py-1.5 font-body text-[11px] text-white placeholder:text-offwhite/20 focus:border-primary/30 focus:outline-none" />
                          <button onClick={() => handleComment(post.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30"><Send className="h-3 w-3" /></button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            ))}

            {/* Load more trigger */}
            {hasMore && <div ref={loadMoreRef} className="h-10 flex items-center justify-center"><div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>}
          </div>
        )}

        {!user && !authLoading && (
          <div className="mt-6 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5 text-center">
            <p className="font-body text-[13px] text-offwhite/50">Sign in to post, react, and comment.</p>
            <Link href="/auth/signin" className="mt-3 inline-block rounded-full bg-primary px-4 py-2 font-body text-[12px] font-bold text-black">Sign In</Link>
          </div>
        )}
      </div>
    </div>
  );
}
