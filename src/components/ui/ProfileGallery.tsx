"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";
import { X, ChevronLeft, ChevronRight, Plus, Heart, MessageCircle, Image as ImageIcon } from "lucide-react";

interface GalleryImage {
  id: number;
  image_url: string;
  title: string | null;
  description: string | null;
  user_id: string;
}

interface Props {
  userId: string;
  isOwner: boolean;
}

export function ProfileGallery({ userId, isOwner }: Props) {
  const { user } = useAuth();
  const [images, setImages] = useState<GalleryImage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("profile_gallery").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(9)
      .then(({ data }) => { if (data) setImages(data); });
  }, [userId]);

  const handleUpload = async () => {
    if (!file || !user) return;
    setUploading(true);
    const imageUrl = await uploadFile(file, "profile-gallery");
    if (imageUrl) {
      const supabase = createClient();
      const { data } = await supabase.from("profile_gallery").insert({
        user_id: user.id, image_url: imageUrl, title: title || null, description: description || null,
      }).select().single();
      if (data) setImages((prev) => [data, ...prev].slice(0, 9));
    }
    setTitle(""); setDescription(""); setFile(null); setShowUpload(false); setUploading(false);
  };

  const handleDelete = async (id: number) => {
    const supabase = createClient();
    await supabase.from("profile_gallery").delete().eq("id", id);
    setImages((prev) => prev.filter((img) => img.id !== id));
    setSelectedIndex(null);
  };

  if (images.length === 0 && !isOwner) return null;

  return (
    <>
      <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="flex items-center gap-2 font-body text-[13px] font-semibold text-white">
            <ImageIcon className="h-4 w-4 text-primary" /> Gallery
          </h2>
          {isOwner && (
            <button onClick={() => setShowUpload(!showUpload)} className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 font-body text-[10px] text-primary hover:bg-primary/20">
              <Plus className="h-3 w-3" /> Add
            </button>
          )}
        </div>

        {/* Upload form (owner only) */}
        {showUpload && isOwner && (
          <motion.div className="mb-3 rounded-[8px] border border-dark-gray/30 bg-background/30 p-3" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Title (optional)"
              className="mb-2 w-full rounded-[6px] border border-dark-gray/30 bg-background/40 px-3 py-1.5 font-body text-[11px] text-white placeholder:text-offwhite/25 focus:outline-none" />
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)"
              className="mb-2 w-full rounded-[6px] border border-dark-gray/30 bg-background/40 px-3 py-1.5 font-body text-[11px] text-white placeholder:text-offwhite/25 focus:outline-none" />
            <div className="flex gap-2">
              <button onClick={() => fileRef.current?.click()} className="rounded-[4px] bg-surface px-2 py-1 font-body text-[10px] text-offwhite hover:text-white" type="button">
                {file ? file.name.slice(0, 15) + "..." : "Choose image"}
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
              <button onClick={handleUpload} disabled={!file || uploading} className="rounded-[4px] bg-primary px-3 py-1 font-body text-[10px] font-bold text-black disabled:opacity-50">
                {uploading ? "..." : "Upload"}
              </button>
            </div>
          </motion.div>
        )}

        {/* 3x3 Grid */}
        {images.length === 0 ? (
          <p className="font-body text-[11px] text-offwhite/30 italic">No images yet{isOwner ? " — add some!" : "."}</p>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            {images.slice(0, 9).map((img, i) => (
              <button key={img.id} onClick={() => setSelectedIndex(i)} className="group relative aspect-square overflow-hidden rounded-[6px] border border-dark-gray/20">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={img.image_url} alt={img.title || ""} className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-105" loading="lazy" />
                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/30" />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Modal/Carousel */}
      <AnimatePresence>
        {selectedIndex !== null && images[selectedIndex] && (
          <GalleryModal
            images={images}
            index={selectedIndex}
            onClose={() => setSelectedIndex(null)}
            onPrev={() => setSelectedIndex((prev) => prev !== null ? (prev - 1 + images.length) % images.length : null)}
            onNext={() => setSelectedIndex((prev) => prev !== null ? (prev + 1) % images.length : null)}
            isOwner={isOwner}
            onDelete={handleDelete}
            currentUserId={user?.id}
          />
        )}
      </AnimatePresence>
    </>
  );
}

function GalleryModal({ images, index, onClose, onPrev, onNext, isOwner, onDelete, currentUserId }: {
  images: GalleryImage[]; index: number; onClose: () => void; onPrev: () => void; onNext: () => void; isOwner: boolean; onDelete: (id: number) => void; currentUserId?: string;
}) {
  const img = images[index];
  const [likedMap, setLikedMap] = useState<Record<number, boolean>>({});
  const [likeCountMap, setLikeCountMap] = useState<Record<number, number>>({});

  const liked = likedMap[img.id] || false;
  const likeCount = likeCountMap[img.id] || 0;

  const toggleLike = async () => {
    setLikedMap((prev) => ({ ...prev, [img.id]: !prev[img.id] }));
    setLikeCountMap((prev) => ({ ...prev, [img.id]: (prev[img.id] || 0) + (liked ? -1 : 1) }));

    // Persist to Supabase
    if (currentUserId) {
      try {
        const supabase = (await import("@/lib/supabase/client")).createClient();
        if (liked) {
          await supabase.from("gallery_reactions").delete().eq("gallery_item_id", img.id).eq("user_id", currentUserId);
        } else {
          await supabase.from("gallery_reactions").insert({ gallery_item_id: img.id, user_id: currentUserId });
          // Award XP
          const { awardClientXP } = await import("@/lib/xp-client");
          awardClientXP(currentUserId, "reaction");
        }
      } catch {}
    }
  };

  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/85 backdrop-blur-sm" onClick={onClose} />

      {/* Nav buttons */}
      {images.length > 1 && (
        <>
          <button onClick={onPrev} className="absolute left-4 z-20 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronLeft className="h-5 w-5" /></button>
          <button onClick={onNext} className="absolute right-4 z-20 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><ChevronRight className="h-5 w-5" /></button>
        </>
      )}
      <button onClick={onClose} className="absolute top-4 right-4 z-20 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"><X className="h-5 w-5" /></button>

      <motion.div className="relative z-10 max-h-[85vh] w-full max-w-[550px] overflow-y-auto rounded-[14px] border border-dark-gray/40 bg-background p-5" initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }} key={img.id}>
        {/* Image */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={img.image_url} alt={img.title || ""} className="mb-4 w-full rounded-[10px] object-contain max-h-[400px]" />

        {/* Details */}
        {img.title && <h3 className="mb-1 font-body text-[16px] font-semibold text-white">{img.title}</h3>}
        {img.description && <p className="mb-3 font-body text-[13px] text-offwhite/70">{img.description}</p>}

        {/* Actions */}
        <div className="flex items-center gap-3 border-t border-dark-gray/20 pt-3">
          <button onClick={toggleLike}
            className={`flex items-center gap-1 rounded-full px-3 py-1 font-body text-[11px] ${liked ? "bg-red-500/10 text-red-400" : "text-offwhite/40 hover:text-offwhite"}`}>
            <Heart className={`h-3.5 w-3.5 ${liked ? "fill-current" : ""}`} /> {likeCount || ""}
          </button>
          <span className="font-body text-[10px] text-offwhite/20">{index + 1} / {images.length}</span>
          {isOwner && (
            <button onClick={() => onDelete(img.id)} className="ml-auto font-body text-[10px] text-red-400/60 hover:text-red-400">Delete</button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
