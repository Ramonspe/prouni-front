"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, type ReactNode } from "react";
import { Avatar, MauaBrand } from "./ui";
import {
  IconBell,
  IconChart,
  IconClock,
  IconFile,
  IconFolder,
  IconHelp,
  IconHome,
  IconLayers,
  IconLogout,
  IconSearch,
  IconSettings,
  IconShield,
  IconUsers,
  type IconComponent,
} from "./icons";
import type { Role } from "@/lib/types";
import { roleLabel, useAuth } from "@/lib/auth-context";

type NavGroup = { group: string };
type NavLink = {
  id: string;
  label: string;
  icon: IconComponent;
  href: string;
  badge?: string;
  /** When set, the item is active whenever the pathname starts with this prefix. */
  match?: string;
};
type NavItem = NavGroup | NavLink;

const candidateNav: NavItem[] = [
  { group: "Inscrição" },
  { id: "dash", label: "Dashboard", icon: IconHome, href: "/painel" },
  { id: "form", label: "Ficha socioeconômica", icon: IconFile, href: "/ficha" },
  { id: "docs", label: "Documentos", icon: IconFolder, href: "/documentos", badge: "2" },
  { id: "status", label: "Acompanhamento", icon: IconClock, href: "/acompanhamento" },
  { group: "Conta" },
  { id: "notif", label: "Notificações", icon: IconBell, href: "#" },
  { id: "help", label: "Ajuda", icon: IconHelp, href: "#" },
];

const adminNav: NavItem[] = [
  { group: "Operação" },
  { id: "adash", label: "Painel operacional", icon: IconHome, href: "/admin" },
  { id: "queue", label: "Candidatos", icon: IconUsers, href: "/admin/candidatos", badge: "47" },
  { id: "analysis", label: "Análise", icon: IconLayers, href: "/admin/analise/PRN-2026-0418", match: "/admin/analise" },
  { id: "indicators", label: "Indicadores", icon: IconChart, href: "/admin/indicadores" },
  { group: "Sistema" },
  { id: "audit", label: "Auditoria", icon: IconShield, href: "#" },
  { id: "settings", label: "Configurações", icon: IconSettings, href: "#" },
];

function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const nav = role === "admin" ? adminNav : candidateNav;
  const userName = user?.fullName ?? (role === "admin" ? "Ana Lima" : "Maria Souza");
  const userRole = user ? roleLabel(user.role) : role === "admin" ? "Analista socioeconômica" : "Candidata · 2026/1";

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside className="sidebar">
      <MauaBrand variant="dark" />

      <nav style={{ display: "flex", flexDirection: "column", gap: 2 }}>
        {nav.map((it, i) => {
          if ("group" in it) {
            return (
              <div key={`g-${i}`} className="nav-section-label">
                {it.group}
              </div>
            );
          }
          const I = it.icon;
          const active = it.match ? pathname.startsWith(it.match) : pathname === it.href;
          return (
            <Link key={it.id} href={it.href} className={`nav-item ${active ? "active" : ""}`}>
              <I className="nav-icon" />
              <span>{it.label}</span>
              {it.badge && <span className="nav-badge">{it.badge}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Avatar name={userName} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            className="user-name"
            style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
          >
            {userName}
          </div>
          <div className="user-role">{userRole}</div>
        </div>
        <button className="icon-btn" style={{ color: "#8a96b3" }} title="Sair" onClick={handleLogout}>
          <IconLogout size={15} />
        </button>
      </div>
    </aside>
  );
}

function Topbar({ crumbs = [], role }: { crumbs?: string[]; role: Role }) {
  const router = useRouter();
  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center" }}>
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="topbar-crumb-sep">/</span>}
            <span className={i === crumbs.length - 1 ? "topbar-title" : "topbar-crumb"}>{c}</span>
          </Fragment>
        ))}
      </div>
      <div className="topbar-actions">
        <div className="search-input">
          <IconSearch size={14} />
          <input placeholder={role === "admin" ? "Buscar por CPF, nome, protocolo…" : "Buscar…"} />
          <span className="kbd">⌘K</span>
        </div>
        <div className="profile-switch" title="Alternar perfil (demo)">
          <button className={role === "candidate" ? "active" : ""} onClick={() => router.push("/painel")}>
            Candidato
          </button>
          <button className={role === "admin" ? "active" : ""} onClick={() => router.push("/admin")}>
            Administrativo
          </button>
        </div>
        <button className="icon-btn has-dot" title="Notificações">
          <IconBell size={17} />
        </button>
      </div>
    </header>
  );
}

export function AppShell({
  role,
  crumbs,
  children,
}: {
  role: Role;
  crumbs?: string[];
  children: ReactNode;
}) {
  return (
    <div className="app-shell">
      <Sidebar role={role} />
      <div className="main">
        <Topbar crumbs={crumbs} role={role} />
        {children}
      </div>
    </div>
  );
}
