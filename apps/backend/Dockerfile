FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npx prisma generate
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
# curl para healthcheck; openssl necessário pelas engines do Prisma em Alpine
RUN apk add --no-cache curl openssl
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY prisma ./prisma
RUN npx prisma generate

EXPOSE 3001

CMD ["sh", "-c", "\
  echo '[startup] === Backend iniciando ===' && \
  echo '[startup] Executando migrations...' && \
  npx prisma migrate deploy && \
  echo '[startup] Migrations OK. Iniciando servidor...' && \
  exec node dist/main \
"]
