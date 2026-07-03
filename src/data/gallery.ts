export interface GalleryItem {
  id: string;
  title: string;
  category: string;
  src: string;
  alt: string;
  width: number;
  height: number;
}

export const galleryCategories = [
  "All",
  "Events",
  "Cosplay",
  "Art",
  "Community",
] as const;

export type GalleryCategory = (typeof galleryCategories)[number];

// Placeholder gallery items using the existing images
// Replace src paths with actual gallery images later
export const galleryItems: GalleryItem[] = [
  {
    id: "gallery-1",
    title: "Arcane Convergence Opening",
    category: "Events",
    src: "/images/magecover.png",
    alt: "Guild members at the Arcane Convergence opening ceremony",
    width: 800,
    height: 400,
  },
  {
    id: "gallery-2",
    title: "Guild Officers Portrait",
    category: "Community",
    src: "/Officers/gojosan.jpg",
    alt: "Official group photo of M.A.G.E. Guild officers",
    width: 800,
    height: 600,
  },
  {
    id: "gallery-3",
    title: "Guild Emblem Design",
    category: "Art",
    src: "/images/mageicon.jpg",
    alt: "M.A.G.E. Guild official emblem artwork",
    width: 600,
    height: 600,
  },
  {
    id: "gallery-4",
    title: "Cast Your Passion Banner",
    category: "Art",
    src: "/images/magecover.png",
    alt: "Cast Your Passion promotional banner design",
    width: 800,
    height: 350,
  },
  {
    id: "gallery-5",
    title: "Recruitment Day",
    category: "Events",
    src: "/Officers/gojosan.jpg",
    alt: "New members signing up during recruitment drive",
    width: 700,
    height: 500,
  },
  {
    id: "gallery-6",
    title: "Art Workshop Session",
    category: "Art",
    src: "/images/mageicon.jpg",
    alt: "Members during the manga art workshop",
    width: 600,
    height: 600,
  },
  {
    id: "gallery-7",
    title: "Cosplay Showcase",
    category: "Cosplay",
    src: "/images/magecover.png",
    alt: "Cosplayers at the annual convention",
    width: 800,
    height: 450,
  },
  {
    id: "gallery-8",
    title: "Gaming Tournament",
    category: "Events",
    src: "/Officers/gojosan.jpg",
    alt: "Esports tournament competitors in action",
    width: 750,
    height: 500,
  },
];
