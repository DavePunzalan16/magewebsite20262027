"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";
import { siteConfig } from "@/data/portfolio";
import { useRealtimeFeed } from "@/hooks/useRealtimeFeed";
import { PremiumFooter } from "@/components/sections/Footer";
import { PageLoader } from "@/components/ui/PageLoader";
import { awardClientXP } from "@/lib/xp-client";
import {
  Heart, MessageCircle, Share2, Bookmark, Send, ImageIcon,
  MoreHorizontal, Trash2, EyeOff, Pin, ArrowLeft, Users, Repeat2,
} from "lucide-react";

interface FeedPost {
  id: number;
  user_id: string;
  content: string;
  image_url: string | null;
  category: string;
  is_pinned: boolean;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
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
  author_name: string;
  author_avatar: string | null;
}

const categories = ["All", "General", "Artwork", "Gaming", "Anime", "Meme", "Announcement"];

const fallbackPosts: FeedPost[] = [
  { id: 901, user_id: "", content: "🎉 Welcome to the M.A.G.E. Guild Feed! Share your thoughts, art, memes, and connect with fellow guild members. Cast your passion!", image_url: null, category: "announcement", is_pinned: true, created_at: "2026-07-04T10:00:00Z", author_name: "Guild Master", author_avatar: null, reactions: 24, comments: 8, shares: 3, userReacted: false, userBookmarked: false },
  { id: 902, user_id: "", content: "Just finished a pixel art version of our guild emblem! ⚔️🎨 What do you guys think? Took me about 3 hours.", image_url: "/images/mageicon.jpg", category: "artwork", is_pinned: false, created_at: "2026-07-03T15:30:00Z", author_name: "ArtMage", author_avatar: null, reactions: 18, comments: 6, shares: 2, userReacted: false, userBookmarked: false },
  { id: 903, user_id: "", content: "Anyone up for Valorant 5v5 tonight? Guild members only! Drop a ❤️ if you're in. 🎮", image_url: null, category: "gaming", is_pinned: false, created_at: "2026-07-03T12:00:00Z", author_name: "GamerNigel", author_avatar: null, reactions: 31, comments: 12, shares: 1, userReacted: false, userBookmarked: false },
  { id: 904, user_id: "", content: "New season of Jujutsu Kaisen hits different. No spoilers but episode 5 had me screaming 🤯🔥", image_url: null, category: "anime", is_pinned: false, created_at: "2026-07-02T20:00:00Z", author_name: "AnimeFan", author_avatar: null, reactions: 45, comments: 19, shares: 5, userReacted: false, userBookmarked: false },
  { id: 905, user_id: "", content: "When the professor says 'no homework' but gives a surprise quiz instead 💀😂 #UECaloocanMoments", image_url: null, category: "meme", is_pinned: false, created_at: "2026-07-02T14:00:00Z", author_name: "MemeLord", author_avatar: null, reactions: 67, comments: 23, shares: 8, userReacted: false, userBookmarked: false },
  { id: 906, user_id: "", content: "📢 Monthly meeting this Wednesday 5PM at AVR Room 2. Attendance required for all members!", image_url: null, category: "announcement", is_pinned: false, created_at: "2026-07-01T09:00:00Z", author_name: "Secretary Rose", author_avatar: null, reactions: 12, comments: 4, shares: 1, userReacted: false, userBookmarked: false },
  { id: 907, user_id: "", content: "Working on cosplay props for Arcane Convergence 2026! Going as Raiden Shogun ⚡ Any cosplayers here?", image_url: null, category: "general", is_pinned: false, created_at: "2026-06-30T18:00:00Z", author_name: "CosplayQueen", author_avatar: null, reactions: 28, comments: 9, shares: 2, userReacted: false, userBookmarked: false },
  { id: 908, user_id: "", content: "One Piece chapter 1120 discussion! 🏴‍☠️ What are your theories about the final saga?", image_url: null, category: "anime", is_pinned: false, created_at: "2026-06-29T21:00:00Z", author_name: "PirateKing", author_avatar: null, reactions: 39, comments: 27, shares: 4, userReacted: false, userBookmarked: false },
  { id: 909, user_id: "", content: "Guild merch designs are looking fire 🔥 Can't wait for the official drop at Arcane Convergence!", image_url: null, category: "general", is_pinned: false, created_at: "2026-06-28T16:00:00Z", author_name: "MerchTeam", author_avatar: null, reactions: 33, comments: 11, shares: 6, userReacted: false, userBookmarked: false },
  { id: 910, user_id: "", content: "Just got into Diamond in Valorant! Any guild members wanna duo queue? 💎🎯", image_url: null, category: "gaming", is_pinned: false, created_at: "2026-06-27T22:00:00Z", author_name: "DiamondMage", author_avatar: null, reactions: 21, comments: 8, shares: 1, userReacted: false, userBookmarked: false },
];

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageReady, setPageReady] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [newPost, setNewPost] = useState("");
  const [postCategory, setPostCategory] = useState("general");
  const [postFile, setPostFile] = useState<File | null>(null);
  const [postPreview, setPostPreview] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<number | null>(null);
  const [comments, setComments] = useState<Record<number, CommentItem[]>>({});
  const [commentText, setCommentText] = useState("");
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [commentReactions, setCommentReactions] = useState<Record<number, { count: number; liked: boolean }>>({});
  const [userProfile, setUserProfile] = useState<{ full_name: string; avatar_url: string | null } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Page ready after auth resolves
  useEffect(() => {
    if (!authLoading) setPageReady(true);
  }, [authLoading]);

  // Get current user profile for avatar display
  useEffect(() => {
    if (!user) return;
    const supabase = createClient();
    supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).single()
      .then(({ data }) => { if (data) setUserProfile(data); });
  }, [user]);

  // Fetch posts — simple query without join to avoid RLS recursion
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    const supabase = createClient();

    let query = supabase.from("posts")
      .select("id, user_id, content, image_url, category, is_pinned, created_at")
      .eq("is_hidden", false)
      .or("pending_approval.is.null,pending_approval.eq.false")
      .order("is_pinned", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(30);

    if (activeCategory !== "All") {
      query = query.eq("category", activeCategory.toLowerCase());
    }

    const { data: postsData } = await query;

    if (postsData && postsData.length > 0) {
      // Get unique user IDs to fetch profiles separately (avoids RLS join issue)
      const userIds = [...new Set(postsData.map((p) => p.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

      // Fetch real reaction + comment counts for these posts
      const postIds = postsData.map((p) => p.id);
      const [reactionsData, commentsData, userReactionsData] = await Promise.all([
        supabase.from("reactions").select("post_id").in("post_id", postIds),
        supabase.from("comments").select("post_id").in("post_id", postIds).eq("is_hidden", false),
        user ? supabase.from("reactions").select("post_id").in("post_id", postIds).eq("user_id", user.id) : { data: [] },
      ]);

      // Count per post
      const reactionCounts: Record<number, number> = {};
      (reactionsData.data || []).forEach((r) => { reactionCounts[r.post_id] = (reactionCounts[r.post_id] || 0) + 1; });
      const commentCounts: Record<number, number> = {};
      (commentsData.data || []).forEach((c) => { commentCounts[c.post_id] = (commentCounts[c.post_id] || 0) + 1; });
      const userReactedSet = new Set((userReactionsData.data || []).map((r) => r.post_id));

      const enriched: FeedPost[] = postsData.map((p) => {
        const profile = profileMap.get(p.user_id);
        return {
          ...p,
          author_name: profile?.full_name || "Guild Member",
          author_avatar: profile?.avatar_url || null,
          reactions: reactionCounts[p.id] || 0,
          comments: commentCounts[p.id] || 0,
          shares: 0,
          userReacted: userReactedSet.has(p.id),
          userBookmarked: false,
        };
      });

      setPosts(enriched);
    } else {
      // Show fallback welcome posts when DB is empty
      setPosts(fallbackPosts);
    }
    setLoading(false);
  }, [activeCategory]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Realtime: new posts appear
  useRealtimeFeed({
    onNewPost: useCallback((newPost: Record<string, unknown>) => {
      setPosts((prev) => {
        if (prev.some((p) => p.id === newPost.id)) return prev;
        return [{
          id: newPost.id as number,
          user_id: newPost.user_id as string,
          content: newPost.content as string,
          image_url: (newPost.image_url as string) || null,
          category: (newPost.category as string) || "general",
          is_pinned: (newPost.is_pinned as boolean) || false,
          created_at: (newPost.created_at as string) || new Date().toISOString(),
          author_name: userProfile?.full_name || "Guild Member",
          author_avatar: userProfile?.avatar_url || null,
          reactions: 0, comments: 0, shares: 0, userReacted: false, userBookmarked: false,
        }, ...prev];
      });
    }, [userProfile]),
    enabled: true,
  });

  // Create post — non-admin posts need approval
  const handlePost = async () => {
    if (!newPost.trim() || !user) return;
    setPosting(true);

    let imageUrl: string | null = null;
    if (postFile) imageUrl = await uploadFile(postFile, "feed");

    const isAdmin = user.email === "admin@gmail.com";
    const supabase = createClient();
    const { data } = await supabase.from("posts").insert({
      user_id: user.id, content: newPost, image_url: imageUrl, category: postCategory,
      pending_approval: !isAdmin, // Admin posts go live immediately
    }).select("id, user_id, content, image_url, category, is_pinned, created_at").single();

    if (data && isAdmin) {
      setPosts((prev) => [{
        ...data,
        author_name: userProfile?.full_name || user.user_metadata?.full_name || "You",
        author_avatar: userProfile?.avatar_url || user.user_metadata?.avatar_url || null,
        reactions: 0, comments: 0, shares: 0, userReacted: false, userBookmarked: false,
      }, ...prev]);
      // Award XP for posting
      awardClientXP(user.id, "post");
    }
    setNewPost(""); setPostFile(null); setPostPreview(null); setPosting(false);
  };

  // Reactions
  const handleReact = async (postId: number) => {
    if (!user) return;
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, userReacted: !p.userReacted, reactions: p.reactions + (p.userReacted ? -1 : 1) } : p));
    try {
      const supabase = createClient();
      const { data: existing } = await supabase.from("reactions").select("id").eq("post_id", postId).eq("user_id", user.id).single();
      if (existing) await supabase.from("reactions").delete().eq("id", existing.id);
      else {
        await supabase.from("reactions").insert({ post_id: postId, user_id: user.id, emoji: "❤️" });
        // Award XP for reacting
        awardClientXP(user.id, "reaction");
      }
    } catch {}
  };

  // Bookmarks
  const handleBookmark = async (postId: number) => {
    if (!user) return;
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, userBookmarked: !p.userBookmarked } : p));
    try {
      const supabase = createClient();
      const { data } = await supabase.from("bookmarks").select("id").eq("post_id", postId).eq("user_id", user.id).single();
      if (data) await supabase.from("bookmarks").delete().eq("id", data.id);
      else await supabase.from("bookmarks").insert({ post_id: postId, user_id: user.id });
    } catch {}
  };

  // Repost — saves to profile reposts section
  const handleRepost = async (post: FeedPost) => {
    if (!user) return;
    try {
      const supabase = createClient();
      await supabase.from("reposts").insert({ user_id: user.id, post_id: post.id });
      // Award XP for sharing
      await awardClientXP(user.id, "repost", 5);
    } catch {}
    alert("Reposted to your profile! 🔁");
  };

  // Comments
  const handleComment = async (postId: number) => {
    if (!commentText.trim() || !user) return;
    const supabase = createClient();
    const { data } = await supabase.from("comments").insert({ post_id: postId, user_id: user.id, content: commentText }).select("id, content, created_at").single();
    if (data) {
      setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), { ...data, author_name: userProfile?.full_name || "You", author_avatar: userProfile?.avatar_url || null }] }));
      setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comments: p.comments + 1 } : p));
      // Award XP for commenting
      awardClientXP(user.id, "comment");
    }
    setCommentText("");
  };

  // Comment reaction toggle
  const handleCommentReact = async (commentId: number) => {
    if (!user) return;
    const current = commentReactions[commentId] || { count: 0, liked: false };
    setCommentReactions((prev) => ({ ...prev, [commentId]: { count: current.liked ? current.count - 1 : current.count + 1, liked: !current.liked } }));
    const supabase = createClient();
    if (current.liked) {
      await supabase.from("comment_reactions").delete().eq("comment_id", commentId).eq("user_id", user.id);
    } else {
      await supabase.from("comment_reactions").insert({ comment_id: commentId, user_id: user.id });
    }
  };

  const loadComments = async (postId: number) => {
    if (comments[postId]) return;
    const supabase = createClient();
    // Fetch comments then fetch profiles separately
    const { data: commentsData } = await supabase.from("comments").select("id, content, created_at, user_id").eq("post_id", postId).eq("is_hidden", false).order("created_at", { ascending: true }).limit(30);
    if (commentsData && commentsData.length > 0) {
      const userIds = [...new Set(commentsData.map((c) => c.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", userIds);
      const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);
      const enriched: CommentItem[] = commentsData.map((c) => {
        const p = profileMap.get(c.user_id);
        return { id: c.id, content: c.content, created_at: c.created_at, author_name: p?.full_name || "Member", author_avatar: p?.avatar_url || null };
      });
      setComments((prev) => ({ ...prev, [postId]: enriched }));
    } else {
      setComments((prev) => ({ ...prev, [postId]: [] }));
    }
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
  };

  if (!pageReady) return <PageLoader text="Loading guild feed..." />;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-dark-gray/20 bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex h-14 max-w-[900px] items-center gap-3 px-4">
          <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-offwhite hover:text-white"><ArrowLeft className="h-4 w-4" /></Link>
          <Image src={siteConfig.iconImage} alt="" width={24} height={24} className="rounded-full" />
          <h1 className="font-display text-[20px] text-white">Guild Feed</h1>
        </div>
      </div>

      <div className="mx-auto flex max-w-[900px] gap-5 px-4 py-5">
        {/* Main feed column */}
        <div className="flex-1 min-w-0">
          {/* Composer */}
          {user && (
            <div className="mb-5 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
              <div className="flex gap-3">
                {/* User avatar in composer */}
                <div className="shrink-0">
                  {userProfile?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={userProfile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 font-body text-[11px] font-bold text-primary">
                      {(userProfile?.full_name || user.email || "M").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1">
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
                    <div className="flex items-center gap-2">
                      <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1 rounded px-2 py-1 font-body text-[11px] text-offwhite/40 hover:text-offwhite" type="button">
                        <ImageIcon className="h-3.5 w-3.5" /> Photo
                      </button>
                      <select value={postCategory} onChange={(e) => setPostCategory(e.target.value)} className="rounded bg-surface/50 px-2 py-1 font-body text-[10px] text-offwhite/60 focus:outline-none">
                        <option value="general">General</option>
                        <option value="artwork">Artwork</option>
                        <option value="gaming">Gaming</option>
                        <option value="anime">Anime</option>
                        <option value="meme">Meme</option>
                      </select>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setPostFile(f); setPostPreview(URL.createObjectURL(f)); } }} className="hidden" />
                    <button onClick={handlePost} disabled={!newPost.trim() || posting} className="flex items-center gap-1 rounded-full bg-primary px-3.5 py-1.5 font-body text-[11px] font-bold text-black disabled:opacity-40">
                      <Send className="h-3 w-3" /> {posting ? "..." : "Post"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="mb-4 flex gap-1.5 overflow-x-auto pb-1">
            {categories.map((c) => (
              <button key={c} onClick={() => setActiveCategory(c)}
                className={`shrink-0 rounded-full px-3 py-1 font-body text-[11px] font-medium transition-all ${activeCategory === c ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-surface/30 text-offwhite/40 hover:text-offwhite"}`}>
                {c}
              </button>
            ))}
          </div>

          {/* Posts */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              {/* Japanese-style loading animation */}
              <div className="relative w-20 h-20">
                <div className="absolute inset-0 rounded-full border-2 border-primary/20 animate-ping" />
                <div className="absolute inset-2 rounded-full border-2 border-t-primary border-r-transparent border-b-transparent border-l-transparent animate-spin" />
                <div className="absolute inset-4 flex items-center justify-center">
                  <span className="font-display text-[20px] text-primary animate-pulse">魔</span>
                </div>
              </div>
              <div className="flex gap-2 items-center">
                {["読", "込", "中", "..."].map((char, i) => (
                  <motion.span key={i} className="font-body text-[14px] text-primary/70"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: [0, 1, 0.5], y: [5, 0, 0] }}
                    transition={{ delay: i * 0.15, duration: 0.8, repeat: Infinity, repeatDelay: 0.5 }}
                  >{char}</motion.span>
                ))}
              </div>
              <p className="font-body text-[11px] text-offwhite/30">Loading guild feed...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-8 text-center">
              <p className="font-body text-[14px] text-offwhite/50">No posts yet. Be the first to share!</p>
              <p className="mt-1 font-body text-[12px] text-offwhite/30">Admin can publish posts from the dashboard.</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {posts.map((post) => (
                <article key={post.id} className="rounded-[12px] border border-dark-gray/30 bg-surface/20 overflow-hidden">
                  {post.is_pinned && <div className="flex items-center gap-1.5 bg-primary/5 px-4 py-1 border-b border-dark-gray/20"><Pin className="h-3 w-3 text-primary" /><span className="font-body text-[9px] font-bold uppercase tracking-wider text-primary">Pinned</span></div>}
                  <div className="p-4">
                    {/* Author */}
                    <div className="mb-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        {post.author_avatar ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={post.author_avatar} alt="" className="h-8 w-8 rounded-full object-cover" />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 font-body text-[11px] font-bold text-primary">
                            {post.author_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <p className="font-body text-[12px] font-semibold text-white">{post.author_name}</p>
                          <p className="font-body text-[9px] text-offwhite/35">{new Date(post.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })} · <span className="capitalize">{post.category}</span></p>
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
                    {post.image_url && (
                      <div className="mb-3 overflow-hidden rounded-[8px] border border-dark-gray/20">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={post.image_url} alt="" className="w-full max-h-[350px] object-cover" loading="lazy" />
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-1 border-t border-dark-gray/20 pt-2.5">
                      <button onClick={() => handleReact(post.id)} className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[11px] ${post.userReacted ? "bg-red-500/10 text-red-400" : "text-offwhite/35 hover:text-offwhite"}`}>
                        <Heart className={`h-3.5 w-3.5 ${post.userReacted ? "fill-current" : ""}`} />{post.reactions || ""}
                      </button>
                      <button onClick={() => { setExpandedComments(expandedComments === post.id ? null : post.id); loadComments(post.id); }} className="flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[11px] text-offwhite/35 hover:text-offwhite">
                        <MessageCircle className="h-3.5 w-3.5" />{post.comments || ""}
                      </button>
                      <button onClick={() => handleShare(post)} className="flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[11px] text-offwhite/35 hover:text-offwhite">
                        <Share2 className="h-3.5 w-3.5" />{post.shares || ""}
                      </button>
                      <button onClick={() => handleRepost(post)} className="flex items-center gap-1 rounded-full px-2.5 py-1 font-body text-[11px] text-green-400/50 hover:text-green-400">
                        <Repeat2 className="h-3.5 w-3.5" />
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
                            {c.author_avatar ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={c.author_avatar} alt="" className="h-6 w-6 shrink-0 rounded-full object-cover" />
                            ) : (
                              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface font-body text-[9px] text-offwhite/50">{c.author_name.charAt(0)}</div>
                            )}
                            <div className="flex-1 rounded-[6px] bg-background/30 px-2.5 py-1.5">
                              <p className="font-body text-[10px] font-semibold text-offwhite/70">{c.author_name}</p>
                              <p className="font-body text-[11px] text-offwhite/60">{c.content}</p>
                            </div>
                            <button onClick={() => handleCommentReact(c.id)} className={`shrink-0 self-center rounded-full p-1 ${(commentReactions[c.id]?.liked) ? "text-red-400" : "text-offwhite/20 hover:text-offwhite/50"}`}>
                              <Heart className={`h-3 w-3 ${(commentReactions[c.id]?.liked) ? "fill-current" : ""}`} />
                            </button>
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
            </div>
          )}

          {!user && !authLoading && (
            <div className="mt-6 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5 text-center">
              <p className="font-body text-[13px] text-offwhite/50">Sign in to post, react, and comment.</p>
              <Link href="/auth/signin" className="mt-3 inline-block rounded-full bg-primary px-4 py-2 font-body text-[12px] font-bold text-black">Sign In</Link>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <aside className="hidden w-[220px] shrink-0 lg:block">
          {/* Guild card */}
          <div className="mb-4 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
            <div className="mb-3 flex items-center gap-2">
              <Image src={siteConfig.iconImage} alt="" width={32} height={32} className="rounded-full" />
              <div>
                <p className="font-body text-[12px] font-semibold text-white">M.A.G.E. Guild</p>
                <p className="font-body text-[10px] text-offwhite/40">UE Caloocan</p>
              </div>
            </div>
            <p className="font-body text-[11px] leading-relaxed text-offwhite/50">Manga, Anime, and Game Enthusiast&apos;s Guild — Cast Your Passion!</p>
          </div>

          {/* Quick links */}
          <div className="mb-4 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
            <h3 className="mb-3 font-body text-[11px] font-semibold uppercase tracking-wider text-offwhite/40">Quick Links</h3>
            <div className="flex flex-col gap-1.5">
              <Link href="/profile" prefetch={false} className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 font-body text-[11px] text-offwhite/60 hover:bg-white/5 hover:text-white">
                <Users className="h-3.5 w-3.5" /> My Profile
              </Link>
              <a href="https://discord.gg/XF2duSHASV" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 font-body text-[11px] text-offwhite/60 hover:bg-white/5 hover:text-white">
                💬 Discord Server
              </a>
              <Link href="/#events" className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 font-body text-[11px] text-offwhite/60 hover:bg-white/5 hover:text-white">
                📅 Upcoming Events
              </Link>
              <Link href="/#officers" className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 font-body text-[11px] text-offwhite/60 hover:bg-white/5 hover:text-white">
                ⚔️ Officers
              </Link>
            </div>
          </div>

          {/* Friend Requests */}
          <FriendRequestsSidebar userId={user?.id} />

          {/* Online (placeholder) */}
          <MembersSidebar currentUserId={user?.id} />
        </aside>
      </div>
      <PremiumFooter />
    </div>
  );
}

// Members sidebar component
function MembersSidebar({ currentUserId }: { currentUserId?: string }) {
  const [members, setMembers] = useState<{ id: string; full_name: string | null; avatar_url: string | null; role: string }[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("profiles").select("id, full_name, avatar_url, role").order("created_at", { ascending: false }).limit(15)
      .then(({ data }) => { if (data) setMembers(data); setLoadingMembers(false); });
  }, []);

  return (
    <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
      <h3 className="mb-3 font-body text-[11px] font-semibold uppercase tracking-wider text-offwhite/40">Guild Members ({members.length})</h3>
      {loadingMembers ? (
        <div className="flex flex-col gap-2">{Array.from({ length: 4 }).map((_, i) => <div key={i} className="h-8 animate-pulse rounded-[6px] bg-surface/30" />)}</div>
      ) : members.length === 0 ? (
        <p className="font-body text-[11px] text-offwhite/30">No members yet.</p>
      ) : (
        <div className="flex flex-col gap-1.5 max-h-[300px] overflow-y-auto">
          {members.map((member) => (
            <Link
              key={member.id}
              href={`/profile/${member.id}`}
              prefetch={false}
              className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 transition-colors hover:bg-white/5"
            >
              {member.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={member.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover" />
              ) : (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/15 font-body text-[9px] font-bold text-primary">
                  {(member.full_name || "M").charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="truncate font-body text-[11px] text-offwhite/70">{member.full_name || "Member"}</p>
              </div>
              {member.role === "admin" && <span className="font-body text-[8px] text-yellow-400">👑</span>}
              {member.id === currentUserId && <span className="font-body text-[8px] text-primary">you</span>}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

// Friend Requests sidebar — realtime
function FriendRequestsSidebar({ userId }: { userId?: string }) {
  const [requests, setRequests] = useState<{ id: number; requester_id: string; name: string; avatar: string | null; created_at: string }[]>([]);
  const [friends, setFriends] = useState<{ id: string; full_name: string | null; avatar_url: string | null }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const fetchData = async () => {
      const supabase = createClient();

      // Get pending requests where I'm the receiver
      const { data: pending } = await supabase.from("friendships")
        .select("id, requester_id, created_at")
        .eq("receiver_id", userId)
        .eq("status", "pending");

      if (pending && pending.length > 0) {
        const requesterIds = pending.map((p) => p.requester_id);
        const { data: profiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", requesterIds);
        const profileMap = new Map(profiles?.map((p) => [p.id, p]) || []);

        setRequests(pending.map((p) => ({
          id: p.id,
          requester_id: p.requester_id,
          name: profileMap.get(p.requester_id)?.full_name || "Member",
          avatar: profileMap.get(p.requester_id)?.avatar_url || null,
          created_at: p.created_at,
        })));
      }

      // Get accepted friends
      const { data: friendships } = await supabase.from("friendships")
        .select("requester_id, receiver_id")
        .eq("status", "accepted")
        .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`);

      if (friendships && friendships.length > 0) {
        const friendIds = friendships.map((f) => f.requester_id === userId ? f.receiver_id : f.requester_id);
        const { data: friendProfiles } = await supabase.from("profiles").select("id, full_name, avatar_url").in("id", friendIds);
        if (friendProfiles) setFriends(friendProfiles);
      }

      setLoading(false);
    };
    fetchData();

    // Realtime subscription for new friend requests
    const supabase = createClient();
    const channel = supabase.channel(`friends-${userId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "friendships", filter: `receiver_id=eq.${userId}` },
        (payload) => {
          if (payload.new && (payload.new as any).status === "pending") {
            // Fetch requester profile
            supabase.from("profiles").select("id, full_name, avatar_url").eq("id", (payload.new as any).requester_id).single()
              .then(({ data: profile }) => {
                if (profile) {
                  setRequests((prev) => [{
                    id: (payload.new as any).id,
                    requester_id: (payload.new as any).requester_id,
                    name: profile.full_name || "Member",
                    avatar: profile.avatar_url,
                    created_at: (payload.new as any).created_at,
                  }, ...prev]);
                }
              });
          }
        })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [userId]);

  const handleAccept = async (friendshipId: number) => {
    const supabase = createClient();
    await supabase.from("friendships").update({ status: "accepted", updated_at: new Date().toISOString() }).eq("id", friendshipId);
    const accepted = requests.find((r) => r.id === friendshipId);
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
    if (accepted) setFriends((prev) => [...prev, { id: accepted.requester_id, full_name: accepted.name, avatar_url: accepted.avatar }]);
  };

  const handleReject = async (friendshipId: number) => {
    const supabase = createClient();
    await supabase.from("friendships").update({ status: "rejected", updated_at: new Date().toISOString() }).eq("id", friendshipId);
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId));
  };

  if (!userId || loading) return null;
  if (requests.length === 0 && friends.length === 0) return null;

  return (
    <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
      {/* Pending Requests */}
      {requests.length > 0 && (
        <div className="mb-4">
          <h3 className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wider text-offwhite/40">
            Friend Requests ({requests.length})
          </h3>
          <div className="flex flex-col gap-2">
            {requests.map((req) => (
              <div key={req.id} className="flex items-center gap-2 rounded-[6px] bg-background/20 p-2">
                {req.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={req.avatar} alt="" className="h-7 w-7 rounded-full object-cover" />
                ) : (
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/15 font-body text-[9px] text-primary">{req.name.charAt(0)}</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="truncate font-body text-[10px] font-medium text-white">{req.name}</p>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => handleAccept(req.id)} className="rounded bg-green-500/10 px-2 py-0.5 font-body text-[9px] font-medium text-green-400 hover:bg-green-500/20">✓</button>
                  <button onClick={() => handleReject(req.id)} className="rounded bg-red-500/10 px-2 py-0.5 font-body text-[9px] font-medium text-red-400 hover:bg-red-500/20">✗</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      {friends.length > 0 && (
        <div>
          <h3 className="mb-2 font-body text-[11px] font-semibold uppercase tracking-wider text-offwhite/40">
            Friends ({friends.length})
          </h3>
          <div className="flex flex-col gap-1.5 max-h-[150px] overflow-y-auto">
            {friends.map((f) => (
              <div key={f.id} className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 hover:bg-white/5 group">
                <Link href={`/profile/${f.id}`} prefetch={false} className="flex items-center gap-2 flex-1 min-w-0">
                  {f.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={f.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 font-body text-[8px] text-primary">{(f.full_name || "M").charAt(0)}</div>
                  )}
                  <span className="truncate font-body text-[10px] text-offwhite/60">{f.full_name || "Member"}</span>
                </Link>
                <button onClick={async () => {
                  const supabase = createClient();
                  await supabase.from("friendships").delete()
                    .or(`and(requester_id.eq.${userId},receiver_id.eq.${f.id}),and(requester_id.eq.${f.id},receiver_id.eq.${userId})`);
                  setFriends(prev => prev.filter(fr => fr.id !== f.id));
                }} className="hidden group-hover:block font-body text-[8px] text-red-400/60 hover:text-red-400" title="Unfriend">
                  ✗
                </button>
                <div className="ml-auto h-1.5 w-1.5 rounded-full bg-green-400 group-hover:hidden" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
