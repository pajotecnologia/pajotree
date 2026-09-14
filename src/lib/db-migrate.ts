import { db } from "./db";

let migrationRun = false;

/**
 * Ensures all new columns and tables exist in PostgreSQL database.
 * This is 100% idempotent and runs silently on application startup.
 */
export async function ensureDatabaseSchema(): Promise<void> {
  if (migrationRun) return;
  migrationRun = true;

  try {
    // 1. Organization, Plan & Lead Columns
    await db.$executeRawUnsafe(`
      ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "isWhiteLabel" BOOLEAN DEFAULT false;
      ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "whiteLabelDomain" TEXT;
      ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "whiteLabelParentId" TEXT;
      ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;
      ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE';
      ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "visualizado" BOOLEAN DEFAULT false;
      ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "dataVisualizacao" TIMESTAMP(3);
    `);

    // 2. PasswordResetToken Table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT NOT NULL,
        "token" TEXT NOT NULL UNIQUE,
        "expiresAt" TIMESTAMP(3) NOT NULL,
        "used" BOOLEAN NOT NULL DEFAULT false,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "PasswordResetToken_email_idx" ON "PasswordResetToken"("email");
      CREATE INDEX IF NOT EXISTS "PasswordResetToken_token_idx" ON "PasswordResetToken"("token");
    `);

    // 3. OrganizationPaymentGateway Table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrganizationPaymentGateway" (
        "id" TEXT PRIMARY KEY,
        "organizationId" TEXT NOT NULL UNIQUE,
        "provider" TEXT NOT NULL DEFAULT 'BANCO_INTER',
        "clientId" TEXT,
        "clientSecret" TEXT,
        "chavePix" TEXT,
        "contaCorrente" TEXT,
        "certificadoCrt" TEXT,
        "chavePrivadaKey" TEXT,
        "webhookSecret" TEXT,
        "ambiente" TEXT NOT NULL DEFAULT 'PRODUCAO',
        "ativo" BOOLEAN NOT NULL DEFAULT false,
        "webhookAtivo" BOOLEAN NOT NULL DEFAULT false,
        "webhookUrl" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "OrganizationPaymentGateway_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // 4. OrganizationSmtpConfig Table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrganizationSmtpConfig" (
        "id" TEXT PRIMARY KEY,
        "organizationId" TEXT NOT NULL UNIQUE,
        "host" TEXT NOT NULL,
        "port" INTEGER NOT NULL DEFAULT 587,
        "user" TEXT NOT NULL,
        "pass" TEXT NOT NULL,
        "fromEmail" TEXT,
        "fromName" TEXT,
        "secure" BOOLEAN NOT NULL DEFAULT false,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "OrganizationSmtpConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // 5. OrganizationEvolutionConfig Table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "OrganizationEvolutionConfig" (
        "id" TEXT PRIMARY KEY,
        "organizationId" TEXT NOT NULL UNIQUE,
        "serverUrl" TEXT NOT NULL,
        "apiKey" TEXT NOT NULL,
        "instanceName" TEXT,
        "ativo" BOOLEAN NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "OrganizationEvolutionConfig_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);

    // 6. AuditLog Table
    await db.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "AuditLog" (
        "id" TEXT PRIMARY KEY,
        "organizationId" TEXT,
        "userId" TEXT,
        "action" TEXT NOT NULL,
        "entity" TEXT NOT NULL,
        "entityId" TEXT,
        "metadata" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
      CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId");
      CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action");
      CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
    `);

    console.log("✅ Auto-migração do schema do banco de dados verificada com sucesso.");
  } catch (error) {
    console.warn("Aviso na auto-migração do banco de dados:", error);
  }
}
