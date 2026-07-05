"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { uploadFile } from "@/lib/upload";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";

interface GalleryItem { id: number; title: string; category: string | null; image_url: string; created_at: string; }

const galleryCategories = ["Events", "Cosplay", "Art", "Community", "Gaming"];

export default function AdminGalleryPage() {
  const { user } = useAuth();
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("Events");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
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
      const { data, error } = await supabase.from("gallery").insert({ title, category, image_url: imageUrl, uploaded_by: user.id }).select().single();
      if (!error && data) {
        setItems((prev) => [data, ...prev]);
        setTitle(""); setCategory("Events"); setFile(null); setPreview(null); setShowForm(false);
      }
    }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    const supabase = createClient();
    await supabase.from("gallery").delete().eq("id", id);
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[30px] text-white md:text-[38px]">Gallery</h1>
          <p className="font-body text-[13px] text-offwhite/50">Upload images that appear on the homepage gallery ({items.length} items)</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="flex items-center gap-2 rounded-[8px] bg-primary px-4 py-2 font-body text-[12px] font-bold text-black hover:bg-primary/90">
          <Plus className="h-4 w-4" /> Upload
        </button>
      </div>

      {showForm && (
        <motion.div className="mb-6 rounded-[12px] border border-dark-gray/30 bg-surface/20 p-5" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <div className="flex flex-col gap-3">
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Image title"
              className="rounded-[6px] border border-dark-gray/30 bg-background/50 px-3 py-2 font-body text-[13px] text-white placeholder:text-offwhite/30 focus:border-primary/40 focus:outline-none" />
            <div className="flex flex-wrap gap-2">
              {galleryCategories.map((c) => (
                <button key={c} onClick={() => setCategory(c)} className={`rounded-full px-3 py-1 font-body text-[11px] font-medium ${category === c ? "bg-primary/15 text-primary ring-1 ring-primary/30" : "bg-background/30 text-offwhite/40"}`}>{c}</button>
              ))}
            </div>
            {preview && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={preview} alt="" className="h-32 w-auto rounded-[6px] object-cover" />
            )}
            <div className="flex gap-3">
              <button onClick={() => fileRef.current?.click()} className="flex items-center gap-1.5 rounded-[6px] bg-surface px-3 py-2 font-body text-[11px] text-offwhite hover:text-white" type="button">
                <ImageIcon className="h-3.5 w-3.5" /> Choose Image
              </button>
              <input ref={fileRef} type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) { setFile(f); setPreview(URL.createObjectURL(f)); } }} className="hidden" />
              <button onClick={handleUpload} disabled={!title || !file || uploading}
                className="rounded-[6px] bg-primary px-4 py-2 font-body text-[11px] font-bold text-black hover:bg-primary/90 disabled:opacity-50">
                {uploading ? "Uploading..." : "Upload to Gallery"}
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {loading ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-32 animate-pulse rounded-[10px] bg-surface/30" />)}</div>
      ) : items.length === 0 ? (
        <p className="font-body text-[13px] text-offwhite/40">No gallery items yet. Upload one above.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div key={item.id} className="group relative overflow-hidden rounded-[10px] border border-dark-gray/30 bg-surface/20">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.image_url} alt={item.title} className="h-32 w-full object-cover" />
              <div className="p-3">
                <p className="font-body text-[12px] font-medium text-white">{item.title}</p>
                <p className="font-body text-[10px] text-offwhite/40">{item.category}</p>
              </div>
              <button onClick={() => handleDelete(item.id)} className="absolute top-2 right-2 rounded-full bg-black/50 p-1.5 text-white opacity-0 transition-opacity group-hover:opacity-100 hover:bg-red-500">
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
