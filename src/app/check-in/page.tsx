"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import { motion } from "framer-motion";
import { QrCode, CheckCircle2, XCircle, ArrowLeft, Search, Camera } from "lucide-react";

interface EventItem { id: number; title: string; date: string | null; }

export default function CheckInPage() {
  const { user } = useAuth();
  const [events, setEvents] = useState<EventItem[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<number | null>(null);
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const scannerInstanceRef = useRef<any>(null);
  const [recentCheckins, setRecentCheckins] = useState<{ name: string; time: string }[]>([]);

  // Only admin can access
  const isAdmin = user?.email === "admin@gmail.com";

  useEffect(() => {
    const supabase = createClient();
    supabase.from("events").select("id, title, date").order("created_at", { ascending: false }).limit(10)
      .then(({ data }) => { if (data) setEvents(data); });
  }, []);

  // Camera QR scanner
  const startCamera = useCallback(async () => {
    if (!scannerRef.current) return;
    try {
      const { Html5Qrcode } = await import("html5-qrcode");
      const scanner = new Html5Qrcode("qr-scanner-region");
      scannerInstanceRef.current = scanner;
      setCameraActive(true);
      await scanner.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          setUserId(decodedText);
          stopCamera();
        },
        () => {} // ignore errors during scanning
      );
    } catch (err) {
      setResult({ success: false, message: "Camera access denied or not available." });
    }
  }, []);

  const stopCamera = useCallback(async () => {
    if (scannerInstanceRef.current) {
      try {
        await scannerInstanceRef.current.stop();
        scannerInstanceRef.current.clear();
      } catch {}
      scannerInstanceRef.current = null;
    }
    setCameraActive(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => { return () => { stopCamera(); }; }, [stopCamera]);

  const handleCheckIn = async () => {
    if (!selectedEvent || !userId.trim()) return;
    setLoading(true);
    setResult(null);

    // Parse QR data (could be JSON or plain UUID)
    let parsedUserId = userId.trim();
    try {
      const parsed = JSON.parse(userId);
      if (parsed.user_id) parsedUserId = parsed.user_id;
      else if (parsed.id) parsedUserId = parsed.id;
    } catch {
      // Not JSON — treat as plain user ID
    }

    const supabase = createClient();
    // Check if registered
    const { data: reg } = await supabase.from("event_registrations").select("id").eq("event_id", selectedEvent).eq("user_id", parsedUserId).single();

    if (!reg) {
      setResult({ success: false, message: "User is NOT registered for this event." });
      setLoading(false);
      return;
    }

    // Check if already checked in
    const { data: existing } = await supabase.from("attendance").select("id").eq("event_id", selectedEvent).eq("user_id", parsedUserId).single();
    if (existing) {
      setResult({ success: false, message: "User already checked in." });
      setLoading(false);
      return;
    }

    // Mark attendance
    const { error } = await supabase.from("attendance").insert({ event_id: selectedEvent, user_id: parsedUserId, status: "present" });

    if (error) {
      setResult({ success: false, message: `Error: ${error.message}` });
    } else {
      // Get name for display
      const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", parsedUserId).single();
      const name = profile?.full_name || "Member";
      setResult({ success: true, message: `✓ ${name} checked in successfully!` });
      setRecentCheckins((prev) => [{ name, time: new Date().toLocaleTimeString() }, ...prev.slice(0, 9)]);
    }

    setUserId("");
    setLoading(false);
  };

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="text-center">
          <QrCode className="mx-auto mb-4 h-12 w-12 text-offwhite/30" />
          <h1 className="font-display text-[24px] text-white">Admin Only</h1>
          <p className="mt-2 font-body text-[13px] text-offwhite/50">This page is for event check-in by admins/officers.</p>
          <Link href="/" className="mt-4 inline-block rounded-full bg-primary/10 px-4 py-2 font-body text-[12px] text-primary hover:bg-primary/20">← Back to Home</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="mx-auto max-w-[600px]">
        <Link href="/dashboard/admin" className="mb-6 inline-flex items-center gap-1.5 font-body text-[12px] text-offwhite/50 hover:text-primary">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Dashboard
        </Link>

        <div className="mb-8 text-center">
          <QrCode className="mx-auto mb-3 h-10 w-10 text-primary" />
          <h1 className="font-display text-[28px] text-white md:text-[36px]">Event Check-In</h1>
          <p className="font-body text-[13px] text-offwhite/50">Scan member QR code or enter their User ID to mark attendance.</p>
        </div>

        {/* Event selector */}
        <div className="mb-5">
          <label className="mb-1.5 block font-body text-[12px] font-medium text-offwhite/60">Select Event</label>
          <select
            value={selectedEvent || ""}
            onChange={(e) => setSelectedEvent(parseInt(e.target.value) || null)}
            className="w-full rounded-[8px] border border-dark-gray/30 bg-surface/30 px-4 py-3 font-body text-[14px] text-white focus:border-primary/40 focus:outline-none"
          >
            <option value="">Choose an event...</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>{e.title} {e.date ? `(${e.date})` : ""}</option>
            ))}
          </select>
        </div>

        {/* User ID input (from QR scan result) */}
        <div className="mb-5">
          <label className="mb-1.5 block font-body text-[12px] font-medium text-offwhite/60">Member ID (from QR scan)</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCheckIn()}
              placeholder="Paste QR data or User UUID..."
              className="flex-1 rounded-[8px] border border-dark-gray/30 bg-surface/30 px-4 py-3 font-body text-[14px] text-white placeholder:text-offwhite/25 focus:border-primary/40 focus:outline-none"
            />
            <button
              onClick={handleCheckIn}
              disabled={!selectedEvent || !userId.trim() || loading}
              className="flex items-center gap-2 rounded-[8px] bg-primary px-5 py-3 font-body text-[13px] font-bold text-black hover:bg-primary/90 disabled:opacity-50"
            >
              <Search className="h-4 w-4" />
              {loading ? "..." : "Check In"}
            </button>
          </div>
        </div>

        {/* Camera Scanner */}
        <div className="mb-5">
          <button
            onClick={cameraActive ? stopCamera : startCamera}
            className={`flex w-full items-center justify-center gap-2 rounded-[8px] border px-4 py-3 font-body text-[13px] font-medium transition-all ${
              cameraActive ? "border-red-500/30 bg-red-500/5 text-red-400 hover:bg-red-500/10" : "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
            }`}
          >
            <Camera className="h-4 w-4" />
            {cameraActive ? "Stop Camera" : "📷 Scan QR with Camera"}
          </button>
          {cameraActive && (
            <div className="mt-3 overflow-hidden rounded-[10px] border border-dark-gray/30">
              <div id="qr-scanner-region" ref={scannerRef} className="w-full" />
            </div>
          )}
        </div>

        {/* Result */}
        {result && (
          <motion.div
            className={`mb-5 rounded-[10px] p-4 ${result.success ? "border border-green-500/20 bg-green-500/5" : "border border-red-500/20 bg-red-500/5"}`}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center gap-2">
              {result.success ? <CheckCircle2 className="h-5 w-5 text-green-400" /> : <XCircle className="h-5 w-5 text-red-400" />}
              <p className={`font-body text-[13px] ${result.success ? "text-green-400" : "text-red-400"}`}>{result.message}</p>
            </div>
          </motion.div>
        )}

        {/* Recent check-ins */}
        {recentCheckins.length > 0 && (
          <div className="rounded-[12px] border border-dark-gray/30 bg-surface/20 p-4">
            <h2 className="mb-3 font-body text-[13px] font-semibold text-white">Recent Check-ins</h2>
            <div className="flex flex-col gap-1.5">
              {recentCheckins.map((c, i) => (
                <div key={i} className="flex items-center justify-between rounded-[6px] bg-background/20 px-3 py-2">
                  <span className="font-body text-[12px] text-offwhite/70">{c.name}</span>
                  <span className="font-body text-[10px] text-offwhite/30">{c.time}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
