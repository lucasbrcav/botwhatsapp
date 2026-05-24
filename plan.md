# Plan: Bot WhatsApp com Admin Panel

## TL;DR
Construir um bot de WhatsApp self-hosted via Docker Compose com 4 serviços: **WAHA** (gateway WhatsApp), **backend NestJS** (orquestrador de comandos, webhooks, agendamento e auto-resposta), **admin panel Next.js** (config visual com login simples), **Redis** (filas/cache de janelas de horário) + **SQLite** persistente em volume. Inicialmente apenas o comando `!teste → "TESTADO!!!"`, com arquitetura extensível para novos comandos via painel. Auto-resposta "fora de horário" suportando múltiplos perfis (almoço/noite/feriado) aplicáveis a DMs e grupos específicos.

---

## Arquitetura

```
WhatsApp ─► WAHA (3000) ──webhook──► Backend NestJS (3001) ──► SQLite (volume)
                                            │                  Redis (filas)
                                            ▼
                                      Admin Next.js (3002)
```

- **WAHA** expõe API HTTP (`/api/sendText`, etc.) e envia webhooks de `message` para o backend.
- **Backend** valida origem, identifica grupo/DM, casa contra regras de comando e horário, executa handler, responde via WAHA.
- **Admin** (Next.js App Router) consome REST do backend, autenticação via cookie httpOnly + JWT.

---

## Fases

### Fase 1 — Scaffolding & Infra
1. Estrutura monorepo simples: `apps/backend`, `apps/admin`, `infra/` (compose, .env.example).
2. `docker-compose.yml` com serviços: `waha`, `backend`, `admin`, `redis`. Volumes: `./data/sqlite`, `./data/waha`, `./data/redis`. Rede interna `botnet`.
3. `.env.example` com `WAHA_API_KEY`, `WAHA_URL`, `ADMIN_USER`, `ADMIN_PASS_HASH`, `JWT_SECRET`, `WEBHOOK_SECRET`.
4. README curto com passos: copiar `.env`, `docker compose up -d`, escanear QR em `http://localhost:3000`, login no admin em `:3002`.

### Fase 2 — Backend NestJS
1. **Módulos**:
   - `AuthModule`: login único (usuário/senha do .env), emite JWT, guard para rotas admin.
   - `WahaModule`: cliente HTTP tipado (axios) para WAHA — `sendText`, `getChats`, `getGroups`, `startSession`, `getQR`.
   - `WebhookModule`: endpoint `POST /webhooks/waha` autenticado por header `X-Webhook-Secret`; dispatcha eventos para handlers.
   - `CommandsModule`: registry de handlers; parser de prefixo configurável (default `!`); resolve comando, valida escopo (grupos permitidos), executa, responde.
     - Handler inicial: `TestCommandHandler` → responde `"TESTADO!!!"`.
   - `SchedulesModule`: define perfis de horário (cron-like com timezone), grupos/DMs alvo, mensagem template, anti-flood (1 resposta por contato a cada N min via Redis).
   - `MessagesModule`: log de mensagens recebidas/enviadas para auditoria no painel.
   - `ConfigModule` (DB): tabelas via Prisma com SQLite.
2. **Schema Prisma** (`apps/backend/prisma/schema.prisma`):
   - `Command` (id, trigger, type[`static`|`http`|`shell` — só `static` na v1], payload, enabled, allowedScopes[json: dms/groups/ids]).
   - `ScheduleProfile` (id, name, timezone, ranges[json: [{dow,startHHmm,endHHmm}]], message, enabled, appliesToDms, allowedGroupIds[json], cooldownSeconds).
   - `MessageLog` (id, direction, chatId, isGroup, from, body, matchedCommandId?, createdAt).
   - `Settings` (singleton: commandPrefix, defaultTimezone, botEnabled).
3. **Filas Redis (BullMQ)**:
   - `outgoing-messages`: serializa envios para evitar rate-limit WAHA.
   - `auto-reply-cooldown`: chave `cooldown:<chatId>:<profileId>` com TTL.
4. **Endpoints REST** (todos sob `/api`, autenticados exceto `/auth/login` e `/webhooks/waha`):
   - `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`
   - `GET/POST/PATCH/DELETE /commands`
   - `GET/POST/PATCH/DELETE /schedules`
   - `GET /settings`, `PATCH /settings`
   - `GET /messages?chatId&limit` (logs)
   - `GET /waha/status`, `GET /waha/qr`, `POST /waha/restart`
   - `GET /chats`, `GET /groups` (proxy para WAHA — para o painel listar grupos selecionáveis)
   - `POST /send` — envio manual de mensagem via painel

