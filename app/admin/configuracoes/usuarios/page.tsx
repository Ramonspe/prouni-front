"use client";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppShell } from "@/components/app-shell";
import { Badge, Banner } from "@/components/ui";
import { IconCheck, IconPlus, IconSearch, IconX } from "@/components/icons";
import { UserSchedulePermissionControl } from "@/components/user-permission-control";
import { useRequireStaff } from "@/lib/use-require-auth";
import { usersApi } from "@/lib/api";
import { maskCpf } from "@/lib/format";
import type { StaffRole, UserDto, UserCreateInput, UserUpdateInput } from "@prouni/shared";

type UserForm = { fullName: string; cpf: string; email: string; role: StaffRole; password: string };
const EMPTY: UserForm = { fullName: "", cpf: "", email: "", role: "ANALYST", password: "" };

/** Rótulo + descrição de cada perfil (o que cada um acessa). */
const ROLE_INFO: Record<StaffRole, { label: string; desc: string; tone: "info" | "success" | "neutral" }> = {
  ADMIN: { label: "Administrador", desc: "Acesso total (operação, indicadores, configurações e usuários)", tone: "success" },
  ANALYST: { label: "Analista", desc: "Acesso à operação (candidatos, análise e decisão)", tone: "info" },
  VIEWER: { label: "Visualizador", desc: "Somente leitura da operação", tone: "neutral" },
};

