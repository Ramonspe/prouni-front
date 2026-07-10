import Link from "next/link";
import { IconChevL } from "@/components/icons";

/** Link do edital oficial (PDF servido em /public). Fonte única para landing e páginas públicas. */
export const EDITAL_HREF = "/edital-prouni-2026-2.pdf";
/** Ação "Falar com a secretaria" — abre o e-mail real da Secretaria de Bolsas. */
export const SECRETARIA_MAILTO =
  "mailto:bolsas@maua.br?subject=PROUNI%20Mau%C3%A1%202026%2F2%20-%20Atendimento";

/**
 * Moldura das páginas públicas (fora da área logada): FAQ, Política de
 * Privacidade e Termos de Uso. Reaproveita o cabeçalho/rodapé da landing
 * (`welcome-*`) para manter a identidade visual, mas com corpo rolável para
 * documentos longos.
 */
export function PublicShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="welcome-shell" style={{ minHeight: "100vh", overflow: "visible" }}>
      <header className="welcome-header">
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/maua-logo.png" alt="Mauá" style={{ height: 36 }} />
          <div style={{ borderLeft: "1px solid #d8dee9", height: 28, marginLeft: 4 }} />
          <div>
            <div style={{ fontSize: 11, letterSpacing: "0.18em", textTransform: "uppercase", color: "#6c7891" }}>
              Instituto Mauá de Tecnologia
            </div>
            <div style={{ fontSize: 14, fontWeight: 700, color: "#003066", letterSpacing: "0.02em" }}>
              PROUNI · Bolsas 2026
            </div>
          </div>
        </Link>
        <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 14, fontSize: 13, color: "#4a5872" }}>
          <a href={EDITAL_HREF} target="_blank" rel="noopener noreferrer" style={{ color: "#4a5872" }}>Edital 2026/2</a>
          <Link href="/relacao-de-documentos" style={{ color: "#4a5872" }}>Relação de documentos</Link>
          <Link href="/faq" style={{ color: "#4a5872" }}>Perguntas frequentes</Link>
          <a href={SECRETARIA_MAILTO} style={{ color: "#4a5872" }}>Falar com a secretaria</a>
        </div>
      </header>

      <div className="public-doc">
        <div className="public-doc-inner">
          <Link href="/" className="public-back">
            <IconChevL size={14} /> Voltar ao início
          </Link>
          <h1 className="public-doc-title">{title}</h1>
          {subtitle && <p className="public-doc-sub">{subtitle}</p>}
          {children}
        </div>
      </div>

      <footer className="welcome-footer">
        <span>© 2026 Instituto Mauá de Tecnologia · CNPJ 60.882.298/0001-09</span>
        <span style={{ marginLeft: "auto" }}>
          <Link href="/privacidade" style={{ color: "#6c7891" }}>Política de privacidade</Link>
          <span style={{ color: "#c3cad8", margin: "0 10px" }}>·</span>
          <Link href="/termos" style={{ color: "#6c7891" }}>Termos de uso</Link>
        </span>
      </footer>
    </div>
  );
}
