# Bot WhatsApp com Admin Panel

Bot WhatsApp self-hosted com painel de administração. Baseado em WAHA (gateway), NestJS (backend) e Next.js (admin panel).

## Pré-requisitos

- Docker e Docker Compose instalados
- Número de WhatsApp dedicado (não use o seu principal)

## Setup rápido

```bash
# 1. Copiar variáveis de ambiente
cp infra/.env.example infra/.env

# 2. Editar o .env com seus valores (especialmente JWT_SECRET e WEBHOOK_SECRET)
# Para gerar o hash da senha do admin:
node -e "require('bcryptjs').hash('suasenha',10).then(console.log)"

# 3. Subir os serviços
cd infra
docker compose up -d

# 4. Acompanhar os logs
docker compose logs -f
```

## Serviços

| Serviço | URL | Descrição |
|---------|-----|-----------|
| WAHA | http://localhost:3000 | Gateway WhatsApp — escaneie o QR aqui |
| Backend | http://localhost:3001 | API NestJS |
| Admin Panel | http://localhost:3002 | Painel de configuração |

## Primeiros passos

1. Acesse http://localhost:3002/connection e escaneie o QR Code com seu WhatsApp
2. Aguarde o status mudar para `WORKING`
3. Faça login no painel: http://localhost:3002/login (usuário/senha do `.env`)
4. Envie `!teste` em um grupo para testar — o bot responderá `TESTADO!!!`

## Comandos úteis

```bash
# Ver status dos serviços
docker compose ps

# Reiniciar um serviço
docker compose restart backend

# Ver logs de um serviço
docker compose logs -f backend

# Parar tudo
docker compose down

# Parar e remover volumes (⚠️ apaga dados)
docker compose down -v
```

## Estrutura

```
.
├── apps/
│   ├── backend/     # NestJS — API, webhooks, comandos, schedules
│   └── admin/       # Next.js — Painel de administração
├── infra/
│   ├── docker-compose.yml
│   └── .env.example
├── data/            # Criado automaticamente pelo Docker
│   ├── sqlite/      # Banco de dados SQLite
│   ├── waha/        # Sessão WhatsApp
│   └── redis/       # Cache Redis
└── plan.md
```

## Aviso importante

> ⚠️ O WhatsApp pode banir números que utilizam APIs não-oficiais. Use sempre um chip/número **dedicado**, nunca o seu número pessoal.
