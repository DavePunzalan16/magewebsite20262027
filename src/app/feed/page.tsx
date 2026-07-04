"use client";

import { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { siteConfig } from "@/data/portfolio";
import {
  Heart,
  MessageCircle,
  Share2,
  Send,
  ImageIcon,
  MoreHorizontal,
  Trash2,
  EyeOff,
  Pin,
  ArrowLeft,
  Flame,
  Laugh,
  ThumbsUp,
} from "lucide-react";

interface Post {
  id: number;
  user_id: string;
  content: string;
  image_url: string | null;
  category: string;
  is_pinned: boolean;
  created_at: string;
  // Joined
  author_name?: string;
  author_avatar?: string;
  reaction_count?: number;
  comment_count?: number;
  user_reacted?: boolean;
}

interface Comment {
  id: number;
  content: string;
  created_at: string;
  author_name?: string;
}

const categories = ["All", "General", "Artwork", "Gaming", "Anime", "Meme"];
const reactionEmojis = ["❤️", "🔥", "😂", "👍", "⚔️", "✨"];

// Fallback posts for when DB is empty
const fallbackPosts: Post[] = [
  { id: 1, user_id: "", content: "Welcome to the M.A.G.E. Guild Feed! 🎉 Share your thoughts, art, and memes with fellow guild members.", image_url: null, category: "announcement", is_pinned: true, created_at: "2026-07-04T10:00:00Z", author_name: "Guild Master", reaction_count: 12, comment_count: 3, user_reacted: false },
  { id: 2, user_id: "", content: "Just finished this fanart of our guild emblem in pixel art style! What do you think? ⚔️🎨", image_url: "/images/mageicon.jpg", category: "artwork", is_pinned: false, created_at: "2026-07-03T15:30:00Z", author_name: "ArtMage", reaction_count: 8, comment_count: 5, user_reacted: false },
  { id: 3, user_id: "", content: "Anyone up for a Valorant custom match tonight? 5v5 guild members only! Drop a 🔥 if you're in.", image_url: null, category: "gaming", is_pinned: false, created_at: "2026-07-03T12:00:00Z", author_name: "GamerNigel", reaction_count: 15, comment_count: 7, user_reacted: false },
  { id: 4, user_id: "", content: "The new season of Jujutsu Kaisen is absolutely insane. No spoilers but episode 5... 🤯", image_url: null, category: "anime", is_pinned: false, created_at: "2026-07-02T20:00:00Z", author_name: "AnimeFan", reaction_count: 22, comment_count: 11, user_reacted: false },
];

export default function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const [posts, setPosts] = useState<Post[]>(fallbackPosts);
  const [activeCategory, setActiveCategory] = useState("All");
  const [newPost, setNewPost] = useState("");
  const [posting, setPosting] = useState(false);
  const [expandedComments, setExpandedComments] = useState<number | null>(null);
  const [commentText, setCommentText] = useState("");
  const [comments, setComments] = useState<Record<number, Comment[]>>({});
  const [menuOpen, setMenuOpen] = useState<number | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Fetch posts from Supabase
  useEffect(() => {
    if (!mounted) return;
    const supabase = createClient();

    supabase.from("posts").select("*").eq("is_hidden", false).order("is_pinned", { ascending: false }).order("created_at", { ascending: false }).limit(20)
      .then(({ data }) => {
        if (data && data.length > 0) setPosts(data);
      })
      .catch(() => {}); // Keep fallback
  }, [mounted]);

  const handlePost = useCallback(async () => {
    if (!newPost.trim() || !user) return;
    setPosting(true);

    const supabase = createClient();
    const { data, error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: newPost,
      category: "general",
    }).select().single();

    if (!error && data) {
      setPosts((prev) => [{ ...data, author_name: user.user_metadata?.full_name || user.email?.split("@")[0], reaction_count: 0, comment_count: 0, user_reacted: false }, ...prev]);
    }

    setNewPost("");
    setPosting(false);
  }, [newPost, user]);

  const handleReact = useCallback(async (postId: number) => {
    if (!user) return;
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, user_reacted: !p.user_reacted, reaction_count: (p.reaction_count || 0) + (p.user_reacted ? -1 : 1) } : p));

    const supabase = createClient();
    const existing = await supabase.from("reactions").select("id").eq("post_id", postId).eq("user_id", user.id).single();
    if (existing.data) {
      await supabase.from("reactions").delete().eq("id", existing.data.id);
    } else {
      await supabase.from("reactions").insert({ post_id: postId, user_id: user.id, emoji: "❤️" });
    }
  }, [user]);

  const handleComment = useCallback(async (postId: number) => {
    if (!commentText.trim() || !user) return;
    const supabase = createClient();
    await supabase.from("comments").insert({ post_id: postId, user_id: user.id, content: commentText });
    setComments((prev) => ({ ...prev, [postId]: [...(prev[postId] || []), { id: Date.now(), content: commentText, created_at: new Date().toISOString(), author_name: user.user_metadata?.full_name || "You" }] }));
    setPosts((prev) => prev.map((p) => p.id === postId ? { ...p, comment_count: (p.comment_count || 0) + 1 } : p));
    setCommentText("");
  }, [commentText, user]);

  const handleDelete = useCallback(async (postId: number) => {
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", postId);
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    setMenuOpen(null);
  }, []);

  const handleShare = (post: Post) => {
    if (navigator.share) {
      navigator.share({ title: "M.A.G.E. Guild Post", text: post.content, url: window.location.href });
    } else {
      navigator.clipboard.writeText(post.content);
    }
  };

  const filtered = activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory.toLowerCase());

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-40 border-b border-dark-gray/20 bg-background/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-[700px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-8 w-8 items-center justify-center rounded-full bg-surface text-offwhite hover:text-white">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div className="flex items-center gap-2">
              <Image src={siteConfig.iconImage} alt="" width={28} height={28} className="rounded-full" />
              <h1 className="font-display text-[22px] text-white">Guild Feed</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[700px] px-4 py-6">
        {/* Post composer */}
        {user && (
          <motion.div
            className="mb-6 rounded-[14px] border border-dark-gray/30 bg-surface/20 p-4"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/20 font-body text-[13px] font-bold text-primary">
                {(user.user_metadata?.full_name || user.email || "M").charAt(0).toUpperCase()}
              </div>
              <div className="flex-1">
                <textarea
                  value={newPost}
                  onChange={(e) => setNewPost(e.target.value)}
                  placeholder="Share something with the guild..."
                  className="w-full resize-none rounded-[8px] border-none bg-transparent py-1 font-body text-[14px] text-white placeholder:text-offwhite/30 focus:outline-none"
                  rows={2}
                />
                <div className="mt-2 flex items-center justify-between border-t border-dark-gray/20 pt-2">
                  <button className="flex items-center gap-1.5 rounded-[6px] px-2 py-1 font-body text-[12px] text-offwhite/50 hover:bg-white/5 hover:text-offwhite">
                    <ImageIcon className="h-4 w-4" /> Photo
                  </button>
                  <button
                    onClick={handlePost}
                    disabled={!newPost.trim() || posting}
                    className="flex items-center gap-1.5 rounded-full bg-primary px-4 py-1.5 font-body text-[12px] font-bold text-black transition-all hover:bg-primary/90 disabled:opacity-40"
                  >
                    <Send className="h-3.5 w-3.5" /> {posting ? "Posting..." : "Post"}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Category filter */}
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`shrink-0 rounded-full px-3.5 py-1.5 font-body text-[12px] font-medium transition-all ${
                activeCategory === cat ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-surface/30 text-offwhite/50 hover:text-offwhite"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Posts feed */}
        <div className="flex flex-col gap-4">
          {filtered.map((post, i) => (
            <motion.article
              key={post.id}
              className="relative rounded-[14px] border border-dark-gray/30 bg-surface/20 overflow-hidden"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
            >
              {post.is_pinned && (
                <div className="flex items-center gap-1.5 bg-primary/5 px-4 py-1.5 border-b border-dark-gray/20">
                  <Pin className="h-3 w-3 text-primary" />
                  <span className="font-body text-[10px] font-bold uppercase tracking-wider text-primary">Pinned</span>
                </div>
              )}

              <div className="p-4">
                {/* Author row */}
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/15 font-body text-[12px] font-bold text-primary">
                      {(post.author_name || "M").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-body text-[13px] font-semibold text-white">{post.author_name || "Guild Member"}</p>
                      <p className="font-body text-[10px] text-offwhite/40">
                        {new Date(post.created_at).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
                        {" · "}
                        <span className="capitalize">{post.category}</span>
                      </p>
                    </div>
                  </div>
                  {/* Menu */}
                  <div className="relative">
                    <button onClick={() => setMenuOpen(menuOpen === post.id ? null : post.id)} className="rounded-full p-1.5 text-offwhite/30 hover:bg-white/5 hover:text-offwhite">
                      <MoreHorizontal className="h-4 w-4" />
                    </button>
                    <AnimatePresence>
                      {menuOpen === post.id && (
                        <motion.div className="absolute right-0 top-full z-10 mt-1 w-36 rounded-[8px] border border-dark-gray/30 bg-[#0c0015] p-1 shadow-lg" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                          {(user?.id === post.user_id || user?.email === "admin@gmail.com") && (
                            <button onClick={() => handleDelete(post.id)} className="flex w-full items-center gap-2 rounded-[6px] px-3 py-1.5 font-body text-[12px] text-red-400 hover:bg-red-500/10">
                              <Trash2 className="h-3.5 w-3.5" /> Delete
                            </button>
                          )}
                          <button onClick={() => setMenuOpen(null)} className="flex w-full items-center gap-2 rounded-[6px] px-3 py-1.5 font-body text-[12px] text-offwhite/60 hover:bg-white/5">
                            <EyeOff className="h-3.5 w-3.5" /> Hide
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>

                {/* Content */}
                <p className="mb-3 font-body text-[14px] leading-relaxed text-offwhite/90 whitespace-pre-wrap">{post.content}</p>

                {/* Image */}
                {post.image_url && (
                  <div className="mb-3 overflow-hidden rounded-[10px] border border-dark-gray/20">
                    <Image src={post.image_url} alt="" width={600} height={400} className="w-full object-cover" />
                  </div>
                )}

                {/* Actions */}
                <div className="flex items-center gap-1 border-t border-dark-gray/20 pt-3">
                  <button
                    onClick={() => handleReact(post.id)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-[12px] transition-all ${post.user_reacted ? "bg-red-500/10 text-red-400" : "text-offwhite/40 hover:bg-white/5 hover:text-offwhite"}`}
                  >
                    <Heart className={`h-4 w-4 ${post.user_reacted ? "fill-current" : ""}`} />
                    {(post.reaction_count || 0) > 0 && post.reaction_count}
                  </button>
                  <button
                    onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                    className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-[12px] text-offwhite/40 hover:bg-white/5 hover:text-offwhite"
                  >
                    <MessageCircle className="h-4 w-4" />
                    {(post.comment_count || 0) > 0 && post.comment_count}
                  </button>
                  <button onClick={() => handleShare(post)} className="flex items-center gap-1.5 rounded-full px-3 py-1.5 font-body text-[12px] text-offwhite/40 hover:bg-white/5 hover:text-offwhite">
                    <Share2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Comments section */}
                <AnimatePresence>
                  {expandedComments === post.id && (
                    <motion.div className="mt-3 border-t border-dark-gray/20 pt-3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}>
                      {(comments[post.id] || []).map((c) => (
                        <div key={c.id} className="mb-2 flex gap-2">
                          <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-surface font-body text-[10px] text-offwhite/60">
                            {(c.author_name || "?").charAt(0)}
                          </div>
                          <div className="rounded-[8px] bg-background/40 px-3 py-1.5">
                            <p className="font-body text-[11px] font-semibold text-offwhite/80">{c.author_name}</p>
                            <p className="font-body text-[12px] text-offwhite/60">{c.content}</p>
                          </div>
                        </div>
                      ))}
                      {user && (
                        <div className="mt-2 flex gap-2">
                          <input
                            type="text"
                            value={commentText}
                            onChange={(e) => setCommentText(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleComment(post.id)}
                            placeholder="Write a comment..."
                            className="flex-1 rounded-full border border-dark-gray/30 bg-background/40 px-3 py-1.5 font-body text-[12px] text-white placeholder:text-offwhite/25 focus:border-primary/30 focus:outline-none"
                          />
                          <button onClick={() => handleComment(post.id)} className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/20 text-primary hover:bg-primary/30">
                            <Send className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.article>
          ))}
        </div>

        {/* Login prompt */}
        {!user && !authLoading && (
          <div className="mt-8 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-6 text-center">
            <p className="font-body text-[14px] text-offwhite/60">Sign in to post, react, and comment.</p>
            <Link href="/auth/signin" className="mt-3 inline-block rounded-full bg-primary px-5 py-2 font-body text-[13px] font-bold text-black">
              Sign In
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
