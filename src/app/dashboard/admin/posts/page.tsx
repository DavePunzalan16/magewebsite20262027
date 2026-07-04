"use client";

import { useState, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";
import { Send, ImageIcon, Hash, X, Film } from "lucide-react";

const categoryOptions = ["general", "announcement", "artwork", "gaming", "anime", "meme"];

export default function AdminPostsPage() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [hashtags, setHashtags] = useState("");
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setPosting(true);

    let imageUrl: string | null = null;
    if (mediaFile) {
      imageUrl = await uploadFile(mediaFile, "posts");
    }

    const fullContent = hashtags
      ? `${content}\n\n${hashtags.split(",").map((t) => `#${t.trim()}`).join(" ")}`
      : content;

    const supabase = createClient();
    const { error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: fullContent,
      image_url: imageUrl,
      category,
      is_pinned: category === "announcement",
    });

    setPosting(false);
    if (!error) {
      setSuccess(true);
      setContent("");
      setHashtags("");
      removeMedia();
      setCategory("general");
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[32px] text-white md:text-[40px]">Create Post</h1>
        <p className="font-body text-[14px] text-offwhite/60">Publish to the Guild Feed. Auto-approved as admin.</p>
      </div>

      <motion.div className="rounded-[14px] border border-dark-gray/30 bg-surface/20 p-6" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        {/* Category */}
        <div className="mb-4">
          <label className="mb-2 block font-body text-[12px] font-medium text-offwhite/50">Category</label>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((cat) => (
              <button key={cat} type="button" onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1.5 font-body text-[12px] font-medium capitalize transition-all ${category === cat ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-background/30 text-offwhite/40 hover:text-offwhite"}`}>
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={4} placeholder="Write your post..."
          className="mb-4 w-full resize-none rounded-[10px] border border-dark-gray/30 bg-background/40 px-4 py-3 font-body text-[14px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none" />

        {/* Media preview */}
        {mediaPreview && (
          <div className="relative mb-4 inline-block">
            <Image src={mediaPreview} alt="Preview" width={200} height={150} className="rounded-[8px] object-cover" />
            <button onClick={removeMedia} className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white"><X className="h-3 w-3" /></button>
          </div>
        )}

        {/* Hashtags */}
        <div className="mb-4">
          <label className="mb-1 flex items-center gap-1.5 font-body text-[12px] text-offwhite/50"><Hash className="h-3.5 w-3.5" /> Hashtags (comma separated)</label>
          <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="anime, gaming, art"
            className="w-full rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/20 focus:border-primary/40 focus:outline-none" />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between border-t border-dark-gray/20 pt-4">
          <div className="flex gap-2">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-[8px] bg-surface px-3 py-2 font-body text-[12px] text-offwhite hover:bg-white/5 hover:text-white" type="button">
              <ImageIcon className="h-4 w-4" /> Upload Image
            </button>
            <input ref={fileRef} type="file" accept="image/*,video/*" onChange={handleFileSelect} className="hidden" />
          </div>
          <button onClick={handlePost} disabled={!content.trim() || posting}
            className="flex items-center gap-2 rounded-[8px] bg-primary px-5 py-2.5 font-body text-[13px] font-bold text-black hover:bg-primary/90 disabled:opacity-50">
            <Send className="h-4 w-4" /> {posting ? "Publishing..." : "Publish"}
          </button>
        </div>

        {success && <motion.p className="mt-3 font-body text-[13px] text-green-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>✓ Published to Guild Feed!</motion.p>}
      </motion.div>
    </div>
  );
}
