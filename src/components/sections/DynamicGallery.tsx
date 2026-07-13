"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Container } from "@/components/layout/Container";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { useSupabaseQuery } from "@/hooks/useSupabaseData";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import { galleryItems as fallbackItems, galleryCategories, type GalleryCategory, type GalleryItem } from "@/data/gallery";
import { X, ChevronLeft, ChevronRight, ZoomIn, Heart } from "lucide-react";

interface DbGalleryItem {
  id: number;
  title: string;
  category: string;
  image_url: string;
  alt_text: string;
}

function Lightbox({ item, onClose, onPrev, onNext }: { item: GalleryItem; onClose: () => void; onPrev: () => void; onNext: () => void }) {
  return (
    <motion.div className="fixed inset-0 z-[100] flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <div className="absolute inset-0 bg-black/90" onClick={onClose} />
      <button onClick={onClose} className="absolute top-4 right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Close"><X className="h-5 w-5" /></button>
      <button onClick={onPrev} className="absolute left-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Previous"><ChevronLeft className="h-5 w-5" /></button>
      <button onClick={onNext} className="absolute right-4 z-20 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20" aria-label="Next"><ChevronRight className="h-5 w-5" /></button>
      <motion.div className="relative z-10 max-h-[80vh] max-w-[85vw] overflow-hidden rounded-[12px]" initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} key={item.id}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={item.src} alt={item.alt} className="max-h-[80vh] w-auto object-contain" />
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-8">
          <p className="font-body text-[15px] font-medium text-white">{item.title}</p>
          <p className="font-body text-[12px] text-offwhite/60">{item.category}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

export function DynamicGallery() {
  const { data, loading } = useSupabaseQuery<DbGalleryItem>("gallery", {
    order: { column: "created_at", ascending: false },
    limit: 12,
  });

  const [activeCategory, setActiveCategory] = useState<GalleryCategory>("All");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Map DB data to GalleryItem format, or use fallback
  const items: GalleryItem[] = data.length > 0
    ? data.map((g) => ({
        id: String(g.id),
        title: g.title,
        category: g.category || "Events",
        src: g.image_url,
        alt: g.alt_text || g.title,
        width: 800,
        height: 600,
      }))
    : fallbackItems;

  const filtered = activeCategory === "All" ? items : items.filter((i) => i.category === activeCategory);

  const openLightbox = useCallback((i: number) => setLightboxIndex(i), []);
  const closeLightbox = useCallback(() => setLightboxIndex(null), []);
  const goNext = useCallback(() => setLightboxIndex((p) => p !== null ? (p + 1) % filtered.length : null), [filtered.length]);
  const goPrev = useCallback(() => setLightboxIndex((p) => p !== null ? (p - 1 + filtered.length) % filtered.length : null), [filtered.length]);

  return (
    <>
      <section id="gallery" aria-label="Gallery" className="py-16 md:py-20">
        <Container>
          <div className="mb-10 flex flex-col gap-3">
            <motion.p className="font-body text-[14px] font-semibold uppercase tracking-widest text-primary" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
              Captured Moments
            </motion.p>
            <SectionHeading>Gallery</SectionHeading>
          </div>

          {/* Filter */}
          <div className="mb-6 flex flex-wrap gap-2">
            {galleryCategories.map((cat) => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`rounded-full border px-3.5 py-1.5 font-body text-[12px] font-medium transition-all ${activeCategory === cat ? "border-primary bg-primary/10 text-primary" : "border-dark-gray/40 text-offwhite/50 hover:text-offwhite"}`}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="columns-1 gap-3 sm:columns-2 lg:columns-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mb-3 h-48 animate-pulse break-inside-avoid rounded-[10px] bg-surface/30" />
              ))}
            </div>
          ) : (
            <motion.div className="columns-1 gap-3 sm:columns-2 lg:columns-3" layout>
              <AnimatePresence mode="popLayout">
                {filtered.map((item, index) => (
                  <motion.div key={item.id} layout initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.25 }} className="mb-3 break-inside-avoid">
                    <div className="group relative w-full overflow-hidden rounded-[10px] border border-dark-gray/20 transition-all hover:border-primary/30">
                      <button onClick={() => openLightbox(index)} className="w-full" aria-label={`View ${item.title}`}>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.src} alt={item.alt} className="w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/40">
                          <ZoomIn className="h-7 w-7 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                        </div>
                      </button>
                      {/* Heart react */}
                      <GalleryHeart galleryId={item.id} />
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </Container>
      </section>

      <AnimatePresence>
        {lightboxIndex !== null && filtered[lightboxIndex] && (
          <Lightbox item={filtered[lightboxIndex]} onClose={closeLightbox} onPrev={goPrev} onNext={goNext} />
        )}
      </AnimatePresence>
    </>
  );
}


// Heart reaction component for each gallery item
function GalleryHeart({ galleryId }: { galleryId: string }) {
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    // Fetch count
    supabase.from("gallery_reactions").select("id", { count: "exact", head: true }).eq("gallery_id", galleryId)
      .then(({ count: c }) => setCount(c || 0));
    // Check if user liked
    if (user) {
      supabase.from("gallery_reactions").select("id").eq("gallery_id", galleryId).eq("user_id", user.id).single()
        .then(({ data }) => { if (data) setLiked(true); });
    }
    // Realtime
    const channel = supabase.channel(`gallery-heart-${galleryId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "gallery_reactions", filter: `gallery_id=eq.${galleryId}` }, () => {
        supabase.from("gallery_reactions").select("id", { count: "exact", head: true }).eq("gallery_id", galleryId)
          .then(({ count: c }) => setCount(c || 0));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [galleryId, user]);

  const toggleHeart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    const supabase = createClient();
    if (liked) {
      await supabase.from("gallery_reactions").delete().eq("gallery_id", galleryId).eq("user_id", user.id);
      setLiked(false); setCount(c => Math.max(0, c - 1));
    } else {
      await supabase.from("gallery_reactions").insert({ gallery_id: galleryId, user_id: user.id });
      setLiked(true); setCount(c => c + 1);
    }
  };

  return (
    <button onClick={toggleHeart} className="absolute bottom-2 right-2 z-10 flex items-center gap-1 rounded-full bg-black/50 px-2 py-1 backdrop-blur-sm transition-all hover:bg-black/70">
      <Heart className={`h-3.5 w-3.5 transition-colors ${liked ? "text-red-400 fill-red-400" : "text-white/60"}`} />
      {count > 0 && <span className="font-body text-[10px] text-white/70">{count}</span>}
    </button>
  );
}
