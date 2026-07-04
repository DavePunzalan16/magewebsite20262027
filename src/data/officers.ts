export interface Officer {
  id: string;
  name: string;
  position: string;
  description: string;
  lore: string;
  image: string;
  isSpecial?: boolean;
}

// Ordered by rank: Adviser → President → VPs → Directors → Representatives → Special
export const officers: Officer[] = [
  {
    id: "officer-16",
    name: "Prof. Maria Nykhaella Javillonar",
    position: "Adviser",
    description: "The Elder Sage — guiding light of the guild, her wisdom steers us through every storm.",
    lore: "When the students sought to revive M.A.G.E., it was Prof. Javillonar who believed in them and provided the institutional support needed. Her guidance transformed a dream into an officially recognized reality.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-1",
    name: "Christine Joy P. Echica",
    position: "President",
    description: "The Guild Master — a fearless leader who commands with wisdom and ignites the fire of passion in every mage.",
    lore: "When the M.A.G.E. Guild was revived in A.Y. 2026-2027, it was Christine who answered the call to lead. With unwavering determination, she rallied the founding officers and breathed new life into the organization. Under her banner, the guild rose from dormancy to become one of the most vibrant student communities at UE Caloocan.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-2",
    name: "Argo Lladel S. Pecate",
    position: "V.P. for Finance",
    description: "The Gold Keeper — master of treasury arts, ensuring every coin fuels the guild's grandest quests.",
    lore: "A strategic mind with an eye for resources. Argo ensures that every peso collected serves a purpose — from convention budgets to merchandise production. His financial sorcery keeps the guild's coffers healthy.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-6",
    name: "Christopher John B. Imus",
    position: "V.P. for Membership",
    description: "The Recruiter — a charismatic soul who summons new mages and strengthens the guild's ranks.",
    lore: "Christopher's infectious enthusiasm is the guild's greatest recruitment tool. He personally welcomes every new member, ensuring they find their place within M.A.G.E.'s growing family.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-9",
    name: "Allan F. Chan Jr.",
    position: "V.P. for External Affairs",
    description: "The Diplomat — forging alliances beyond the guild walls, his connections span multiple kingdoms.",
    lore: "Allan's network extends beyond UE Caloocan. His partnerships with other organizations and sponsors have opened doors that strengthened M.A.G.E.'s position in the broader community.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-13",
    name: "Joshua Carl Elon",
    position: "V.P. for Internal Affairs",
    description: "The Guardian — protector of guild harmony, ensuring every member thrives within our walls.",
    lore: "Joshua is the heart of M.A.G.E.'s internal community. He resolves conflicts, ensures member welfare, and keeps the guild's spirit strong.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-10",
    name: "Mark Justine Quizado",
    position: "V.P. for Media Documentation",
    description: "The Chrono Mage — capturing moments in time, his lens preserves the guild's greatest memories.",
    lore: "Every photo, every video, every visual memory of M.A.G.E.'s revival exists because of Mark's dedication. His camera is the guild's time machine.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-14",
    name: "Jeremiah A. Jacinto",
    position: "V.P. for Creatives",
    description: "The Enchanter — wielder of boundless imagination, his creative spells bring visions to life.",
    lore: "Every poster, every banner, every visual identity of the revived M.A.G.E. bears Jeremiah's creative touch. His artistic vision defines how the world sees the guild.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-5",
    name: "Gramasia Rose Merca",
    position: "Secretary",
    description: "The Lore Scribe — keeper of sacred records, her quill captures every moment of guild history.",
    lore: "Every resolution passed, every meeting held, every milestone achieved — Gramasia ensures nothing is lost to time. Her records form the living chronicle of M.A.G.E.'s revival era.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-3",
    name: "Bless Jhiniel V. Selda",
    position: "P.R.O.",
    description: "The Herald — voice of the guild across all realms, spreading our legend to every corner.",
    lore: "Bless carries the guild's message far and wide. From social media campaigns to campus announcements, her voice echoes through UE Caloocan.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-17",
    name: "Paula Stephanie Yanzon",
    position: "Assistant P.R.O.",
    description: "The Shadow Herald — working tirelessly behind the scenes, amplifying the guild's voice across all platforms.",
    lore: "Paula is the unsung force multiplier of M.A.G.E.'s public relations. While the Herald speaks, the Shadow Herald ensures the message reaches every corner.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-7",
    name: "Nigel Marcus Discaya",
    position: "Events Director",
    description: "The Battle Planner — architect of legendary gatherings, every event he crafts becomes an epic saga.",
    lore: "Behind every successful guild event is Nigel's meticulous planning. From conceptualization to execution, he transforms ideas into unforgettable experiences.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-11",
    name: "Zamuel Quintero",
    position: "Business Manager",
    description: "The Merchant Lord — cunning strategist of commerce, turning vision into sustainable power.",
    lore: "Zamuel turns creative vision into tangible results. From merchandise to sponsorship deals, his business acumen ensures the guild can sustain its ambitions.",
    image: "/Officers/gojosan.jpg",
  },
  // College Representatives (4 colleges only)
  {
    id: "officer-4",
    name: "Dale Wilson Espiritu",
    position: "COE Representative",
    description: "The Iron Sentinel — steadfast warrior of engineering, bridging the forge between realms.",
    lore: "Representing the College of Engineering, Dale bridges the technical and creative worlds. His analytical mind and passion for gaming make him an invaluable link.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-8",
    name: "Justin Leigh Domingo",
    position: "CAS Representative",
    description: "The Arcane Scholar — wielding knowledge as his blade, he bridges arts and sciences.",
    lore: "Justin represents the College of Arts & Sciences. His broad perspective brings unique creative insights to guild discussions.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-12",
    name: "Carl Vincent Manalastas",
    position: "CBA Representative",
    description: "The Trade Knight — a warrior of business acumen, his strategies fuel the guild's growth.",
    lore: "Carl brings the strategic thinking of the College of Business Administration to M.A.G.E. His entrepreneurial spirit helps the guild operate professionally.",
    image: "/Officers/gojosan.jpg",
  },
  {
    id: "officer-15",
    name: "Samantha Nadine G. Flores",
    position: "CFAD Representative",
    description: "The Art Weaver — her designs cast illusions of beauty, a true master of the visual arts.",
    lore: "Representing the College of Fine Arts, Architecture and Design, Samantha infuses every guild project with artistic excellence.",
    image: "/Officers/gojosan.jpg",
  },
];

