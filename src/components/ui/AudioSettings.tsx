"use client";

import { useState, useEffect } from "react";
import { audioManager } from "@/lib/audio";
import type { AudioSettings as AudioSettingsType } from "@/lib/audio";
import { Volume2, VolumeX, Music, Zap } from "lucide-react";

export function AudioSettingsPanel({ onClose }: { onClose?: () => void }) {
  const [settings, setSettings] = useState<AudioSettingsType>(audioManager.getSettings());

  const update = () => setSettings(audioManager.getSettings());

  return (
    <div className="w-[260px] rounded-[12px] border border-dark-gray/30 bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-body text-[13px] font-semibold text-white flex items-center gap-2">
          <Volume2 className="h-4 w-4 text-primary" /> Audio
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-offwhite/40 hover:text-white text-[14px]">✕</button>
        )}
      </div>

      {/* Master Volume */}
      <VolumeSlider
        label="Master"
        value={settings.masterVolume}
        onChange={(v) => { audioManager.setMasterVolume(v); update(); }}
      />

      {/* Music Volume + Mute */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { audioManager.toggleMusicMute(); update(); }}
          className={`rounded-full p-1 ${settings.musicMuted ? "text-red-400" : "text-primary"}`}
        >
          <Music className="h-3.5 w-3.5" />
        </button>
        <VolumeSlider
          label="Music"
          value={settings.musicVolume}
          onChange={(v) => { audioManager.setMusicVolume(v); update(); }}
          muted={settings.musicMuted}
        />
      </div>

      {/* SFX Volume + Mute */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => { audioManager.toggleSfxMute(); update(); }}
          className={`rounded-full p-1 ${settings.sfxMuted ? "text-red-400" : "text-primary"}`}
        >
          <Zap className="h-3.5 w-3.5" />
        </button>
        <VolumeSlider
          label="SFX"
          value={settings.sfxVolume}
          onChange={(v) => { audioManager.setSfxVolume(v); update(); }}
          muted={settings.sfxMuted}
        />
      </div>
    </div>
  );
}

function VolumeSlider({ label, value, onChange, muted }: { label: string; value: number; onChange: (v: number) => void; muted?: boolean }) {
  return (
    <div className="mb-2 flex-1">
      <div className="flex items-center justify-between mb-1">
        <span className="font-body text-[10px] text-offwhite/50">{label}</span>
        <span className="font-body text-[9px] text-offwhite/30">{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0} max={100} value={Math.round(value * 100)}
        onChange={(e) => onChange(parseInt(e.target.value) / 100)}
        className={`w-full h-1.5 rounded-full appearance-none cursor-pointer ${muted ? "opacity-40" : ""}`}
        style={{ background: `linear-gradient(to right, #C3B1FF ${value * 100}%, #484848 ${value * 100}%)` }}
      />
    </div>
  );
}
