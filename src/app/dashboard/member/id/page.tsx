"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/components/providers/AuthProvider";
import QRCode from "qrcode";
import Image from "next/image";
import { siteConfig } from "@/data/portfolio";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function MemberIDPage() {
  const { user } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const memberData = {
    id: user?.id?.slice(0, 8) || "MAGE-001",
    name: user?.user_metadata?.full_name || user?.email || "Guild Member",
    email: user?.email || "",
    role: "Member",
    since: "A.Y. 2026-2027",
  };

  useEffect(() => {
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, JSON.stringify({
        guild: "MAGE",
        id: memberData.id,
        name: memberData.name,
        email: memberData.email,
      }), {
        width: 180,
        margin: 2,
        color: { dark: "#C3B1FF", light: "#1A1A1A" },
      });
    }
  }, [memberData.id, memberData.name, memberData.email]);

  const downloadID = () => {
    if (canvasRef.current) {
      const link = document.createElement("a");
      link.download = `MAGE-ID-${memberData.id}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div>
      <h1 className="mb-2 font-display text-[36px] text-white">My QR ID</h1>
      <p className="mb-8 font-body text-[16px] text-offwhite">Your digital guild membership card.</p>

      <motion.div
        className="mx-auto max-w-[380px] overflow-hidden rounded-[16px] border border-primary/30 bg-gradient-to-b from-surface to-background"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        {/* Card header */}
        <div className="flex items-center gap-3 bg-primary/10 p-4">
          <Image src={siteConfig.iconImage} alt="M.A.G.E." width={40} height={40} className="rounded-full" />
          <div>
            <p className="font-display text-[18px] text-white">M.A.G.E. Guild</p>
            <p className="font-body text-[11px] text-offwhite/60">UE Caloocan · {memberData.since}</p>
          </div>
        </div>

        {/* QR Code */}
        <div className="flex flex-col items-center gap-4 p-6">
          <div className="rounded-[12px] border border-dark-gray/30 bg-surface p-4">
            <canvas ref={canvasRef} />
          </div>

          {/* Member info */}
          <div className="text-center">
            <p className="font-body text-[18px] font-semibold text-white">{memberData.name}</p>
            <p className="font-body text-[13px] text-offwhite">{memberData.email}</p>
            <p className="mt-1 font-body text-[12px] font-bold uppercase tracking-wider text-primary">
              {memberData.role} · ID: {memberData.id}
            </p>
          </div>
        </div>

        {/* Download button */}
        <div className="border-t border-dark-gray/30 p-4">
          <Button onClick={downloadID} className="w-full" variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download QR Code
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