function fmtWhen(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export default function UsuariosPage() {
  const { user } = useRequireStaff();
  const qc = useQueryClient();
  const isAdmin = user?.role === "ADMIN";

  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<UserForm>(EMPTY);

  const query = useQuery({
    queryKey: ["admin", "users"],
    queryFn: () => usersApi.list(),
    enabled: !!user && isAdmin,
  });
  const all = useMemo(() => query.data ?? [], [query.data]);
  const rows = all.filter((u) => {
    const s = search.trim().toLowerCase();
    if (!s) return true;
    return (
      u.fullName.toLowerCase().includes(s) ||
      u.email.toLowerCase().includes(s) ||
      u.cpf.replace(/\D/g, "").includes(s.replace(/\D/g, ""))
    );
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ["admin", "users"] });
  const resetForm = () => { setShowForm(false); setEditingId(null); setForm(EMPTY); };

  const saveMut = useMutation({
    mutationFn: () => {
      if (editingId) {
        const body: UserUpdateInput = {
          fullName: form.fullName,
          email: form.email,
          role: form.role,
          ...(form.password ? { password: form.password } : {}),
        };
        return usersApi.update(editingId, body);
      }
      const body: UserCreateInput = {
        fullName: form.fullName,
        cpf: form.cpf,
        email: form.email,
        role: form.role,
        password: form.password,
      };
      return usersApi.create(body);
    },
    onSuccess: () => { invalidate(); resetForm(); },
  });

  const toggleMut = useMutation({
    mutationFn: (u: UserDto) => usersApi.update(u.id, { active: !u.active }),
    onSuccess: invalidate,
  });

  const permissionMut = useMutation({
    mutationFn: (staffUser: UserDto) => {
      const currentlyGranted = staffUser.permissions.includes(
        "MANAGE_SCHEDULE",
      );
      return usersApi.updatePermissions(staffUser.id, {
        permissions: currentlyGranted ? [] : ["MANAGE_SCHEDULE"],
      });
    },
    onSuccess: (updated) => {
      qc.setQueryData<UserDto[]>(["admin", "users"], (current) =>
        current?.map((staffUser) =>
          staffUser.id === updated.id ? updated : staffUser,
        ),
      );
      void invalidate();
    },
  });

  const startEdit = (u: UserDto) => {
    setEditingId(u.id);
    setForm({ fullName: u.fullName, cpf: u.cpf, email: u.email, role: u.role, password: "" });
    setShowForm(true);
  };

  const canSave =
    form.fullName.trim().length >= 5 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()) &&
    (editingId ? true : form.cpf.replace(/\D/g, "").length === 11 && form.password.length >= 8);

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Configurações", "Usuários"]}>
      <div className="content fade-in">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
          <div>
            <h1 className="page-title">Usuários</h1>
            <p className="page-subtitle">Cadastro da equipe e delegação da gestão de cronogramas. Administradores possuem acesso implícito; a permissão adicional pode ser concedida somente a analistas.</p>
          </div>
          {isAdmin && (
            <button className="btn btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
              <IconPlus size={14} /> Novo usuário
            </button>
          )}
        </div>

        {!isAdmin ? (
          <Banner tone="info" title="Acesso restrito">
            Apenas administradores podem cadastrar e gerenciar usuários do sistema.
          </Banner>
        ) : (
          <>
            {/* Formulário criar/editar */}
            {showForm && (
              <div className="card" style={{ marginBottom: 14 }}>
                <div className="card-header">
                  <h3 className="h-card-title">{editingId ? "Editar usuário" : "Novo usuário"}</h3>
                  <button className="icon-btn" style={{ marginLeft: "auto" }} onClick={resetForm}><IconX size={14} /></button>
                </div>
                <div className="card-body">
                  <div className="rgrid" style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 12 }}>
                    <div className="field">
                      <label className="field-label">Nome completo<span className="req">*</span></label>
                      <input className="input" maxLength={120} value={form.fullName} onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">CPF<span className="req">*</span></label>
                      <input
                        className="input"
                        placeholder="000.000.000-00"
                        inputMode="numeric"
                        maxLength={14}
                        value={form.cpf}
                        disabled={!!editingId}
                        title={editingId ? "O CPF não pode ser alterado" : undefined}
                        onChange={(e) => setForm((f) => ({ ...f, cpf: maskCpf(e.target.value) }))}
                      />
                    </div>
                    <div className="field">
                      <label className="field-label">E-mail<span className="req">*</span></label>
                      <input className="input" type="email" maxLength={120} value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
                    </div>
                    <div className="field">
                      <label className="field-label">Perfil de acesso<span className="req">*</span></label>
                      <select className="input" value={form.role} onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as StaffRole }))}>
                        <option value="ANALYST">Analista — acesso à operação</option>
                        <option value="ADMIN">Administrador — acesso total</option>
                        <option value="VIEWER">Visualizador — somente leitura</option>
                      </select>
                      <span className="field-help">{ROLE_INFO[form.role].desc}</span>
                    </div>
                    <div className="field" style={{ gridColumn: "1 / -1" }}>
                      <label className="field-label">
                        Senha{editingId ? " (deixe em branco para manter)" : ""}{!editingId && <span className="req">*</span>}
                      </label>
                      <input
                        className="input"
                        type="password"
                        maxLength={72}
                        placeholder={editingId ? "•••••• (inalterada)" : "Mínimo 8 caracteres, com 1 número e 1 especial"}
                        value={form.password}
                        onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                      />
                      <span className="field-help">Mínimo 8 caracteres, com 1 número e 1 caractere especial.</span>
                    </div>
                  </div>
                  {saveMut.isError && <p className="upload-meta error" style={{ marginTop: 10 }}>{(saveMut.error as Error).message}</p>}
                  <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                    <button className="btn btn-primary" disabled={saveMut.isPending || !canSave} onClick={() => saveMut.mutate()}>
                      <IconCheck size={14} /> {saveMut.isPending ? "Salvando…" : "Salvar"}
                    </button>
                    <button className="btn btn-ghost" onClick={resetForm}>Cancelar</button>
                  </div>
                </div>
              </div>
            )}

            {/* Busca + tabela */}
            <div className="search-input" style={{ width: 320, background: "#fff", border: "1px solid var(--ink-200)", marginBottom: 12 }}>
              <IconSearch size={14} />
              <input placeholder="Buscar por nome, e-mail ou CPF…" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <table className="table">
                <thead>
                  <tr><th>Nome</th><th>CPF</th><th>E-mail</th><th>Perfil</th><th>Gestão de cronograma</th><th>Status</th><th>Cadastrado</th><th></th></tr>
                </thead>
                <tbody>
                  {query.isLoading || !user ? (
                    <tr><td colSpan={8} className="muted" style={{ padding: 20, textAlign: "center" }}>Carregando…</td></tr>
                  ) : query.isError ? (
                    <tr><td colSpan={8} className="muted" style={{ padding: 20, textAlign: "center" }}>Não foi possível carregar os usuários.</td></tr>
                  ) : rows.length === 0 ? (
                    <tr><td colSpan={8} className="muted" style={{ padding: 20, textAlign: "center" }}>Nenhum usuário encontrado.</td></tr>
                  ) : (
                    rows.map((u) => {
                      const isSelf = u.id === user?.id;
                      return (
                        <tr key={u.id} style={u.active ? undefined : { opacity: 0.55 }}>
                          <td>{u.fullName}{isSelf && <span className="muted small"> · você</span>}</td>
                          <td className="mono">{u.cpf}</td>
                          <td>{u.email}</td>
                          <td><Badge tone={ROLE_INFO[u.role].tone}>{ROLE_INFO[u.role].label}</Badge></td>
                          <td>
                            <UserSchedulePermissionControl
                              user={u}
                              pending={
                                permissionMut.isPending &&
                                permissionMut.variables?.id === u.id
                              }
                              onToggle={(staffUser) => {
                                const granted = staffUser.permissions.includes(
                                  "MANAGE_SCHEDULE",
                                );
                                const action = granted ? "revogar" : "conceder";
                                if (
                                  confirm(
                                    `Deseja ${action} a gestão de cronogramas para ${staffUser.fullName}?`,
                                  )
                                ) {
                                  permissionMut.mutate(staffUser);
                                }
                              }}
                            />
                          </td>
                          <td>{u.active ? <Badge tone="success">Ativo</Badge> : <Badge tone="neutral">Inativo</Badge>}</td>
                          <td className="muted small">{fmtWhen(u.createdAt)}</td>
                          <td>
                            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
                              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(u)}>Editar</button>
                              <button
                                className="btn btn-ghost btn-sm"
                                disabled={isSelf || toggleMut.isPending}
                                title={isSelf ? "Você não pode desativar o seu próprio usuário" : u.active ? "Desativar acesso" : "Reativar acesso"}
                                onClick={() => {
                                  if (confirm(`${u.active ? "Desativar" : "Reativar"} o acesso de ${u.fullName}?`)) toggleMut.mutate(u);
                                }}
                              >
                                {u.active ? "Desativar" : "Reativar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
              <div style={{ padding: "10px 14px", borderTop: "1px solid var(--ink-200)", background: "var(--ink-50)", color: "var(--ink-600)", fontSize: 12.5 }}>
                {rows.length} de {all.length} usuário(s){" "}
                {toggleMut.isError
                  ? `· ${(toggleMut.error as Error).message}`
                  : permissionMut.isError
                    ? `· ${(permissionMut.error as Error).message}`
                    : ""}
              </div>
            </div>
          </>
        )}
      </div>
    </AppShell>
  );
}