### Fase 3 — Admin Panel Next.js
1. Next.js 14 App Router + Tailwind + shadcn/ui + TanStack Query.
2. Páginas:
   - `/login` — usuário/senha.
   - `/` (dashboard) — status WAHA (conectado/QR), bot on/off toggle, últimos 20 logs.
   - `/connection` — exibe QR code (img base64 do endpoint WAHA), botão reiniciar sessão.
   - `/commands` — CRUD; form com trigger, resposta estática, multi-select de grupos permitidos, toggle "permitir em DMs".
   - `/schedules` — CRUD de perfis fora-de-horário; editor visual de faixas por dia da semana, timezone, mensagem, grupos/DMs alvo, cooldown.
   - `/logs` — tabela paginada com filtro por chat.
   - `/chats` — lista de chats/grupos (nome + ID), clica → histórico de mensagens + campo de resposta manual.
   - `/settings` — prefixo de comando, timezone padrão.
3. Middleware Next protege rotas autenticadas via cookie.

### Fase 4 — Verificação & Hardening
1. Smoke test manual end-to-end (ver Verification).
2. Sanitização de input (trigger sem regex injection, escopo validado).
3. Rate-limit em `/auth/login` (5 tentativas / 15min).
4. Webhook autenticado por shared-secret; rejeita se header inválido.
5. CORS restrito ao admin.

---

## Arquivos críticos

| Arquivo | Responsabilidade |
|---|---|
| `infra/docker-compose.yml` | 4 serviços + healthchecks + rede `botnet` |
| `infra/.env.example` | Variáveis de ambiente |
| `apps/backend/prisma/schema.prisma` | `Command` / `ScheduleProfile` / `MessageLog` / `Settings` |
| `apps/backend/src/modules/waha/waha.service.ts` | Wrapper HTTP do WAHA |
| `apps/backend/src/modules/webhook/webhook.controller.ts` | Recepção de eventos WAHA |
| `apps/backend/src/modules/commands/commands.dispatcher.ts` | Parser + lookup + execução |
| `apps/backend/src/modules/commands/handlers/test.handler.ts` | Comando `!teste` |
| `apps/backend/src/modules/schedules/schedules.service.ts` | Avaliação de janela + cooldown Redis |
| `apps/admin/app/(auth)/login/page.tsx` | Tela de login |
| `apps/admin/app/(dashboard)/**` | Todas as páginas do painel |
| `apps/admin/lib/api.ts` | Cliente fetch com cookie credentials |

---

## Verificação (checklist)

- [ ] `docker compose up -d` → 4 serviços `healthy`
- [ ] Escanear QR em `/connection` → WAHA `WORKING`
- [ ] `!teste` em grupo autorizado → resposta `"TESTADO!!!"` em ≤3s; log registrado
- [ ] `!teste` em DM não autorizada → ignorado (escopo restrito)
- [ ] Criar perfil "Noite" (22h–07h BRT, DMs) → DM no horário recebe auto-resposta; reenvio no cooldown não duplica
- [ ] Toggle "bot off" no dashboard → `!teste` para de responder
- [ ] Webhook com secret errado → 401
- [ ] `/api/commands` sem cookie → 401
- [ ] Envio manual pelo painel `/chats` → mensagem entregue

---

## Decisões

| Decisão | Escolha |
|---|---|
| Gateway WhatsApp | WAHA Core (free, 1 sessão, Docker) |
| Backend | NestJS + Prisma + SQLite + BullMQ |
| Admin | Next.js 14 App Router + Tailwind + shadcn/ui |
| Auth admin | Single-user via `.env` + bcrypt; JWT em cookie httpOnly |
| Comando inicial | `!teste` estático; registry preparado para HTTP/shell |
| Persistência | SQLite em `./data/sqlite/bot.db`; sessão WAHA em `./data/waha` |
| Deploy | Docker Compose (Portainer-friendly) |
| Timezone padrão | `America/Sao_Paulo` (configurável por perfil) |

### Fora do escopo v1
- Comandos HTTP/shell configuráveis via painel
- Multi-tenant / multi-sessão WhatsApp
- Métricas/Prometheus
- Backup automatizado

---

## Considerações importantes

1. **Anti-ban**: WhatsApp pode banir números usados via API não-oficial. Use um chip/número **dedicado** (não o seu principal). A fila BullMQ já implementa throttle ≥1s entre envios.
2. **WAHA Core vs Plus**: Core basta para v1. Se no futuro precisar de webhooks ricos (presence, read receipts, multi-sessão), avaliar WAHA Plus (pago).
3. **Timezone**: default `America/Sao_Paulo` em `Settings`, com override por perfil de schedule. Avaliação usa `date-fns-tz`.
