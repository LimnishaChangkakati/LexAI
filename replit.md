# LexAI - Indian Legal Document Analysis Platform

## Overview

AI-powered platform for analyzing Indian legal documents using RAG (Retrieval-Augmented Generation), Named Entity Recognition, case outcome classification, and multi-document cross-referencing.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite + TailwindCSS + shadcn/ui + Recharts + wouter
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **AI**: Gemini 2.5 Flash via Replit AI Integrations (no API key needed)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Features

1. **RAG Pipeline** — Vector-indexed IPC/BNS/CrPC corpus for grounded legal citation retrieval
2. **Named Entity Recognition** — Extracts JUDGE, PETITIONER, RESPONDENT, DATE, CASE_NUMBER, COURT
3. **Outcome Classifier** — Predicts verdict type (acquittal/conviction/appeal/settlement) and bail classification
4. **Multi-document Cross-referencing** — Identify contradictions, patterns, and precedents across multiple cases
5. **Legal Chatbot** — AI chatbot grounded in document context + analysis for follow-up queries
6. **Dashboard** — Statistics, case type distribution, outcome breakdown, confidence metrics

## Artifacts

- `artifacts/legal-ai` — React + Vite frontend (preview: `/`)
- `artifacts/api-server` — Express API server (preview: `/api`)

## Key Files

- `artifacts/api-server/src/lib/legal-ai.ts` — Core AI logic: RAG retrieval, NER analysis, outcome classification, chatbot
- `artifacts/api-server/src/routes/documents.ts` — All API routes
- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth)
- `lib/db/src/schema/documents.ts` — DB schema: documents, analysis_results, chat_messages

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

## Important Notes

- After running codegen, manually update `lib/api-zod/src/index.ts` to only export `./generated/api` (orval generates stale references)
- The orval zod config uses `indexFiles: false` to prevent regenerating src/index.ts
- `@google/genai` must be a direct dependency of `@workspace/api-server` (externalized in esbuild build)
- AI integration uses `AI_INTEGRATIONS_GEMINI_BASE_URL` and `AI_INTEGRATIONS_GEMINI_API_KEY` (auto-set by Replit)
