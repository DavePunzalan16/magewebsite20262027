export interface Theme {
  id: string;
  name: string;
  emoji: string;
  colors: {
    primary: string;
    background: string;
    surface: string;
    offwhite: string;
    darkGray: string;
    accent: string;
  };
}

export const themes: Theme[] = [
  { id: "arcane-purple", name: "Arcane Purple", emoji: "🔮", colors: { primary: "#C3B1FF", background: "#1E0031", surface: "#1A1A1A", offwhite: "#C7C7C7", darkGray: "#484848", accent: "#C3B1FF" } },
  { id: "emerald-forest", name: "Emerald Forest", emoji: "🌿", colors: { primary: "#6EE7B7", background: "#0A1F1A", surface: "#1A2A25", offwhite: "#C7D4CF", darkGray: "#3A5248", accent: "#34D399" } },
  { id: "ocean-blue", name: "Ocean Blue", emoji: "🌊", colors: { primary: "#60A5FA", background: "#0A1628", surface: "#1A2540", offwhite: "#C7D4E4", darkGray: "#384860", accent: "#3B82F6" } },
  { id: "crimson-flame", name: "Crimson Flame", emoji: "🔥", colors: { primary: "#F87171", background: "#1F0A0A", surface: "#2A1A1A", offwhite: "#D4C7C7", darkGray: "#5A3838", accent: "#EF4444" } },
  { id: "golden-kingdom", name: "Golden Kingdom", emoji: "👑", colors: { primary: "#FBBF24", background: "#1A1400", surface: "#2A2410", offwhite: "#D4CFBA", darkGray: "#5A5030", accent: "#F59E0B" } },
  { id: "sakura-blossom", name: "Sakura Blossom", emoji: "🌸", colors: { primary: "#F9A8D4", background: "#1F0A1A", surface: "#2A1A25", offwhite: "#D4C7D0", darkGray: "#5A3850", accent: "#EC4899" } },
  { id: "midnight-shadow", name: "Midnight Shadow", emoji: "🌙", colors: { primary: "#94A3B8", background: "#0F1219", surface: "#1E2330", offwhite: "#B8C4D4", darkGray: "#3A4555", accent: "#64748B" } },
  { id: "frost-winter", name: "Frost Winter", emoji: "❄️", colors: { primary: "#A5F3FC", background: "#0A1A1F", surface: "#1A2A30", offwhite: "#C7E4E8", darkGray: "#385560", accent: "#22D3EE" } },
  { id: "cyber-neon", name: "Cyber Neon", emoji: "⚡", colors: { primary: "#A78BFA", background: "#0A0A1F", surface: "#1A1A35", offwhite: "#C7C7E4", darkGray: "#383860", accent: "#8B5CF6" } },
  { id: "solar-sunset", name: "Solar Sunset", emoji: "🌅", colors: { primary: "#FB923C", background: "#1A0F0A", surface: "#2A1F1A", offwhite: "#D4CFC7", darkGray: "#5A4A38", accent: "#F97316" } },
];

export const DEFAULT_THEME_ID = "arcane-purple";

export function getThemeById(id: string): Theme {
  return themes.find((t) => t.id === id) || themes[0];
}
