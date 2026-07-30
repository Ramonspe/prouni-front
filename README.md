# PROUNI Mauá (front-end)

Interface web do portal do PROUNI do Instituto Mauá de Tecnologia. Atende os candidatos pré-selecionados pelo MEC/SisProuni na inscrição, no envio de documentos comprobatórios e no acompanhamento da análise socioeconômica. Também tem uma área administrativa para a Secretaria de Bolsas.

## Funcionalidades

- Cadastro do candidato e login por CPF
- Ficha socioeconômica, com os documentos exigidos calculados a partir das respostas
- Envio e acompanhamento de documentos
- Acompanhamento do resultado da análise
- Área administrativa: análise das inscrições, gestão de usuários e parâmetros do processo seletivo

## Tecnologias

- Next.js e React com TypeScript
- TanStack Query para os dados de servidor
- Zod para validação
- Pacote `shared` com tipos e regras reaproveitados entre front e back

## Rodando localmente

Requisitos: Node 20 ou superior.

```bash
npm install
npm run dev
```

A aplicação sobe em `http://localhost:3000`. As variáveis de ambiente ficam em um arquivo `.env` (veja `.env.example`).

## Estrutura

- `app`: rotas e páginas (App Router)
- `components`: componentes de interface
- `lib`: clientes de API e utilidades
- `shared`: tipos e schemas compartilhados

Este repositório é o front-end. A API fica em um projeto separado (NestJS, Prisma e PostgreSQL).
