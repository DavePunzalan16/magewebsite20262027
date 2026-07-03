import type { Experience, Skill, SocialLink, NavLink } from "@/lib/types";

export interface GuildEvent {
  id: string;
  title: string;
  description: string;
  longDescription: string;
  date: string;
  time: string;
  location: string;
  image?: string;
  tags: string[];
  featured?: boolean;
  highlights: string[];
  status: "upcoming" | "ongoing" | "completed";
}

export const navLinks: NavLink[] = [
  { label: "Home", href: "#home" },
  { label: "Events", href: "#events" },
  { label: "Officers", href: "#officers" },
  { label: "Gallery", href: "#gallery" },
  { label: "About", href: "#about" },
  { label: "Join", href: "#join" },
  { label: "Contact", href: "#contact" },
];

export const socialLinks: SocialLink[] = [
  { id: "instagram", name: "Instagram", url: "https://instagram.com/mageguild.uec", icon: "instagram" },
  { id: "gmail", name: "Email", url: "mailto:mageguildofficial.uecal@gmail.com", icon: "gmail" },
  { id: "facebook", name: "Facebook", url: "https://facebook.com/mage.guild.ue.cal", icon: "facebook" },
];

export const guildEvents: GuildEvent[] = [
  {
    id: "event-1",
    title: "Arcane Convergence 2026",
    description:
      "Our flagship annual convention featuring cosplay competitions, gaming tournaments, and artist showcases.",
    longDescription:
      "Arcane Convergence is the crown jewel of M.A.G.E. Guild — a full-day convention that transforms UE Caloocan into a realm of pop culture magic. Expect electrifying cosplay competitions judged by industry professionals, a massive gaming arena with tournaments across multiple titles, artist alley showcasing local talent, exclusive merchandise drops, and panel discussions with content creators. This is where every mage's passion converges into one epic celebration.",
    date: "October 18, 2026",
    time: "9:00 AM - 8:00 PM",
    location: "UE Caloocan Auditorium",
    tags: ["Convention", "Cosplay", "Gaming", "Art"],
    featured: true,
    highlights: [
      "Cosplay competition with ₱10,000 grand prize",
      "Gaming tournaments: Valorant, ML, LoL",
      "Artist Alley with 30+ local artists",
      "Panel discussions with content creators",
      "Exclusive guild merchandise",
    ],
    status: "upcoming",
  },
  {
    id: "event-2",
    title: "Manga Art Workshop",
    description:
      "Learn manga illustration from professional artists — character design, paneling, inking, and digital coloring.",
    longDescription:
      "A hands-on workshop series designed for aspiring manga artists of all skill levels. Professional illustrators will guide you through the complete manga creation pipeline — from initial character concepts and story paneling to traditional inking techniques and modern digital coloring workflows. Bring your sketchbook and creativity!",
    date: "August 10, 2026",
    time: "1:00 PM - 5:00 PM",
    location: "Fine Arts Building, Room 301",
    tags: ["Workshop", "Art", "Manga"],
    featured: true,
    highlights: [
      "Professional manga artist instructors",
      "Free art supplies for participants",
      "Character design fundamentals",
      "Digital coloring techniques",
      "Certificate of participation",
    ],
    status: "upcoming",
  },
  {
    id: "event-3",
    title: "Guild Wars: Esports Tournament",
    description:
      "Inter-department esports tournament — Valorant, League of Legends, and Mobile Legends.",
    longDescription:
      "The ultimate inter-department gaming showdown! Teams from all colleges clash in intense best-of-3 matches across the most popular esports titles. Whether you're a tactical FPS player, a MOBA strategist, or a mobile legends carry, Guild Wars is your arena to prove your might and claim glory for your department.",
    date: "September 5-7, 2026",
    time: "10:00 AM - 6:00 PM",
    location: "Computer Lab & Online",
    tags: ["Esports", "Tournament", "Gaming"],
    featured: true,
    highlights: [
      "Valorant 5v5 tournament bracket",
      "League of Legends showmatch",
      "Mobile Legends inter-department clash",
      "Live shoutcasting & streaming",
      "Gaming peripherals as prizes",
    ],
    status: "upcoming",
  },
  {
    id: "event-4",
    title: "Anime Screening Night",
    description:
      "Monthly screening of critically acclaimed anime films. Popcorn, discussions, and fan theories.",
    longDescription:
      "Every last Friday of the month, the guild transforms AVR Room 2 into a cozy anime theater. We screen carefully curated films and series — from timeless classics to the latest releases. Stay for the post-screening discussions where we dive deep into themes, animation techniques, and wild fan theories. Snacks are on us!",
    date: "Every Last Friday",
    time: "5:00 PM - 9:00 PM",
    location: "AVR Room 2",
    tags: ["Screening", "Anime", "Community"],
    featured: true,
    highlights: [
      "Curated anime film selections",
      "Free popcorn and snacks",
      "Post-screening discussions",
      "Themed nights (Ghibli, Shonen, etc.)",
      "Cozy theater atmosphere",
    ],
    status: "ongoing",
  },
  {
    id: "event-5",
    title: "Recruitment Drive: New Mages",
    description:
      "Open recruitment for new guild members! Orientation, games, and meet the officers.",
    longDescription:
      "Calling all UE Caloocan students! Whether you're an anime superfan, a competitive gamer, an aspiring artist, or simply curious about our community — M.A.G.E. Guild welcomes you. Join us at the Student Center for an exciting orientation featuring icebreaker games, department showcases, a mini-quiz bee, and your chance to meet the officers and fellow mages. No experience needed — just bring your passion!",
    date: "July 15-17, 2026",
    time: "10:00 AM - 4:00 PM",
    location: "Student Center",
    tags: ["Recruitment", "Community", "Orientation"],
    featured: true,
    highlights: [
      "Open to all UE Caloocan students",
      "Icebreaker games & activities",
      "Department showcases",
      "Mini quiz-bee with prizes",
      "Free guild starter kit for new members",
    ],
    status: "upcoming",
  },
];

