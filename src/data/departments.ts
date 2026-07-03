export interface Department {
  id: string;
  name: string;
  icon: string;
  description: string;
  responsibilities: string[];
  color: string;
}

export const departments: Department[] = [
  {
    id: "dept-1",
    name: "Creatives",
    icon: "palette",
    description: "The artistic heart of the guild — responsible for all visual content, designs, promotional materials, and the guild's creative identity.",
    responsibilities: [
      "Poster and banner design",
      "Social media graphics",
      "Event branding & themes",
      "Merchandise design",
    ],
    color: "#C3B1FF",
  },
  {
    id: "dept-2",
    name: "Events",
    icon: "calendar",
    description: "The battle planners who bring our grandest gatherings to life — from conventions to screenings to tournaments.",
    responsibilities: [
      "Event conceptualization",
      "Logistics & coordination",
      "Program flow management",
      "Venue & equipment setup",
    ],
    color: "#FF6B6B",
  },
  {
    id: "dept-3",
    name: "Media & Documentation",
    icon: "camera",
    description: "The chrono mages who capture and preserve every moment of guild history through photos, videos, and archives.",
    responsibilities: [
      "Event photography & videography",
      "Content creation & editing",
      "Social media management",
      "Guild archives & records",
    ],
    color: "#4ECDC4",
  },
  {
    id: "dept-4",
    name: "Membership",
    icon: "users",
    description: "The recruiters and community builders who grow our ranks and ensure every mage feels at home.",
    responsibilities: [
      "Member recruitment drives",
      "Onboarding & orientation",
      "Member welfare & engagement",
      "Attendance & tracking",
    ],
    color: "#FFE66D",
  },
  {
    id: "dept-5",
    name: "Finance",
    icon: "coins",
    description: "The gold keepers who manage resources wisely, ensuring the guild is funded for every quest ahead.",
    responsibilities: [
      "Budget planning & allocation",
      "Fundraising activities",
      "Expense tracking",
      "Financial reports & audits",
    ],
    color: "#95E1D3",
  },
  {
    id: "dept-6",
    name: "External Affairs",
    icon: "globe",
    description: "The diplomats who forge alliances with other organizations, sponsors, and external partners.",
    responsibilities: [
      "Partnership & sponsorship",
      "Inter-org collaborations",
      "External communications",
      "Community outreach",
    ],
    color: "#F38181",
  },
];
