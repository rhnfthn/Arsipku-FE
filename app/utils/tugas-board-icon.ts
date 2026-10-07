import {
  KanbanSquare,
  Rocket,
  Briefcase,
  Target,
  CalendarDays,
  ClipboardList,
  FolderKanban,
  Presentation,
  Megaphone,
  HeartPulse,
  GraduationCap,
  Plane,
  Wrench,
  Banknote,
  FileStack,
  Lightbulb,
  PartyPopper,
  Building2,
} from 'lucide-vue-next';

const iconMap: Record<string, typeof Rocket> = {
  rocket: Rocket,
  briefcase: Briefcase,
  target: Target,
  'calendar-days': CalendarDays,
  'clipboard-list': ClipboardList,
  'folder-kanban': FolderKanban,
  presentation: Presentation,
  megaphone: Megaphone,
  'heart-pulse': HeartPulse,
  'graduation-cap': GraduationCap,
  plane: Plane,
  wrench: Wrench,
  banknote: Banknote,
  'file-stack': FileStack,
  lightbulb: Lightbulb,
  'party-popper': PartyPopper,
  'building-2': Building2,
};

/** Ikon papan dipakai konsisten pada kartu, halaman, dan modal tugas. */
export const resolveTugasBoardIcon = (icon?: string | null) =>
  (icon && iconMap[icon]) || KanbanSquare;