export const skills: Skill[] = [
  { id: "skill-1", name: "Manga" },
  { id: "skill-2", name: "Anime" },
  { id: "skill-3", name: "Gaming" },
  { id: "skill-4", name: "Cosplay" },
  { id: "skill-5", name: "Digital Art" },
  { id: "skill-6", name: "Esports" },
  { id: "skill-7", name: "Illustration" },
  { id: "skill-8", name: "Community" },
  { id: "skill-9", name: "Events" },
  { id: "skill-10", name: "Creativity" },
];

export const experiences: Experience[] = [
  {
    id: "exp-1",
    title: "Arcane Convergence 2025",
    company: "Annual Convention",
    date: "A.Y. 2025-2026",
    description:
      "Successfully organized the guild's first major convention with 500+ attendees, cosplay contest, and gaming arena.",
  },
  {
    id: "exp-2",
    title: "Inter-University Art Battle",
    company: "Collaborative Event",
    date: "A.Y. 2024-2025",
    description:
      "Hosted a multi-school art competition with participants from 8 universities across Metro Manila.",
  },
  {
    id: "exp-3",
    title: "Guild Founding",
    company: "Organization Establishment",
    date: "A.Y. 2023-2024",
    description:
      "Established M.A.G.E. Guild as an officially recognized student organization at UE Caloocan.",
  },
];

export const siteConfig = {
  name: "M.A.G.E. Guild",
  title: "Manga, Anime, and Game Enthusiast's Guild",
  heroHeading: "Cast Your Passion!",
  heroSubheading:
    "Together we break the limits and cultivate an image of boundless creativity.",
  heroTagline: "University of the East-Caloocan · A.Y. 2026-2027",
  aboutText:
    "The Manga, Anime, and Game Enthusiast's Guild (M.A.G.E.) is a student organization at the University of the East-Caloocan dedicated to fostering creativity, community, and passion for anime, manga, and gaming culture.",
  history:
    "Founded in A.Y. 2023-2024, M.A.G.E. Guild was born from the shared passion of students who believed that anime, manga, and gaming culture deserves a dedicated space within the university. What started as a small group of enthusiasts has grown into one of the most active student organizations on campus.",
  vision:
    "To be the leading creative community that bridges the gap between pop culture enthusiasm and artistic excellence, inspiring every student to cast their passion into reality.",
  mission:
    "To cultivate a vibrant community of manga, anime, and game enthusiasts through creative events, artistic workshops, and collaborative experiences that develop talent, build friendships, and celebrate the boundless creativity within every member.",
  email: "mageguildofficial.uecal@gmail.com",
  copyright: "© 2026 M.A.G.E. Guild UE Caloocan",
  coverImage: "/images/magecover.png",
  iconImage: "/images/mageicon.jpg",
};
