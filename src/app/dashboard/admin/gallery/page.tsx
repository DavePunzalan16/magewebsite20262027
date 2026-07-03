"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

const mockGallery = [
  { id: "1", title: "Convention Opening", category: "Events" },
  { id: "2", title: "Officers Photo", category: "Community" },
  { id: "3", title: "Art Workshop", category: "Art" },
  { id: "4", title: "Cosplay Showcase", category: "Cosplay" },
  { id: "5", title: "Gaming Tournament", category: "Events" },
];

export default function AdminGalleryPage() {
  const [items, setItems] = useState(mockGallery);

  const deleteItem = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-display text-[36px] text-white">Gallery Manager</h1>
          <p className="font-body text-[16px] text-offwhite">Upload and manage gallery images.</p>
        </div>
        <Button><Plus className="mr-1 h-4 w-4" /> Upload</Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <motion.div
            key={item.id}
            className="group relative flex items-center gap-3 rounded-[10px] border border-dark-gray/30 bg-surface/20 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.04 }}
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-[8px] bg-primary/10">
              <ImageIcon className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-body text-[14px] font-medium text-white">{item.title}</p>
              <p className="font-body text-[12px] text-offwhite/60">{item.category}</p>
            </div>
            <button onClick={() => deleteItem(item.id)} className="rounded p-1.5 text-offwhite/50 opacity-0 transition-opacity group-hover:opacity-100 hover:text-red-400">
              <Trash2 className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
