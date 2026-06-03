import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  Bell,
  Bolt,
  BookOpenText,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  Database,
  FolderOpen,
  Gauge,
  LayoutDashboard,
  LogOut,
  Mail,
  Palette,
  Search,
  Settings,
  ShieldAlert,
  SquareCheckBig,
  Trophy,
  User,
  Waypoints
} from "lucide-react";

export const navIcons: Record<string, LucideIcon> = {
  Dashboard: LayoutDashboard,
  Questions: BookOpenText,
  Progress: Gauge,
  Profile: User,
  Settings: Settings
};

export const appIcons = {
  search: Search,
  bell: Bell,
  logout: LogOut,
  check: SquareCheckBig,
  bolt: Bolt,
  trophy: Trophy,
  category: Waypoints,
  arrow: ArrowRight,
  mail: Mail,
  calendar: CalendarDays,
  verify: CheckCircle2,
  chevron: ChevronRight,
  folder: FolderOpen,
  palette: Palette,
  shield: ShieldAlert,
  database: Database
};