// Special mentions — separated from the main roster
export const specialMentions: Officer[] = [
  {
    id: "special-1",
    name: "Christine Joy P. Echica",
    position: "President & Revival Leader",
    description: "The Guild Master who revived M.A.G.E. — without her leadership, the guild would remain dormant.",
    lore: "Christine didn't just become President — she became the catalyst for M.A.G.E.'s entire resurrection. In A.Y. 2026-2027, she gathered the original vision, recruited every officer, fought for official recognition, and built the foundation that every future generation of mages will stand upon. The Revival is her legacy.",
    image: "/Officers/gojosan.jpg",
    isSpecial: true,
  },
  {
    id: "special-2",
    name: "Dave Matthew S. Punzalan",
    position: "Website Creator & Developer",
    description: "The Arcane Architect — the mind behind this digital realm, forging the guild's online presence from code and creativity.",
    lore: "When M.A.G.E. was revived in A.Y. 2026-2027, Dave answered the call to build the guild's digital home. This website — every animation, every interaction, every line of code — is his creation. A full-stack developer who fused his passion for web technology with his love for anime and gaming culture, Dave crafted the M.A.G.E. Digital Guild Platform as a labor of love for the community.",
    image: "/Officers/gojosan.jpg",
    isSpecial: true,
  },
];
