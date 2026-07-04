"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Plus, Send, ImageIcon, Hash, Trash2, Video } from "lucide-react";

const categoryOptions = ["general", "announcement", "artwork", "gaming", "anime", "meme"];

export default function AdminPostsPage() {
  const { user } = useAuth();
  const [content, setContent] = useState("");
  const [category, setCategory] = useState("general");
  const [hashtags, setHashtags] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [posting, setPosting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [recentPosts, setRecentPosts] = useState<{ id: number; content: string; category: string; created_at: string }[]>([]);

  const handlePost = async () => {
    if (!content.trim() || !user) return;
    setPosting(true);

    const supabase = createClient();
    const fullContent = hashtags ? `${content}\n\n${hashtags.split(",").map((t) => `#${t.trim()}`).join(" ")}` : content;

    const { data, error } = await supabase.from("posts").insert({
      user_id: user.id,
      content: fullContent,
      image_url: imageUrl || null,
      category,
      is_pinned: category === "announcement",
    }).select().single();

    setPosting(false);
    if (!error && data) {
      setSuccess(true);
      setRecentPosts((prev) => [data, ...prev]);
      setContent("");
      setHashtags("");
      setImageUrl("");
      setTimeout(() => setSuccess(false), 3000);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-[32px] text-white md:text-[40px]">Create Post</h1>
        <p className="font-body text-[15px] text-offwhite/60">Publish content to the Guild Feed.</p>
      </div>

      {/* Composer */}
      <motion.div
        className="mb-8 rounded-[14px] border border-dark-gray/30 bg-surface/20 p-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
      >
        {/* Category selector */}
        <div className="mb-4">
          <label className="mb-2 block font-body text-[12px] font-medium text-offwhite/50">Category</label>
          <div className="flex flex-wrap gap-2">
            {categoryOptions.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`rounded-full px-3 py-1.5 font-body text-[12px] font-medium capitalize transition-all ${
                  category === cat ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-background/30 text-offwhite/40 hover:text-offwhite"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={4}
          placeholder="Write your post content..."
          className="mb-4 w-full resize-none rounded-[10px] border border-dark-gray/30 bg-background/40 px-4 py-3 font-body text-[14px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none"
        />

        {/* Image/Video URL */}
        <div className="mb-4">
          <label className="mb-1.5 flex items-center gap-1.5 font-body text-[12px] text-offwhite/50">
            <ImageIcon className="h-3.5 w-3.5" /> Image or Video URL (optional)
          </label>
          <input
            type="text"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="https://... or /images/filename.jpg"
            className="w-full rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/20 focus:border-primary/40 focus:outline-none"
          />
        </div>

        {/* Hashtags */}
        <div className="mb-5">
          <label className="mb-1.5 flex items-center gap-1.5 font-body text-[12px] text-offwhite/50">
            <Hash className="h-3.5 w-3.5" /> Hashtags (comma separated)
          </label>
          <input
            type="text"
            value={hashtags}
            onChange={(e) => setHashtags(e.target.value)}
            placeholder="e.g. anime, gaming, art"
            className="w-full rounded-[8px] border border-dark-gray/30 bg-background/40 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/20 focus:border-primary/40 focus:outline-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <p className="font-body text-[11px] text-offwhite/30">
            {category === "announcement" ? "📌 Will be pinned automatically" : `Posting as: ${category}`}
          </p>
          <button
            onClick={handlePost}
            disabled={!content.trim() || posting}
            className="flex items-center gap-2 rounded-[8px] bg-primary px-5 py-2.5 font-body text-[13px] font-bold text-black transition-all hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="h-4 w-4" />
            {posting ? "Publishing..." : "Publish Post"}
          </button>
        </div>

        {success && (
          <motion.p className="mt-3 font-body text-[13px] text-green-400" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            ✓ Post published to Guild Feed!
          </motion.p>
        )}
      </motion.div>

      {/* Recent posts by admin */}
      {recentPosts.length > 0 && (
        <div>
          <h2 className="mb-4 font-body text-[16px] font-semibold text-white">Just Posted</h2>
          <div className="flex flex-col gap-3">
            {recentPosts.map((p) => (
              <div key={p.id} className="rounded-[10px] border border-dark-gray/20 bg-surface/20 p-4">
                <p className="font-body text-[13px] text-offwhite/80 whitespace-pre-wrap">{p.content}</p>
                <p className="mt-2 font-body text-[10px] text-offwhite/30 capitalize">{p.category} · Just now</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
