"use client";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { Banner } from "@/components/ui";
import { IconGraduate, IconFolder } from "@/components/icons";
import { useRequireStaff } from "@/lib/use-require-auth";
import { CatalogCourses } from "@/components/catalog-courses";
import { CatalogDocs } from "@/components/catalog-docs";

type Tab = "cursos" | "documentos";

export default function CatalogoPage() {
  const { user } = useRequireStaff();
  const [tab, setTab] = useState<Tab>("cursos");
  const canEdit = user?.role === "ADMIN" || user?.role === "ANALYST";

  return (
    <AppShell role="admin" crumbs={["PROUNI · Admin", "Operação", "Cursos e Documentos"]}>
      <div className="content fade-in">
        <div style={{ marginBottom: 14 }}>
          <h1 className="page-title">Cursos e Documentos</h1>
          <p className="page-subtitle">
            Gerencie os cursos ofertados e a matriz de documentos — inclusive <strong>quando</strong> cada
            documento é exigido. As alterações valem para novas inscrições imediatamente.
          </p>
        </div>

        {!canEdit && (
          <Banner tone="info" title="Somente leitura">
            Seu perfil pode consultar, mas não alterar. Peça a um administrador ou analista para editar.
          </Banner>
        )}

        <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
          <button
            className={`btn btn-sm ${tab === "cursos" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTab("cursos")}
          >
            <IconGraduate size={14} /> Cursos
          </button>
          <button
            className={`btn btn-sm ${tab === "documentos" ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setTab("documentos")}
          >
            <IconFolder size={14} /> Documentos e regras
          </button>
        </div>

        {tab === "cursos" ? <CatalogCourses canEdit={canEdit} /> : <CatalogDocs canEdit={canEdit} />}
      </div>
    </AppShell>
  );
}
