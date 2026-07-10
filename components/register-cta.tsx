"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { IconChevR, IconClock, IconUser } from "@/components/icons";
import { authApi } from "@/lib/api";
import type { RegistrationStatusDto } from "@prouni/shared";

function fmt(d: string | null): string {
  return d ? d.split("-").reverse().join("/") : "—";
}

/**
 * Botão "Quero me cadastrar" com trava por período. Só habilita quando há uma
 * chamada aberta hoje. Em falha de rede, mantém habilitado (fail-open) — o
 * backend ainda barra o cadastro fora do prazo.
 */
export function RegisterCta() {
  const [status, setStatus] = useState<RegistrationStatusDto | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let alive = true;
    authApi
      .registrationStatus()
      .then((s) => alive && setStatus(s))
      .catch(() => alive && setStatus(null))
      .finally(() => alive && setLoaded(true));
    return () => {
      alive = false;
    };
  }, []);

  if (!loaded) {
    return (
      <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 18 }} disabled>
        <IconClock size={16} /> Carregando período…
      </button>
    );
  }

  const open = status ? status.open : true;
  const configured = (status?.calls ?? []).filter((c) => c.start || c.end);

  if (!open) {
    return (
      <div style={{ marginTop: 18 }}>
        <button
          className="btn btn-primary btn-lg btn-block"
          disabled
          aria-disabled="true"
          title="As inscrições estão fora do período"
          style={{ opacity: 0.6, cursor: "not-allowed" }}
        >
          <IconUser size={16} /> Cadastro fora do período
        </button>
        <div
          className="welcome-cta-foot"
          style={{ marginTop: 12, background: "#fff6ed", border: "1px solid #f5d5ac", borderRadius: 8, padding: "10px 12px", color: "#8a5a10" }}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>As inscrições não estão abertas no momento.</div>
          {configured.length > 0 ? (
            <ul style={{ margin: "4px 0 0", paddingLeft: 16 }}>
              {configured.map((c) => (
                <li key={c.value}>
                  {c.label}: {fmt(c.start)} a {fmt(c.end)}
                </li>
              ))}
            </ul>
          ) : (
            <span>Consulte o cronograma no edital do Prouni.</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Link href="/verificar" className="btn btn-primary btn-lg btn-block" style={{ marginTop: 18 }}>
      <IconUser size={16} /> Quero me cadastrar
      <IconChevR size={16} />
    </Link>
  );
}
