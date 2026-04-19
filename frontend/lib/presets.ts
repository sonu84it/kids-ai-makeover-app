import { PresetId } from "./types";

export const PRESETS: Array<{
  id: PresetId;
  label: string;
  blurb: string;
  accent: string;
  iconKey: "camera" | "rocket" | "crown" | "tree" | "gift";
  chipClassName: string;
  borderClassName: string;
  activeClassName: string;
}> = [
  {
    id: "superhero",
    label: "Superhero",
    blurb: "Heroic costume, bright cinematic energy, and a child-safe action feel.",
    accent: "from-red-100 to-orange-200",
    iconKey: "camera",
    chipClassName: "bg-red-100 text-red-600",
    borderClassName: "border-red-200",
    activeClassName: "border-red-500 bg-red-50"
  },
  {
    id: "astronaut",
    label: "Astronaut",
    blurb: "Futuristic suit styling with a gentle sci-fi backdrop.",
    accent: "from-indigo-100 to-sky-200",
    iconKey: "rocket",
    chipClassName: "bg-indigo-100 text-indigo-600",
    borderClassName: "border-indigo-200",
    activeClassName: "border-indigo-500 bg-indigo-50"
  },
  {
    id: "royal",
    label: "Royal",
    blurb: "Elegant royal attire with warm palace-inspired detail.",
    accent: "from-amber-100 to-yellow-200",
    iconKey: "crown",
    chipClassName: "bg-amber-100 text-amber-600",
    borderClassName: "border-amber-200",
    activeClassName: "border-amber-500 bg-amber-50"
  },
  {
    id: "jungle",
    label: "Jungle Explorer",
    blurb: "Adventure-ready explorer outfit with lush greenery.",
    accent: "from-emerald-100 to-lime-200",
    iconKey: "tree",
    chipClassName: "bg-emerald-100 text-emerald-600",
    borderClassName: "border-emerald-200",
    activeClassName: "border-emerald-500 bg-emerald-50"
  },
  {
    id: "festive",
    label: "Festive",
    blurb: "Bright celebratory styling for family-event moments.",
    accent: "from-rose-100 to-pink-200",
    iconKey: "gift",
    chipClassName: "bg-rose-100 text-rose-600",
    borderClassName: "border-rose-200",
    activeClassName: "border-rose-500 bg-rose-50"
  }
];
