import {
  BarChart3,
  Bell,
  CreditCard,
  LayoutDashboard,
  Megaphone,
  Package,
  Settings,
  ShieldCheck,
  ShoppingBasket,
  ShoppingCart,
  Sparkles,
  Store,
  Ticket,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navSections: NavSection[] = [
  {
    title: "Vue d'ensemble",
    items: [{ label: "Tableau de bord", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    title: "Commerce",
    items: [
      { label: "Boutique", href: "/boutique", icon: Store },
      { label: "Produits", href: "/produits", icon: Package },
      { label: "Commandes", href: "/commandes", icon: ShoppingCart },
    ],
  },
  {
    title: "Clients",
    items: [{ label: "Clients & CRM", href: "/clients", icon: Users }],
  },
  {
    title: "Marketing",
    items: [
      { label: "Campagnes", href: "/campagnes", icon: Megaphone },
      { label: "Automatisations", href: "/automatisations", icon: Workflow },
      { label: "Promotions & coupons", href: "/promotions", icon: Ticket },
      { label: "Paniers abandonnés", href: "/paniers-abandonnes", icon: ShoppingBasket },
    ],
  },
  {
    title: "Pilotage",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "IA & recommandations", href: "/ia", icon: Sparkles },
    ],
  },
  {
    title: "Paramètres",
    items: [
      { label: "Général", href: "/parametres", icon: Settings },
      { label: "Facturation", href: "/facturation", icon: CreditCard },
      { label: "Notifications", href: "/notifications", icon: Bell },
      { label: "Sécurité & audit", href: "/audit", icon: ShieldCheck },
    ],
  },
];
