-- CreateTable
CREATE TABLE "Command" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "trigger" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'static',
    "payload" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "allowedScopes" TEXT NOT NULL DEFAULT '{}',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "ScheduleProfile" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "ranges" TEXT NOT NULL DEFAULT '[]',
    "message" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "appliesToDms" BOOLEAN NOT NULL DEFAULT false,
    "allowedGroupIds" TEXT NOT NULL DEFAULT '[]',
    "cooldownSeconds" INTEGER NOT NULL DEFAULT 3600,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "MessageLog" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "direction" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "isGroup" BOOLEAN NOT NULL DEFAULT false,
    "from" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "matchedCommandId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MessageLog_matchedCommandId_fkey" FOREIGN KEY ("matchedCommandId") REFERENCES "Command" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "commandPrefix" TEXT NOT NULL DEFAULT '!',
    "defaultTimezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo',
    "botEnabled" BOOLEAN NOT NULL DEFAULT true,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Command_trigger_key" ON "Command"("trigger");

-- Seed: initial !teste command
INSERT INTO "Command" ("trigger", "type", "payload", "enabled", "allowedScopes", "updatedAt")
VALUES ('teste', 'static', 'TESTADO!!!', 1, '{"dms":true,"groups":true,"groupIds":[]}', CURRENT_TIMESTAMP);

-- Seed: initial Settings
INSERT INTO "Settings" ("id", "commandPrefix", "defaultTimezone", "botEnabled", "updatedAt")
VALUES (1, '!', 'America/Sao_Paulo', 1, CURRENT_TIMESTAMP);
