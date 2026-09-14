import { db } from "./db";

const migrationStatements = [
  // 1. Organization Columns
  `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "isWhiteLabel" BOOLEAN DEFAULT false`,
  `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "whiteLabelDomain" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "whiteLabelParentId" TEXT`,

  // 2. Plan Columns
  `ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "organizationId" TEXT`,
  `ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE'`,

  // 3. Lead Columns
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "visualizado" BOOLEAN DEFAULT false`,
  `ALTER TABLE "Lead" ADD COLUMN IF NOT EXISTS "dataVisualizacao" TIMESTAMP(3)`,

  // 4. PasswordResetToken Table
  `CREATE TABLE IF NOT EXISTS "PasswordResetToken" (
    "id" TEXT PRIMARY KEY,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "used" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "PasswordResetToken_email_idx" ON "PasswordResetToken"("email")`,
  `CREATE INDEX IF NOT EXISTS "PasswordResetToken_token_idx" ON "PasswordResetToken"("token")`,

  // 5. OrganizationPaymentGateway Table
  `CREATE TABLE IF NOT EXISTS "OrganizationPaymentGateway" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // 6. OrganizationSmtpConfig Table
  `CREATE TABLE IF NOT EXISTS "OrganizationSmtpConfig" (
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
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // 7. OrganizationEvolutionConfig Table
  `CREATE TABLE IF NOT EXISTS "OrganizationEvolutionConfig" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL UNIQUE,
    "serverUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "instanceName" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,

  // 8. AuditLog Table
  `CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT,
    "userId" TEXT,
    "action" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "AuditLog_organizationId_idx" ON "AuditLog"("organizationId")`,
  `CREATE INDEX IF NOT EXISTS "AuditLog_userId_idx" ON "AuditLog"("userId")`,
  `CREATE INDEX IF NOT EXISTS "AuditLog_action_idx" ON "AuditLog"("action")`,
  `CREATE INDEX IF NOT EXISTS "AuditLog_createdAt_idx" ON "AuditLog"("createdAt")`,
];

/**
 * Ensures all new columns and tables exist in PostgreSQL database.
 * Executes each statement individually to guarantee success in all drivers.
 */
export async function ensureDatabaseSchema(): Promise<void> {
  for (const sql of migrationStatements) {
    try {
      await db.$executeRawUnsafe(sql);
    } catch (error: any) {
      // Ignored if column/index/table already exists
      console.warn(`[Auto-Migrate] SQL notice: ${sql.slice(0, 45)}...`, error?.message);
    }
  }
}
