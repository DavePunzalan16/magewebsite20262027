"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";
import { Send, ImageIcon, Hash, X, Pin, Trash2, Eye, EyeOff, Edit3 } from "lucide-react";

const categories = ["general", "announcement", "artwork", "gaming", "anime", "meme"];

interface PostItem {
  id: number;
  content: string;
  image_url: string | null;
  category: string;
  is_pinned: boolean;
  is_hidden: boolean;
  created_at: string;
}

export default function AdminPostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [hashtags, setHashtags] = useState("");
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editContent, setEditContent] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("posts").select("id, content, image_url, category, is_pinned, is_hidden, created_at")
      .order("created_at", { ascending: false }).limit(50)
      .then(({ data }) => { if (data) setPosts(data); });
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) { setMediaFile(file); setMediaPreview(URL.createObjectURL(file)); }
  };

  const removeMedia = () => { setMediaFile(null); setMediaPreview(null); if (fileRef.current) fileRef.current.value = ""; };

  const handlePublish = async () => {
    if (!content.trim() || !user) return;
    setPosting(true);

    let imageUrl: string | null = null;
    if (mediaFile) imageUrl = await uploadFile(mediaFile, "posts");

    const fullContent = hashtags ? `${content}\n\n${hashtags.split(",").map((t) => `#${t.trim()}`).join(" ")}` : content;
    const supabase = createClient();
    const { data, error } = await supabase.from("posts").insert({
      user_id: user.id, content: fullContent, image_url: imageUrl, category, is_pinned: category === "announcement",
    }).select().single();

    setPosting(false);
    if (!error && data) {
      setPosts((prev) => [data, ...prev]);
      setContent(""); setHashtags(""); removeMedia(); setCategory("general");
      setSuccess("Published!");
      setTimeout(() => setSuccess(""), 3000);
    }
  };

  const handleDelete = async (id: number) => {
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", id);
    setPosts((prev) => prev.filter((p) => p.id !== id));
  };

  const handlePin = async (id: number, pinned: boolean) => {
    const supabase = createClient();
    await supabase.from("posts").update({ is_pinned: !pinned }).eq("id", id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, is_pinned: !pinned } : p));
  };

  const handleHide = async (id: number, hidden: boolean) => {
    const supabase = createClient();
    await supabase.from("posts").update({ is_hidden: !hidden }).eq("id", id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, is_hidden: !hidden } : p));
  };

  const handleEdit = async (id: number) => {
    if (!editContent.trim()) return;
    const supabase = createClient();
    await supabase.from("posts").update({ content: editContent, updated_at: new Date().toISOString() }).eq("id", id);
    setPosts((prev) => prev.map((p) => p.id === id ? { ...p, content: editContent } : p));
    setEditingId(null); setEditContent("");
  };

  return (
    <div>
      <h1 className="mb-1 font-display text-[30px] text-white md:text-[38px]">Post Manager</h1>
      <p className="mb-6 font-body text-[13px] text-offwhite/50">Create, edit, pin, hide, and delete posts. All changes persist to Supabase.</p>

      {/* Composer */}
      <div className="mb-8 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5">
        <div className="mb-3 flex flex-wrap gap-2">
          {categories.map((c) => (
            <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 font-body text-[11px] font-medium capitalize transition-all ${category === c ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-background/30 text-offwhite/40 hover:text-offwhite"}`}>{c}</button>
          ))}
        </div>
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={3} placeholder="Write post content..."
          className="mb-3 w-full resize-none rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2.5 font-body text-[13px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none" />

        {mediaPreview && (
          <div className="relative mb-3 inline-block">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={mediaPreview} alt="" className="h-24 w-auto rounded-[6px] object-cover" />
            <button onClick={removeMedia} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] text-white">×</button>
          </div>
        )}

        <div className="mb-3">
          <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="Hashtags (comma separated)"
            className="w-full rounded-[6px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[12px] text-white placeholder:text-offwhite/20 focus:border-primary/40 focus:outline-none" />
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-[6px] bg-surface px-3 py-1.5 font-body text-[11px] text-offwhite hover:text-white" type="button">
            <ImageIcon className="h-3.5 w-3.5" /> Upload
          </button>
          <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
          <button onClick={handlePublish} disabled={!content.trim() || posting}
            className="flex items-center gap-1.5 rounded-[6px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90 disabled:opacity-50">
            <Send className="h-3.5 w-3.5" /> {posting ? "Publishing..." : "Publish"}
          </button>
        </div>
        {success && <p className="mt-2 font-body text-[12px] text-green-400">✓ {success}</p>}
      </div>

      {/* Posts list */}
      <h2 className="mb-4 font-body text-[15px] font-semibold text-white">All Posts ({posts.length})</h2>
      <div className="flex flex-col gap-2">
        {posts.map((post) => (
          <div key={post.id} className={`rounded-[10px] border p-4 ${post.is_hidden ? "border-red-500/20 bg-red-500/5 opacity-60" : "border-dark-gray/30 bg-surface/20"}`}>
            {editingId === post.id ? (
              <div className="flex flex-col gap-2">
                <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={2}
                  className="w-full resize-none rounded-[6px] border border-primary/30 bg-background/50 px-3 py-2 font-body text-[12px] text-white focus:outline-none" />
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(post.id)} className="rounded-[4px] bg-primary px-3 py-1 font-body text-[11px] font-bold text-black">Save</button>
                  <button onClick={() => setEditingId(null)} className="rounded-[4px] px-3 py-1 font-body text-[11px] text-offwhite/50 hover:text-white">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <p className="mb-2 font-body text-[12px] leading-relaxed text-offwhite/80 line-clamp-3 whitespace-pre-wrap">{post.content}</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="rounded bg-surface px-1.5 py-0.5 font-body text-[9px] uppercase text-offwhite/40">{post.category}</span>
                    {post.is_pinned && <span className="rounded bg-primary/10 px-1.5 py-0.5 font-body text-[9px] text-primary">📌 Pinned</span>}
                    {post.is_hidden && <span className="rounded bg-red-500/10 px-1.5 py-0.5 font-body text-[9px] text-red-400">Hidden</span>}
                    <span className="font-body text-[9px] text-offwhite/25">{new Date(post.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => { setEditingId(post.id); setEditContent(post.content); }} className="rounded p-1 text-offwhite/30 hover:text-white" title="Edit"><Edit3 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handlePin(post.id, post.is_pinned)} className="rounded p-1 text-offwhite/30 hover:text-primary" title="Pin"><Pin className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleHide(post.id, post.is_hidden)} className="rounded p-1 text-offwhite/30 hover:text-yellow-400" title="Hide/Show">{post.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}</button>
                    <button onClick={() => handleDelete(post.id)} className="rounded p-1 text-offwhite/30 hover:text-red-400" title="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
