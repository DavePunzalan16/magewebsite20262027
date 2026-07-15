// Lightweight sound utility for arcade game UI
// Uses the existing Sound files in /public/Sound/

const audioCache = new Map<string, HTMLAudioElement>();

function getAudio(src: string): HTMLAudioElement {
  if (typeof window === "undefined") return new Audio();
  let audio = audioCache.get(src);
  if (!audio) {
    audio = new Audio(src);
    audio.volume = 0.3;
    audioCache.set(src, audio);
  }
  return audio;
}

export function playClick() {
  try {
    const audio = getAudio("/Sound/button_click.mp3");
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}

export function playHover() {
  try {
    const audio = getAudio("/Sound/button_hover.mp3");
    audio.currentTime = 0;
    audio.volume = 0.15;
    audio.play().catch(() => {});
  } catch {}
}

export function playBack() {
  try {
    const audio = getAudio("/Sound/button_back.mp3");
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}

export function playGameStart() {
  try {
    const audio = getAudio("/Sound/game_start.mp3");
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}

export function playAchievement() {
  try {
    const audio = getAudio("/Sound/achievement_unlock.mp3");
    audio.currentTime = 0;
    audio.play().catch(() => {});
  } catch {}
}
