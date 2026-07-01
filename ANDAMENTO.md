# PROUNI Mauá — Andamento do desenvolvimento (handoff)

> **Branch de _snapshot_** do trabalho de cadastro (front + back), commitada para registro/continuidade no repositório do time. Histórico próprio — **não** é um diff direto sobre a `main` do time (que evoluiu em paralelo: CI, eslint, `AGENTS.md`, alterações em `account.service` etc.). A integração com a linha atual do `maua-edu` é um passo à parte. Autoria: Ramon Santos Pereira (Ramonspf).

## Estado (16/06/2026)
Cadastro do candidato **implementado de ponta a ponta** (front + back) e em validação local.

## Entregue

**Matriz de documentos condicional (como DADO, não hardcode)**
- `DocumentType`: `scope` (APPLICATION / EACH_MEMBER / EACH_ADULT), `condition` (ALWAYS, INCOME_SITUATION, INCOME_COMMISSION_OVERTIME, COMPANY_INACTIVE, HOUSING_TENURE, HAS_VEHICLE, HAS_UNDECLARED_ASSETS, OPT_IN_COTAS, IS_PCD, IS_IMT_AFFILIATED, GUARDIANSHIP, OTHER_INCOME), `conditionValues`, `requiresSignature` (gov.br).
- Resolver: `src/modules/applications/required-documents.service.ts` — multiplica por integrante/adulto e filtra pela situação de cada um.
- Seed (`prisma/seed.ts`) conforme **Relação de documentos 05/06** + **Mapeamento de obrigatórios × condicionais**.

**Cadastro (front) — wizard de 10 passos** (`app/inscricao/page.tsx` + `components/inscricao-steps.tsx`)
1. Verificação de e-mail · 2. Criação de acesso (cotas / PCD / vínculo IMT) · 3. ENEM · 4. Curso e campus · 5. Dados do estudante · 6. Composição familiar (situação de renda **multi-seleção** + sub-perguntas) · 7. Moradia e bens · 8. Renda e despesas · 9. Documentos (lista condicional + **upload**) · 10. Revisão e envio → protocolo.
- Validação obrigatória por passo; máscaras CPF/celular/CEP; data de nascimento em selects; campos fiéis à ficha (despesas completas, outras rendas, estudos do grupo, "cedido por quem", telefone fixo).

**Upload de documentos**
- Back: `modules/storage` (MinIO/S3) + `modules/documents` (endpoint multipart → `Document`/`DocumentVersion`, status). Dependência `@aws-sdk/client-s3`.

**Ficha socioeconômica**
- Embutida no cadastro **e** editável na área logada (`/ficha`) — mesma API (`socioApi`).

## Arquitetura
- **Back:** NestJS + Prisma + Postgres. Módulos: account (start/verify/register, anti-enumeração), auth (JWT), applications (+ resolver `required-documents`), socio-economic, family, documents, storage, cycles, courses, mail. Migrations em `prisma/migrations`.
- **Front:** Next.js (App Router). `lib/api.ts` (authApi, applicationsApi, socioApi, familyApi, documentsApi, cyclesApi).
- **shared/** vendorizado nos dois repos (tipos + schemas Zod + STATUS_MAP + cpf). Mudou tipo de domínio → refletir nos dois.

## Como rodar (local)
1. `docker compose -f docker-compose.dev.yml up -d` (Postgres :5432; MinIO :9000/9001 bucket `prouni-docs`; Mailpit :1025/8025).
2. **Back:** `npm i` · `npx prisma migrate deploy` · `npx prisma db seed` · `npm run start:dev` (API em **:3001**).
3. **Front:** `npm i` · `npm run dev` (**:3000**).
- **Modo dev:** `DEV_AUTH_BYPASS=true` (back) + `NEXT_PUBLIC_DEV_MODE` (front) pulam a verificação de e-mail; e-mails caem no Mailpit (:8025).
- **Dados de teste (seed):** admin CPF 529.982.247-25 · analista 111.444.777-35 (senha `Prouni@2026`); pré-selecionados 390.533.447-05 e 168.995.350-09.

## Pendências / em aberto
- **Bug em investigação:** `/account/start` retornando *"Não foi possível enviar o código"* — checar logs do back / conexão Mailpit / throttler.
- **Decisão de negócio:** documentos obrigatórios **antes** do protocolo ou enviáveis **depois** (hoje: depois, na área logada).
- **Bolsas (confirmar):** regra de *aluguel sem contrato* (hoje em documento combinado) e *certidão de veículo* (hoje exigida de todos).
- **Jurídico:** texto dos consentimentos (placeholder) + integração de **e-assinatura gov.br** (hoje só a flag `requiresSignature`).
- Campo **NIS** sem máscara/limite.
- **Fora do escopo deste cadastro:** análise/parecer e pendências (admin), importação SisProuni.

## Convenções
- Valores monetários em string canônica ("1234.56") / `Decimal(12,2)` no banco — nunca float.
- Commits pt-BR; ficha é a fonte de verdade da composição de campos.
