export interface Project {
  id: string;
  title: string;
  description: string;
  image: string;
  tags: string[];
  year: string;
  role: string;
  client: string;
  liveUrl?: string;
  githubUrl?: string;
}

export interface Experience {
  id: string;
  title: string;
  company: string;
  date: string;
  description: string;
}

export interface Skill {
  id: string;
  name: string;
}

export interface SocialLink {
  id: string;
  name: string;
  url: string;
  icon: string;
}

export interface NavLink {
  label: string;
  href: string;
}
