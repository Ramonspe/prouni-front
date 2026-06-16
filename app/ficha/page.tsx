"use client";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { applicationsApi } from "@/lib/api";
import { StepEstudante, StepMoradia, StepRendaDespesas } from "@/components/inscricao-steps";
import { StepFamilia } from "@/app/inscricao/page";
import { IconHouse, IconUpload, IconUser, IconUsers, IconWallet, type IconComponent } from "@/components/icons";

interface FichaSection {
  id: string;
  label: string;
  icon: IconComponent;
}

const SECTIONS: FichaSection[] = [
  { id: "estudante", label: "Dados do estudante", icon: IconUser },
  { id: "familia", label: "Composição familiar", icon: IconUsers },
  { id: "moradia", label: "Moradia e bens", icon: IconHouse },
  { id: "renda", label: "Renda e despesas", icon: IconWallet },
];

const noop = () => {};

export default function FichaPage() {
  const app = useQuery({ queryKey: ["app-me"], queryFn: () => applicationsApi.me() });
  const [sec, setSec] = useState("estudante");
  const appId = app.data?.id ?? null;

  return (
    <AppShell role="candidate" crumbs={["PROUNI", "Minha inscrição", "Ficha socioeconômica"]}>
      <div className="content fade-in">
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 6 }}>
          <div>
            <h1 className="page-title">Ficha socioeconômica</h1>
            <p className="page-subtitle">
              Edite suas informações. As alterações são <strong>salvas automaticamente</strong> e protegidas pela LGPD.
            </p>
          </div>
          {app.data?.protocol && (
            <div style={{ color: "var(--ink-500)", fontSize: 12.5 }}>
              Protocolo <span className="mono" style={{ color: "var(--ink-800)" }}>{app.data.protocol}</span>
            </div>
          )}
        </div>

        {app.isLoading ? (
          <p className="muted" style={{ marginTop: 16 }}>Carregando…</p>
        ) : app.isError || !appId ? (
          <div className="banner banner-info" style={{ marginTop: 16 }}>
            <div className="banner-body">
              Você ainda não possui uma inscrição neste ciclo. Inicie pela{" "}
              <Link href="/inscricao">página de inscrição</Link>.
            </div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: 22, marginTop: 18 }}>
            <aside style={{ position: "sticky", top: 80, alignSelf: "start" }}>
              <div className="card" style={{ padding: 8 }}>
                {SECTIONS.map((s) => {
                  const active = sec === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setSec(s.id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", width: "100%",
                        borderRadius: 8, background: active ? "var(--blue-50)" : "transparent",
                        color: active ? "var(--blue-700)" : "var(--ink-700)", fontSize: 13,
                        fontWeight: active ? 600 : 500, textAlign: "left",
                      }}
                    >
                      <s.icon size={16} /> {s.label}
                    </button>
                  );
                })}
                <Link
                  href="/documentos"
                  style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 10px", borderRadius: 8, color: "var(--ink-700)", fontSize: 13, fontWeight: 500 }}
                >
                  <IconUpload size={16} /> Documentos
                </Link>
              </div>
            </aside>

            <div className="card card-pad fade-in" key={sec}>
              {sec === "estudante" && <StepEstudante appId={appId} />}
              {sec === "familia" && <StepFamilia appId={appId} onValidChange={noop} />}
              {sec === "moradia" && <StepMoradia appId={appId} onValidChange={noop} />}
              {sec === "renda" && <StepRendaDespesas appId={appId} />}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
