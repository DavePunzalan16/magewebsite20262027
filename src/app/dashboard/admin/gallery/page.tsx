"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";
import { Plus, Trash2, Image as ImageIcon, Star, Edit3, X } from "lucide-react";

interface GalleryItem {
  id: number;
  title: string;
  category: string | null;
  image_url: string;
  alt_text: string | null;
  is_featured: boolean;
  created_at: string;
}

const galleryCategories = ["Events", "Cosplay", "Art", "Community", "Gaming", "Officers"];

export default function AdminGalleryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Events");
  const [altText, setAltText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editAlt, setEditAlt] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.from("gallery").select("*").order("created_at", { ascending: false })
      .then(({ data }) => { if (data) setItems(data); setLoading(false); });
  }, []);

  const handleUpload = async () => {
    if (!title || !file || !user) return;
    setUploading(true);
    const imageUrl = await uploadFile(file, "gallery");
    if (imageUrl) {
      const supabase = createClient();
      const { data, error } = await supabase.from("gallery").insert({
        title, category, image_url: imageUrl, alt_text: altText || null, uploaded_by: user.id, is_featured: false,
      }).select().single();
      if (!error && data) {
        setItems((prev) => [data, ...prev]);
        setTitle(""); setCategory("Events"); setAltText(""); setFile(null); setPreview(null); setShowForm(false);
      }
    }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    const supabase = createClient();
    await supabase.from("gallery").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  const handleToggleFeatured = async (id: number, current: boolean) => {
    const supabase = createClient();
    await supabase.from("gallery").update({ is_featured: !current }).eq("id", id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, is_featured: !current } : i));
  };

  const handleSaveEdit = async (id: number) => {
    const supabase = createClient();
    await supabase.from("gallery").update({ title: editTitle, alt_text: editAlt || null }).eq("id", id);
    setItems((prev) => prev.map((i) => i.id === id ? { ...i, title: editTitle, alt_text: editAlt || null } : i));
    setEditingId(null);
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[30px] text-white md:text-[38px]">Gallery CMS</h1>
          <p className="font-body text-[13px] text-offwhite/50">Manage images for homepage gallery ({items.length} items)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-[8px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Upload
        </button>
      </div>

      {/* Upload form */}
      {showForm && (
        <motion.div className="mb-6 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
          <div className="grid gap-3 md:grid-cols-2">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Image title *"
              className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none" />
            <input type="text" value={altText} onChange={(e) => setAltText(e.target.value)} placeholder="Alt text (accessibility)"
              className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none" />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {galleryCategories.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 font-body text-[11px] font-medium ${category === c ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-background/30 text-offwhite/40"}`}>{c}</button>
            ))}
          </div>
          {preview && (
            <div className="relative mt-3 inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="" className="h-32 w-auto rounded-[8px] object-cover" />
              <button onClick={() => { setFile(null); setPreview(null); }} className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white"><X className="h-3 w-3" /></button>
            </div>
          )}
          <div className="mt-3 flex gap-3">
            <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-[6px] bg-surface px-3 py-2 font-body text-[11px] text-offwhite hover:text-white" type="button">
              <ImageIcon className="h-3.5 w-3.5" /> Choose File
            </button>
            <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} className="hidden" />
            <button onClick={handleUpload} disabled={!title || !file || uploading}
              className="rounded-[6px] bg-primary px-4 py-2 font-body text-[11px] font-bold text-black hover:bg-primary/90 disabled:opacity-50">
              {uploading ? "Uploading..." : "Upload"}
            </button>
          </div>
        </motion.div>
      )}

      {/* Gallery grid */}
      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-40 animate-pulse rounded-[10px] bg-surface/30" />)}</div>
      ) : items.length === 0 ? (
        <p className="font-body text-[13px] text-offwhite/40">No gallery items. Upload images above — they appear on the homepage.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-[10px] border border-dark-gray/30 bg-surface/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.alt_text || item.title} className="h-36 w-full object-cover" loading="lazy" />

              {/* Featured badge */}
              {item.is_featured && (
                <div className="absolute top-2 left-2 rounded-full bg-yellow-500/20 p-1"><Star className="h-3 w-3 text-yellow-400 fill-yellow-400" /></div>
              )}

              {/* Content */}
              <div className="p-3">
                {editingId === item.id ? (
                  <div className="flex flex-col gap-2">
                    <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                      className="rounded border border-dark-gray/30 bg-background/50 px-2 py-1 font-body text-[11px] text-white focus:outline-none" />
                    <input type="text" value={editAlt} onChange={(e) => setEditAlt(e.target.value)} placeholder="Alt text"
                      className="rounded border border-dark-gray/30 bg-background/50 px-2 py-1 font-body text-[11px] text-white focus:outline-none" />
                    <div className="flex gap-1">
                      <button onClick={() => handleSaveEdit(item.id)} className="rounded bg-primary px-2 py-0.5 font-body text-[10px] font-bold text-black">Save</button>
                      <button onClick={() => setEditingId(null)} className="rounded px-2 py-0.5 font-body text-[10px] text-offwhite/50">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <>
                    <p className="font-body text-[12px] font-medium text-white">{item.title}</p>
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 font-body text-[9px] text-primary">{item.category}</span>
                      <span className="font-body text-[9px] text-offwhite/25">{new Date(item.created_at).toLocaleDateString()}</span>
                    </div>
                  </>
                )}
              </div>

              {/* Hover actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button onClick={() => handleToggleFeatured(item.id, item.is_featured)} className={`rounded-full p-1.5 backdrop-blur-sm ${item.is_featured ? "bg-yellow-500/30 text-yellow-400" : "bg-black/50 text-white hover:text-yellow-400"}`} title="Toggle featured">
                  <Star className="h-3 w-3" />
                </button>
                <button onClick={() => { setEditingId(item.id); setEditTitle(item.title); setEditAlt(item.alt_text || ""); }} className="rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm hover:text-primary" title="Edit">
                  <Edit3 className="h-3 w-3" />
                </button>
                <button onClick={() => handleDelete(item.id)} className="rounded-full bg-black/50 p-1.5 text-white backdrop-blur-sm hover:text-red-400" title="Delete">
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
