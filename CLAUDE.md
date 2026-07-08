# PROUNI Mauá — Front-end

Portal web do PROUNI do Instituto Mauá de Tecnologia: boas-vindas, verificação de e-mail, inscrição (wizard), painel, ficha socioeconômica, documentos e (futuro) área administrativa.

> Arquivo de contexto para IA (Claude Code). Mantido **apenas** no espelho pessoal (Ramonspe); não deve existir nos repositórios do `maua-edu`. Veja também `@AGENTS.md`.

## Stack
- **Next.js 16 + React 19** (App Router), **TypeScript**, **sem Tailwind** (design tokens em CSS — `globals.css`).
- **TanStack Query** + cliente tipado `lib/api.ts` (access token em memória; refresh em cookie httpOnly; refresh single-flight em 401).
- Tipos/validação compartilhados em **`./shared`** (`file:shared`, vendorizado).

## Rodar em dev
```bash
npm run dev      # http://localhost:3000
```
- `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:3001` (API). Requer a **API** e o **Docker** do `prouni-back` no ar.
- `NEXT_PUBLIC_DEV_MODE=true` mostra o checkbox **Modo desenvolvedor** no `/verificar` (pula a verificação de e-mail; o servidor só honra com `DEV_AUTH_BYPASS`). **Dev only.**

## Estrutura
- `app/`: `verificar` (e-mail-first, real), `inscricao` (wizard real: conta → ENEM → curso → família com situação de renda → documentos), `painel`/`acompanhamento` (reais), `ficha` (campos reais; persistência pendente), `documentos` (lê o resolver real), `admin/*` (mock).
- `lib/api.ts`: `authApi`, `applicationsApi` (me/events/requiredDocuments/enem/course), `familyApi`, `socioApi`, `coursesApi`, `cyclesApi`, `adminApi` (fila/análise/decisão + `exportToRm`), `catalogApi`.
- **Análise (`app/admin/analise/[id]`)**: card **"Integração RM"** — quando o candidato está *classificado*, botão **"Exportar para o RM"** (`adminApi.exportToRm`) que cria a inscrição no TOTVS RM e move o status para *concedida*; exibe a matrícula quando já exportado.
- `components/`: `app-shell`, `signup-shell`, `ui`, `icons` — preservar visual/CSS ao religar telas (evitar regressão).

## ⚠️ Convenções
- **`./shared` é vendorizado também no `prouni-back`** — mudou um tipo? Refletir nos **dois** repos.
- Commits: autor **Ramon Santos Pereira**, **pt-BR**, **sem** menção a IA/Claude. **Perguntar antes de qualquer commit/push.**

## Produção (AWS)
- Container `next start` escuta em **3000** (`PORT`), atrás de ALB (443). `NEXT_PUBLIC_API_URL` aponta para a API (ex.: `https://api.prouni.maua.br`).

## Pendências
- Persistir a ficha socioeconômica (autosave + submit) · upload real de documentos · área administrativa.
