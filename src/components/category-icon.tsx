import type { LucideIcon } from "lucide-react";
import {
  BookOpen,
  Briefcase,
  Car,
  Coins,
  Gamepad2,
  HeartPulse,
  Home,
  Laptop,
  Shirt,
  Shapes,
  Store,
  Tag,
  Utensils,
  Zap,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  utensils: Utensils,
  car: Car,
  zap: Zap,
  home: Home,
  "heart-pulse": HeartPulse,
  "gamepad-2": Gamepad2,
  "book-open": BookOpen,
  shirt: Shirt,
  shapes: Shapes,
  briefcase: Briefcase,
  laptop: Laptop,
  store: Store,
  coins: Coins,
  tag: Tag,
};

export function getCategoryIcon(name: string): LucideIcon {
  return ICONS[name] ?? Tag;
}

export function CategoryIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = getCategoryIcon(name);
  return <Icon className={className} />;
}
