import { db } from "./db";

const migrationStatements = [
  // 0. User Columns
  `ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`,
  `UPDATE "User" SET "username" = LOWER(SPLIT_PART("email", '@', 1)) WHERE ("username" IS NULL OR "username" LIKE '%@%') AND LOWER(SPLIT_PART("email", '@', 1)) NOT IN (SELECT LOWER(SPLIT_PART("email", '@', 1)) FROM "User" GROUP BY LOWER(SPLIT_PART("email", '@', 1)) HAVING COUNT(*) > 1)`,
  `UPDATE "User" SET "username" = LOWER("email") WHERE "username" IS NULL`,

  // 1. Organization Columns
  `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "isWhiteLabel" BOOLEAN DEFAULT false`,
  `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "whiteLabelDomain" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "whiteLabelParentId" TEXT`,
  `ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "whiteLabelLandingJson" TEXT`,

  // 2. Plan Columns
  `ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "organizationId" TEXT`,
  `ALTER TABLE "Plan" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'ACTIVE'`,

  // 2.1 PageSettings Columns
  `ALTER TABLE "PageSettings" ADD COLUMN IF NOT EXISTS "showContactForm" BOOLEAN DEFAULT false`,

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

let migrationDone = false;

/**
 * Ensures all new columns and tables exist in PostgreSQL database.
 * Executes once and never blocks API requests.
 */
export async function ensureDatabaseSchema(): Promise<void> {
  if (migrationDone) {
    return;
  }
  migrationDone = true;

  for (const sql of migrationStatements) {
    try {
      await db.$executeRawUnsafe(sql);
    } catch {
      // Ignored if table/column already exists
    }
  }
}

