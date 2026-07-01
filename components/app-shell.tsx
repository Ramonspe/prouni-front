"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminApi, cyclesApi } from "@/lib/api";
import { Avatar, MauaBrand } from "./ui";
import {
  IconBell,
  IconChart,
  IconChevR,
  IconClock,
  IconFile,
  IconFolder,
  IconHelp,
  IconHome,
  IconLayers,
  IconLogout,
  IconMenu,
  IconSearch,
  IconSettings,
  IconShield,
  IconUsers,
  type IconComponent,
} from "./icons";
import type { Role } from "@/lib/types";
import { roleLabel, useAuth } from "@/lib/auth-context";

type NavGroup = { group: string };
type NavSub = {
  id: string;
  label: string;
  href: string;
  /** When set, the item is active whenever the pathname starts with this prefix. */
  match?: string;
};
type NavLink = {
  id: string;
  label: string;
  icon: IconComponent;
  href: string;
  badge?: string;
  match?: string;
};
type NavParent = {
  id: string;
  label: string;
  icon: IconComponent;
  children: NavSub[];
};
type NavItem = NavGroup | NavLink | NavParent;

const candidateNav: NavItem[] = [
  { group: "Inscrição" },
  { id: "dash", label: "Dashboard", icon: IconHome, href: "/painel" },
  { id: "form", label: "Ficha socioeconômica", icon: IconFile, href: "/ficha" },
  { id: "docs", label: "Documentos", icon: IconFolder, href: "/documentos" },
  { id: "status", label: "Acompanhamento", icon: IconClock, href: "/acompanhamento" },
  { group: "Conta" },
  { id: "notif", label: "Notificações", icon: IconBell, href: "/notificacoes" },
  { id: "help", label: "Ajuda", icon: IconHelp, href: "/ajuda" },
];

const adminNav: NavItem[] = [
  { group: "Operação" },
  { id: "adash", label: "Painel operacional", icon: IconHome, href: "/admin" },
  { id: "queue", label: "Candidatos", icon: IconUsers, href: "/admin/candidatos" },
  { id: "analysis", label: "Análise", icon: IconLayers, href: "/admin/candidatos", match: "/admin/analise" },
  { id: "indicators", label: "Indicadores", icon: IconChart, href: "/admin/indicadores" },
  { id: "catalog", label: "Cursos e Documentos", icon: IconFolder, href: "/admin/catalogo", match: "/admin/catalogo" },
  { group: "Sistema" },
  {
    id: "audit",
    label: "Auditoria",
    icon: IconShield,
    children: [
      { id: "logs", label: "Logs", href: "/admin/auditoria/logs", match: "/admin/auditoria/logs" },
    ],
  },
  {
    id: "config",
    label: "Configurações",
    icon: IconSettings,
    children: [
      { id: "presel", label: "Pré-selecionados", href: "/admin/configuracoes" },
      { id: "users", label: "Usuários", href: "/admin/configuracoes/usuarios", match: "/admin/configuracoes/usuarios" },
      { id: "maint", label: "Manutenção", href: "/admin/configuracoes/manutencao", match: "/admin/configuracoes/manutencao" },
    ],
  },
];

/** Item de menu com submenu (expansível). Abre automaticamente quando um filho está ativo. */
function NavParentItem({ item, pathname }: { item: NavParent; pathname: string }) {
  const childActive = item.children.some((c) => (c.match ? pathname.startsWith(c.match) : pathname === c.href));
  const [open, setOpen] = useState(childActive);
  const I = item.icon;
  return (
    <>
      <button
        type="button"
        className="nav-item"
        style={{ width: "100%", border: "none", background: "none", cursor: "pointer", textAlign: "left", font: "inherit" }}
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
      >
        <I className="nav-icon" />
        <span>{item.label}</span>
        <IconChevR
          size={13}
          style={{ marginLeft: "auto", transition: "transform 120ms", transform: open ? "rotate(90deg)" : "none" }}
        />
      </button>
      {open &&
        item.children.map((c) => {
          const active = c.match ? pathname.startsWith(c.match) : pathname === c.href;
          return (
            <Link key={c.id} href={c.href} className={`nav-item ${active ? "active" : ""}`} style={{ paddingLeft: 38, fontSize: 13 }}>
              <span>{c.label}</span>
            </Link>
          );
        })}
    </>
  );
}

function Sidebar({ role, open = false }: { role: Role; open?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const isAdmin = role === "admin";
  const nav = isAdmin ? adminNav : candidateNav;

  // Contagem real de candidatos para o badge (compartilha o cache da página de candidatos).
  const queueQuery = useQuery({
    queryKey: ["admin", "applications"],
    queryFn: () => adminApi.applications(),
    enabled: isAdmin && !!user,
  });
  const queueCount = queueQuery.data?.length;
  const cycleQuery = useQuery({ queryKey: ["cycle-active"], queryFn: () => cyclesApi.active(), enabled: !isAdmin });
  const cycleLabel = cycleQuery.data?.label ?? "2026/2";
  const userName = user?.fullName ?? (role === "admin" ? "Ana Lima" : "Maria Souza");
  const userRole = user ? roleLabel(user.role) : role === "admin" ? "Analista socioeconômica" : `Candidata · ${cycleLabel}`;

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  return (
    <aside className={`sidebar ${open ? "open" : ""}`}>
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
          if ("children" in it) {
            return <NavParentItem key={it.id} item={it} pathname={pathname} />;
          }
          const I = it.icon;
          const active = it.match ? pathname.startsWith(it.match) : pathname === it.href;
          const badge = it.id === "queue" ? queueCount : it.badge;
          return (
            <Link key={it.id} href={it.href} className={`nav-item ${active ? "active" : ""}`}>
              <I className="nav-icon" />
              <span>{it.label}</span>
              {badge != null && <span className="nav-badge">{badge}</span>}
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

function Topbar({ crumbs = [], role, onBurger }: { crumbs?: string[]; role: Role; onBurger?: () => void }) {
  const router = useRouter();
  return (
    <header className="topbar">
      <button className="topbar-burger icon-btn" aria-label="Abrir menu" onClick={onBurger}>
        <IconMenu size={18} />
      </button>
      <div style={{ display: "flex", alignItems: "center" }}>
        {crumbs.map((c, i) => (
          <Fragment key={i}>
            {i > 0 && <span className="topbar-crumb-sep">/</span>}
            <span className={i === crumbs.length - 1 ? "topbar-title" : "topbar-crumb"}>{c}</span>
          </Fragment>
        ))}
      </div>
      <div className="topbar-actions">
        {role === "admin" && (
          <>
            <div className="search-input">
              <IconSearch size={14} />
              <input placeholder="Buscar por CPF, nome, protocolo…" />
              <span className="kbd">⌘K</span>
            </div>
            <div className="profile-switch" title="Alternar perfil (demo)">
              <button onClick={() => router.push("/painel")}>Candidato</button>
              <button className="active" onClick={() => router.push("/admin")}>Administrativo</button>
            </div>
          </>
        )}
        {role === "candidate" && (
          <button className="icon-btn has-dot" title="Notificações" onClick={() => router.push("/notificacoes")}>
            <IconBell size={17} />
          </button>
        )}
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
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  // Fecha o drawer ao navegar (mobile).
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);
  return (
    <div className="app-shell">
      <Sidebar role={role} open={menuOpen} />
      <div
        className={`sidebar-overlay ${menuOpen ? "show" : ""}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden
      />
      <div className="main">
        <Topbar crumbs={crumbs} role={role} onBurger={() => setMenuOpen(true)} />
        {children}
      </div>
    </div>
  );
}
