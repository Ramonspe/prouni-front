"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { IconChevR, IconClock, IconUser } from "@/components/icons";
import { authApi } from "@/lib/api";
import type { RegistrationStatusDto } from "@prouni/shared";

function fmt(d: string | null): string {
  return d ? d.split("-").reverse().join("/") : "—";
}

type DisplayPeriod =
  | {
      source: "canonical";
      key: string;
      label: string;
      startsAt: string | null;
      endsAt: string | null;
      timeZone: string;
    }
  | {
      source: "legacy";
      key: string;
      label: string;
      startsAt: string | null;
      endsAt: string | null;
      timeZone: null;
    };

export function registrationDisplayPeriods(
  status: RegistrationStatusDto | null,
): DisplayPeriod[] {
  const canonical = status?.selectionCalls ?? [];
  if (canonical.length) {
    return canonical
      .filter((item) => item.startsAt || item.endsAt)
      .map((item) => ({
        source: "canonical",
        key: item.call.id,
        label: item.call.name,
        startsAt: item.startsAt,
        endsAt: item.endsAt,
        timeZone: item.call.timeZone,
      }));
  }
  return (status?.calls ?? [])
    .filter((item) => item.start || item.end)
    .map((item) => ({
      source: "legacy",
      key: item.value,
      label: item.label,
      startsAt: item.start,
      endsAt: item.end,
      timeZone: null,
    }));
}

export function nextRegistrationBoundary(
  status: RegistrationStatusDto | null,
  nowMs: number,
): number | null {
  const future = (status?.selectionCalls ?? [])
    .flatMap((item) => [item.startsAt, item.endsAt])
    .filter((instant): instant is string => Boolean(instant))
    .map((instant) => Date.parse(instant))
    .filter((instant) => Number.isFinite(instant) && instant > nowMs);
  return future.length ? Math.min(...future) : null;
}

function fmtInstant(instant: string | null, timeZone: string): string {
  if (!instant) return "—";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
    timeZone,
  }).format(new Date(instant));
}

/**
 * Botão "Quero me cadastrar" com trava por período. Só habilita quando há uma
 * chamada aberta hoje. Em falha de rede, mantém habilitado (fail-open) — o
 * backend ainda barra o cadastro fora do prazo.
 */
export function RegisterCta() {
  const [status, setStatus] = useState<RegistrationStatusDto | null>(null);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await authApi.registrationStatus());
    } catch {
      setStatus(null);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    void refresh();
    const onVisibility = () => {
      if (alive && document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      alive = false;
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [refresh]);

  useEffect(() => {
    const boundary = nextRegistrationBoundary(status, Date.now());
    if (boundary === null) return;
    const delay = Math.min(
      Math.max(boundary - Date.now() + 50, 50),
      2_147_000_000,
    );
    const timer = window.setTimeout(() => void refresh(), delay);
    return () => window.clearTimeout(timer);
  }, [refresh, status]);

  if (!loaded) {
    return (
      <button className="btn btn-primary btn-lg btn-block" style={{ marginTop: 18 }} disabled>
        <IconClock size={16} /> Carregando período…
      </button>
    );
  }

  const open = status ? status.open : true;
  const configured = registrationDisplayPeriods(status);

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
              {configured.map((period) => (
                <li key={period.key}>
                  {period.label}:{" "}
                  {period.source === "canonical"
                    ? `${fmtInstant(period.startsAt, period.timeZone)} a ${fmtInstant(period.endsAt, period.timeZone)} (${period.timeZone === "America/Sao_Paulo" ? "horário de Brasília" : period.timeZone})`
                    : `${fmt(period.startsAt)} a ${fmt(period.endsAt)}`}
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
