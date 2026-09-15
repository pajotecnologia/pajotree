import { db } from "./db";

const migrationStatements = [
  // 1. Organization Columns
  `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "isWhiteLabel" BOOLEAN DEFAULT false`,
  `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "whiteLabelDomain" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "whiteLabelParentId" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "whiteLabelLandingJson" TEXT`,

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
    "certCrt" TEXT,
    "certKey" TEXT,
    "chavePix" TEXT,
    "contaCorrente" TEXT,
    "ambiente" TEXT NOT NULL DEFAULT 'PRODUCAO',
    "ativo" BOOLEAN NOT NULL DEFAULT false,
    "webhookUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `ALTER TABLE "OrganizationPaymentGateway" ADD COLUMN IF NOT EXISTS "certCrt" TEXT`,
  `ALTER TABLE "OrganizationPaymentGateway" ADD COLUMN IF NOT EXISTS "certKey" TEXT`,
  `ALTER TABLE "OrganizationPaymentGateway" ADD COLUMN IF NOT EXISTS "webhookUrl" TEXT`,
  `ALTER TABLE "OrganizationPaymentGateway" ADD COLUMN IF NOT EXISTS "provider" TEXT DEFAULT 'BANCO_INTER'`,
  `ALTER TABLE "OrganizationPaymentGateway" ADD COLUMN IF NOT EXISTS "ambiente" TEXT DEFAULT 'PRODUCAO'`,
  `ALTER TABLE "OrganizationPaymentGateway" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN DEFAULT false`,
  `ALTER TABLE "OrganizationPaymentGateway" DROP COLUMN IF EXISTS "certificadoCrt"`,
  `ALTER TABLE "OrganizationPaymentGateway" DROP COLUMN IF EXISTS "chavePrivadaKey"`,
  `ALTER TABLE "OrganizationPaymentGateway" DROP COLUMN IF EXISTS "webhookSecret"`,
  `ALTER TABLE "OrganizationPaymentGateway" DROP COLUMN IF EXISTS "webhookAtivo"`,

  // 6. OrganizationSmtpConfig Table
  `CREATE TABLE IF NOT EXISTS "OrganizationSmtpConfig" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL UNIQUE,
    "host" TEXT NOT NULL,
    "port" INTEGER NOT NULL DEFAULT 587,
    "user" TEXT NOT NULL,
    "pass" TEXT NOT NULL,
    "fromEmail" TEXT,
    "fromName" TEXT DEFAULT 'Pajotree',
    "secure" BOOLEAN NOT NULL DEFAULT false,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `ALTER TABLE "OrganizationSmtpConfig" ADD COLUMN IF NOT EXISTS "fromName" TEXT DEFAULT 'Pajotree'`,
  `ALTER TABLE "OrganizationSmtpConfig" ADD COLUMN IF NOT EXISTS "fromEmail" TEXT`,
  `ALTER TABLE "OrganizationSmtpConfig" ADD COLUMN IF NOT EXISTS "secure" BOOLEAN DEFAULT false`,
  `ALTER TABLE "OrganizationSmtpConfig" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN DEFAULT true`,

  // 7. OrganizationEvolutionConfig Table
  `CREATE TABLE IF NOT EXISTS "OrganizationEvolutionConfig" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL UNIQUE,
    "apiUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "instanceName" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `ALTER TABLE "OrganizationEvolutionConfig" ADD COLUMN IF NOT EXISTS "apiUrl" TEXT`,
  `ALTER TABLE "OrganizationEvolutionConfig" ADD COLUMN IF NOT EXISTS "apiKey" TEXT`,
  `ALTER TABLE "OrganizationEvolutionConfig" ADD COLUMN IF NOT EXISTS "instanceName" TEXT`,
  `ALTER TABLE "OrganizationEvolutionConfig" ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN DEFAULT true`,
  // If serverUrl column existed, migrate data to apiUrl first
  `DO $$ BEGIN
     IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='OrganizationEvolutionConfig' AND column_name='serverUrl') THEN
       UPDATE "OrganizationEvolutionConfig" SET "apiUrl" = "serverUrl" WHERE "apiUrl" IS NULL;
     END IF;
   END $$;`,
  // Drop the serverUrl column so it will never cause NOT NULL constraint violations
  `ALTER TABLE "OrganizationEvolutionConfig" DROP COLUMN IF EXISTS "serverUrl"`,

  // 8. WhatsappInstance Extra Columns
  `ALTER TABLE "WhatsappInstance" ADD COLUMN IF NOT EXISTS "apiUrl" TEXT`,
  `ALTER TABLE "WhatsappInstance" ADD COLUMN IF NOT EXISTS "credentialsEncrypted" TEXT`,
  `ALTER TABLE "WhatsappInstance" ADD COLUMN IF NOT EXISTS "webhookStatus" TEXT DEFAULT 'PENDING'`,

  // 9. AuditLog Table
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

  // 10. Notification Table
  `CREATE TABLE IF NOT EXISTS "Notification" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT,
    "userId" TEXT,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "link" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "Notification_organizationId_idx" ON "Notification"("organizationId")`,
  `CREATE INDEX IF NOT EXISTS "Notification_userId_idx" ON "Notification"("userId")`,

  // 11. TrackingConsent Table
  `CREATE TABLE IF NOT EXISTS "TrackingConsent" (
    "id" TEXT PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "visitorId" TEXT NOT NULL,
    "consentGiven" BOOLEAN NOT NULL DEFAULT true,
    "policyVersion" TEXT NOT NULL DEFAULT '1.0',
    "preferencesJson" TEXT,
    "ipHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE INDEX IF NOT EXISTS "TrackingConsent_organizationId_idx" ON "TrackingConsent"("organizationId")`,
  `CREATE INDEX IF NOT EXISTS "TrackingConsent_visitorId_idx" ON "TrackingConsent"("visitorId")`,
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
      // Ignored if column/index/table already exists or minor notice
      console.warn(`[Auto-Migrate] SQL notice: ${sql.slice(0, 45)}...`, error?.message);
    }
  }
}
