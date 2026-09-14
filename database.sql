-- PAJOTREE - PostgreSQL database schema
-- Generated from prisma/schema.prisma on 2026-09-14.
-- This file creates the application schema only; it does not insert users,
-- passwords, plans or other seed data.
--
-- Recommended usage:
--   psql "$DATABASE_URL" -f database.sql
--
-- The application still uses Prisma as its canonical schema/migration layer.

BEGIN;

-- ================================
-- ENUM TYPES
-- ================================
CREATE TYPE "OrganizationStatus" AS ENUM ('TRIAL','ACTIVE','SUSPENDED','BLOCKED');
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE','INACTIVE','BLOCKED');
CREATE TYPE "PageStatus" AS ENUM ('DRAFT','PUBLISHED','ARCHIVED');
CREATE TYPE "BlockType" AS ENUM ('LINK','TEXT','IMAGE','VIDEO','WHATSAPP','INSTAGRAM','FACEBOOK','TIKTOK','YOUTUBE','LINKEDIN','MAP','FORM','PRODUCT','SERVICE','APPOINTMENT','TESTIMONIAL','BANNER','FAQ');
CREATE TYPE "TrackingMode" AS ENUM ('INHERIT','CUSTOM','DISABLED');
CREATE TYPE "LeadStatus" AS ENUM ('NEW','CONTACTED','QUALIFIED','NEGOTIATION','CONVERTED','LOST');
CREATE TYPE "WhatsappStatus" AS ENUM ('CONNECTING','CONNECTED','DISCONNECTED','ERROR');
CREATE TYPE "SubscriptionStatus" AS ENUM ('TRIAL','ACTIVE','PAST_DUE','CANCELLED','EXPIRED','SUSPENDED');

-- ================================
-- PLANS / TENANCY
-- ================================
CREATE TABLE "Plan" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "priceMonthly" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
  "priceYearly" DECIMAL(10,2) NOT NULL DEFAULT 0.0,
  "trialDays" INTEGER NOT NULL DEFAULT 14,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Organization" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "legalName" TEXT,
  "tradeName" TEXT,
  "document" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "whatsapp" TEXT,
  "website" TEXT,
  "description" TEXT,
  "segment" TEXT,
  "status" "OrganizationStatus" NOT NULL DEFAULT 'TRIAL',
  "logoUrl" TEXT,
  "faviconUrl" TEXT,
  "planId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Organization_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Organization_status_idx" ON "Organization"("status");
CREATE INDEX "Organization_planId_idx" ON "Organization"("planId");

CREATE TABLE "OrganizationAddress" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "zipCode" TEXT,
  "street" TEXT,
  "number" TEXT,
  "complement" TEXT,
  "neighborhood" TEXT,
  "city" TEXT,
  "state" TEXT,
  "country" TEXT DEFAULT 'BR',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationAddress_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "OrganizationAddress_organizationId_idx" ON "OrganizationAddress"("organizationId");

-- ================================
-- USERS / RBAC
-- ================================
CREATE TABLE "User" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL UNIQUE,
  "passwordHash" TEXT NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "isSuperAdmin" BOOLEAN NOT NULL DEFAULT FALSE,
  "lastLoginAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "User_email_idx" ON "User"("email");

CREATE TABLE "Role" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "isSystem" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Role_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Role_organizationId_idx" ON "Role"("organizationId");

CREATE TABLE "Permission" (
  "id" TEXT PRIMARY KEY,
  "key" TEXT NOT NULL UNIQUE,
  "description" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "OrganizationUser" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "roleId" TEXT NOT NULL,
  "status" "UserStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "OrganizationUser_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrganizationUser_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "OrganizationUser_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON UPDATE CASCADE,
  CONSTRAINT "OrganizationUser_organizationId_userId_key" UNIQUE ("organizationId","userId")
);
CREATE INDEX "OrganizationUser_organizationId_idx" ON "OrganizationUser"("organizationId");
CREATE INDEX "OrganizationUser_userId_idx" ON "OrganizationUser"("userId");

CREATE TABLE "RolePermission" (
  "roleId" TEXT NOT NULL,
  "permissionId" TEXT NOT NULL,
  PRIMARY KEY ("roleId","permissionId"),
  CONSTRAINT "RolePermission_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "Role"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "RolePermission_permissionId_fkey" FOREIGN KEY ("permissionId") REFERENCES "Permission"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "RolePermission_roleId_idx" ON "RolePermission"("roleId");
CREATE INDEX "RolePermission_permissionId_idx" ON "RolePermission"("permissionId");

-- ================================
-- PAGES / THEMES / BLOCKS
-- ================================
CREATE TABLE "Theme" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "previewImage" TEXT,
  "configJson" TEXT NOT NULL,
  "isGlobal" BOOLEAN NOT NULL DEFAULT TRUE,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "Page" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "title" TEXT,
  "description" TEXT,
  "status" "PageStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Page_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Page_organizationId_idx" ON "Page"("organizationId");
CREATE INDEX "Page_slug_idx" ON "Page"("slug");

CREATE TABLE "PageSettings" (
  "id" TEXT PRIMARY KEY,
  "pageId" TEXT NOT NULL UNIQUE,
  "themeId" TEXT,
  "backgroundType" TEXT NOT NULL DEFAULT 'gradient',
  "backgroundValue" TEXT NOT NULL DEFAULT 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%)',
  "primaryColor" TEXT NOT NULL DEFAULT '#6366f1',
  "secondaryColor" TEXT NOT NULL DEFAULT '#ec4899',
  "textColor" TEXT NOT NULL DEFAULT '#f8fafc',
  "buttonStyle" TEXT NOT NULL DEFAULT 'rounded-xl',
  "fontFamily" TEXT NOT NULL DEFAULT 'Inter',
  "layout" TEXT NOT NULL DEFAULT 'classic',
  "customCss" TEXT,
  "seoTitle" TEXT,
  "seoDescription" TEXT,
  "ogImageUrl" TEXT,
  "faviconUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageSettings_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "PageSettings_themeId_fkey" FOREIGN KEY ("themeId") REFERENCES "Theme"("id") ON UPDATE CASCADE
);

CREATE TABLE "PageBlock" (
  "id" TEXT PRIMARY KEY,
  "pageId" TEXT NOT NULL,
  "type" "BlockType" NOT NULL,
  "title" TEXT,
  "contentJson" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PageBlock_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PageBlock_pageId_idx" ON "PageBlock"("pageId");
CREATE INDEX "PageBlock_position_idx" ON "PageBlock"("position");

-- ================================
-- LINKS / TRACKING / SHORT LINKS
-- ================================
CREATE TABLE "Link" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "pageId" TEXT,
  "title" TEXT NOT NULL,
  "url" TEXT NOT NULL,
  "description" TEXT,
  "icon" TEXT,
  "image" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "startAt" TIMESTAMP(3),
  "endAt" TIMESTAMP(3),
  "openNewTab" BOOLEAN NOT NULL DEFAULT TRUE,
  "featured" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Link_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Link_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Link_organizationId_idx" ON "Link"("organizationId");
CREATE INDEX "Link_pageId_idx" ON "Link"("pageId");
CREATE INDEX "Link_position_idx" ON "Link"("position");

CREATE TABLE "LinkTrackingConfig" (
  "id" TEXT PRIMARY KEY,
  "linkId" TEXT NOT NULL UNIQUE,
  "enabled" BOOLEAN NOT NULL DEFAULT TRUE,
  "trackingMode" "TrackingMode" NOT NULL DEFAULT 'INHERIT',
  "metaPixelId" TEXT,
  "googleAnalyticsId" TEXT,
  "tiktokPixelId" TEXT,
  "eventName" TEXT DEFAULT 'Lead',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LinkTrackingConfig_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "ShortLink" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "linkId" TEXT,
  "code" TEXT NOT NULL UNIQUE,
  "destinationUrl" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ShortLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ShortLink_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ShortLink_organizationId_idx" ON "ShortLink"("organizationId");
CREATE INDEX "ShortLink_code_idx" ON "ShortLink"("code");

-- ================================
-- PIXELS / INTEGRATIONS / ANALYTICS
-- ================================
CREATE TABLE "MetaPixel" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "pixelId" TEXT NOT NULL,
  "accessTokenEncrypted" TEXT,
  "testEventCode" TEXT,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "MetaPixel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "MetaPixel_organizationId_idx" ON "MetaPixel"("organizationId");

CREATE TABLE "GoogleIntegration" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "measurementId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "GoogleIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "GoogleIntegration_organizationId_idx" ON "GoogleIntegration"("organizationId");

CREATE TABLE "TikTokPixel" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "pixelId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TikTokPixel_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "TikTokPixel_organizationId_idx" ON "TikTokPixel"("organizationId");

CREATE TABLE "AnalyticsEvent" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "pageId" TEXT,
  "linkId" TEXT,
  "eventType" TEXT NOT NULL,
  "eventName" TEXT,
  "sessionId" TEXT,
  "visitorId" TEXT,
  "referrer" TEXT,
  "userAgent" TEXT,
  "deviceType" TEXT,
  "browser" TEXT,
  "os" TEXT,
  "country" TEXT,
  "state" TEXT,
  "city" TEXT,
  "ipHash" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AnalyticsEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AnalyticsEvent_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "AnalyticsEvent_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AnalyticsEvent_organizationId_idx" ON "AnalyticsEvent"("organizationId");
CREATE INDEX "AnalyticsEvent_pageId_idx" ON "AnalyticsEvent"("pageId");
CREATE INDEX "AnalyticsEvent_linkId_idx" ON "AnalyticsEvent"("linkId");
CREATE INDEX "AnalyticsEvent_eventType_idx" ON "AnalyticsEvent"("eventType");
CREATE INDEX "AnalyticsEvent_createdAt_idx" ON "AnalyticsEvent"("createdAt");

-- ================================
-- CAMPAIGNS / QR / CRM
-- ================================
CREATE TABLE "Campaign" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "utmSource" TEXT,
  "utmMedium" TEXT,
  "utmCampaign" TEXT,
  "utmContent" TEXT,
  "utmTerm" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "startAt" TIMESTAMP(3),
  "endAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Campaign_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Campaign_organizationId_idx" ON "Campaign"("organizationId");

CREATE TABLE "QRCode" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "pageId" TEXT,
  "linkId" TEXT,
  "campaignId" TEXT,
  "code" TEXT NOT NULL UNIQUE,
  "customOptionsJson" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "QRCode_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "QRCode_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "QRCode_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "QRCode_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "QRCode_organizationId_idx" ON "QRCode"("organizationId");
CREATE INDEX "QRCode_code_idx" ON "QRCode"("code");

CREATE TABLE "Lead" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "company" TEXT,
  "message" TEXT,
  "source" TEXT DEFAULT 'bio_page',
  "campaignId" TEXT,
  "pageId" TEXT,
  "linkId" TEXT,
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Lead_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Lead_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "Campaign"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Lead_pageId_fkey" FOREIGN KEY ("pageId") REFERENCES "Page"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Lead_linkId_fkey" FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Lead_organizationId_idx" ON "Lead"("organizationId");
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_createdAt_idx" ON "Lead"("createdAt");

CREATE TABLE "Customer" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "document" TEXT,
  "email" TEXT,
  "phone" TEXT,
  "whatsapp" TEXT,
  "company" TEXT,
  "address" TEXT,
  "notes" TEXT,
  "leadId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Customer_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Customer_organizationId_idx" ON "Customer"("organizationId");

CREATE TABLE "Tag" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "color" TEXT NOT NULL DEFAULT '#6366f1',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Tag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Tag_organizationId_name_key" UNIQUE ("organizationId","name")
);
CREATE INDEX "Tag_organizationId_idx" ON "Tag"("organizationId");

CREATE TABLE "LeadTag" (
  "leadId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  PRIMARY KEY ("leadId","tagId"),
  CONSTRAINT "LeadTag_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "LeadTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "CustomerTag" (
  "customerId" TEXT NOT NULL,
  "tagId" TEXT NOT NULL,
  PRIMARY KEY ("customerId","tagId"),
  CONSTRAINT "CustomerTag_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "CustomerTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Pipeline" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "isDefault" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Pipeline_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Pipeline_organizationId_idx" ON "Pipeline"("organizationId");

CREATE TABLE "PipelineStage" (
  "id" TEXT PRIMARY KEY,
  "pipelineId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "color" TEXT NOT NULL DEFAULT '#64748b',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PipelineStage_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "PipelineStage_pipelineId_idx" ON "PipelineStage"("pipelineId");
CREATE INDEX "PipelineStage_position_idx" ON "PipelineStage"("position");

CREATE TABLE "Opportunity" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "pipelineId" TEXT NOT NULL,
  "stageId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "value" DECIMAL(12,2) NOT NULL DEFAULT 0.0,
  "leadId" TEXT,
  "customerId" TEXT,
  "assignedUserId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Opportunity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Opportunity_pipelineId_fkey" FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Opportunity_stageId_fkey" FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Opportunity_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Opportunity_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Opportunity_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Opportunity_organizationId_idx" ON "Opportunity"("organizationId");
CREATE INDEX "Opportunity_pipelineId_idx" ON "Opportunity"("pipelineId");
CREATE INDEX "Opportunity_stageId_idx" ON "Opportunity"("stageId");

CREATE TABLE "Task" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "opportunityId" TEXT,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "dueDate" TIMESTAMP(3),
  "completed" BOOLEAN NOT NULL DEFAULT FALSE,
  "assignedUserId" TEXT,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Task_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Task_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Task_assignedUserId_fkey" FOREIGN KEY ("assignedUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT "Task_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Task_organizationId_idx" ON "Task"("organizationId");
CREATE INDEX "Task_opportunityId_idx" ON "Task"("opportunityId");

CREATE TABLE "ActivityLog" (
  "id" TEXT PRIMARY KEY,
  "opportunityId" TEXT NOT NULL,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ActivityLog_opportunityId_fkey" FOREIGN KEY ("opportunityId") REFERENCES "Opportunity"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "ActivityLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "ActivityLog_opportunityId_idx" ON "ActivityLog"("opportunityId");

-- ================================
-- FORMS
-- ================================
CREATE TABLE "Form" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "successMessage" TEXT DEFAULT 'Mensagem enviada com sucesso!',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Form_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Form_organizationId_idx" ON "Form"("organizationId");

CREATE TABLE "FormField" (
  "id" TEXT PRIMARY KEY,
  "formId" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "placeholder" TEXT,
  "required" BOOLEAN NOT NULL DEFAULT FALSE,
  "optionsJson" TEXT,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FormField_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "FormField_formId_idx" ON "FormField"("formId");
CREATE INDEX "FormField_position_idx" ON "FormField"("position");

CREATE TABLE "FormSubmission" (
  "id" TEXT PRIMARY KEY,
  "formId" TEXT NOT NULL,
  "dataJson" TEXT NOT NULL,
  "ipHash" TEXT,
  "userAgent" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "FormSubmission_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "FormSubmission_formId_idx" ON "FormSubmission"("formId");

-- ================================
-- WHATSAPP
-- ================================
CREATE TABLE "WhatsappInstance" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "instanceName" TEXT NOT NULL UNIQUE,
  "phone" TEXT,
  "status" "WhatsappStatus" NOT NULL DEFAULT 'DISCONNECTED',
  "apiUrl" TEXT,
  "credentialsEncrypted" TEXT,
  "webhookStatus" TEXT DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsappInstance_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "WhatsappInstance_organizationId_idx" ON "WhatsappInstance"("organizationId");
CREATE INDEX "WhatsappInstance_instanceName_idx" ON "WhatsappInstance"("instanceName");

CREATE TABLE "WhatsappContact" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "remoteJid" TEXT NOT NULL,
  "name" TEXT,
  "profilePicUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsappContact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WhatsappContact_organizationId_remoteJid_key" UNIQUE ("organizationId","remoteJid")
);
CREATE INDEX "WhatsappContact_organizationId_idx" ON "WhatsappContact"("organizationId");

CREATE TABLE "WhatsappConversation" (
  "id" TEXT PRIMARY KEY,
  "instanceId" TEXT NOT NULL,
  "contactId" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'OPEN',
  "unread" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsappConversation_instanceId_fkey" FOREIGN KEY ("instanceId") REFERENCES "WhatsappInstance"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "WhatsappConversation_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "WhatsappContact"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "WhatsappConversation_instanceId_idx" ON "WhatsappConversation"("instanceId");
CREATE INDEX "WhatsappConversation_contactId_idx" ON "WhatsappConversation"("contactId");

CREATE TABLE "WhatsappMessage" (
  "id" TEXT PRIMARY KEY,
  "conversationId" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "messageType" TEXT NOT NULL,
  "content" TEXT,
  "mediaUrl" TEXT,
  "status" TEXT NOT NULL DEFAULT 'SENT',
  "externalId" TEXT UNIQUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "WhatsappMessage_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "WhatsappConversation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "WhatsappMessage_conversationId_idx" ON "WhatsappMessage"("conversationId");
CREATE INDEX "WhatsappMessage_externalId_idx" ON "WhatsappMessage"("externalId");

-- ================================
-- AUTOMATIONS
-- ================================
CREATE TABLE "Automation" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Automation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Automation_organizationId_idx" ON "Automation"("organizationId");

CREATE TABLE "AutomationTrigger" (
  "id" TEXT PRIMARY KEY,
  "automationId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "configJson" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationTrigger_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AutomationTrigger_automationId_idx" ON "AutomationTrigger"("automationId");

CREATE TABLE "AutomationCondition" (
  "id" TEXT PRIMARY KEY,
  "automationId" TEXT NOT NULL,
  "field" TEXT NOT NULL,
  "operator" TEXT NOT NULL,
  "value" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationCondition_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AutomationCondition_automationId_idx" ON "AutomationCondition"("automationId");

CREATE TABLE "AutomationAction" (
  "id" TEXT PRIMARY KEY,
  "automationId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "configJson" TEXT NOT NULL,
  "position" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationAction_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AutomationAction_automationId_idx" ON "AutomationAction"("automationId");
CREATE INDEX "AutomationAction_position_idx" ON "AutomationAction"("position");

CREATE TABLE "AutomationExecution" (
  "id" TEXT PRIMARY KEY,
  "automationId" TEXT NOT NULL,
  "status" TEXT NOT NULL,
  "error" TEXT,
  "metadataJson" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AutomationExecution_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "Automation"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "AutomationExecution_automationId_idx" ON "AutomationExecution"("automationId");

-- ================================
-- SUBSCRIPTIONS / BILLING
-- ================================
CREATE TABLE "PlanFeature" (
  "id" TEXT PRIMARY KEY,
  "planId" TEXT NOT NULL UNIQUE,
  "maxPages" INTEGER NOT NULL DEFAULT 1,
  "maxLinks" INTEGER NOT NULL DEFAULT 10,
  "maxUsers" INTEGER NOT NULL DEFAULT 1,
  "maxLeads" INTEGER NOT NULL DEFAULT 100,
  "maxForms" INTEGER NOT NULL DEFAULT 1,
  "maxWhatsappInstances" INTEGER NOT NULL DEFAULT 0,
  "maxMetaPixels" INTEGER NOT NULL DEFAULT 1,
  "maxAutomations" INTEGER NOT NULL DEFAULT 0,
  "maxStorageMb" INTEGER NOT NULL DEFAULT 50,
  "customDomainAllowed" BOOLEAN NOT NULL DEFAULT FALSE,
  "crmAllowed" BOOLEAN NOT NULL DEFAULT FALSE,
  "whatsappInboxAllowed" BOOLEAN NOT NULL DEFAULT FALSE,
  "advancedAnalytics" BOOLEAN NOT NULL DEFAULT FALSE,
  "removeBranding" BOOLEAN NOT NULL DEFAULT FALSE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PlanFeature_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Subscription" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "planId" TEXT NOT NULL,
  "status" "SubscriptionStatus" NOT NULL DEFAULT 'TRIAL',
  "billingCycle" TEXT NOT NULL DEFAULT 'monthly',
  "trialStart" TIMESTAMP(3),
  "trialEnd" TIMESTAMP(3),
  "currentPeriodStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "currentPeriodEnd" TIMESTAMP(3) NOT NULL,
  "cancelledAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Subscription_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Subscription_planId_fkey" FOREIGN KEY ("planId") REFERENCES "Plan"("id") ON UPDATE CASCADE
);
CREATE INDEX "Subscription_organizationId_idx" ON "Subscription"("organizationId");
CREATE INDEX "Subscription_planId_idx" ON "Subscription"("planId");

CREATE TABLE "SubscriptionUsage" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL UNIQUE,
  "linksCount" INTEGER NOT NULL DEFAULT 0,
  "pagesCount" INTEGER NOT NULL DEFAULT 0,
  "usersCount" INTEGER NOT NULL DEFAULT 1,
  "leadsCount" INTEGER NOT NULL DEFAULT 0,
  "formsCount" INTEGER NOT NULL DEFAULT 0,
  "whatsappInstances" INTEGER NOT NULL DEFAULT 0,
  "metaPixelsCount" INTEGER NOT NULL DEFAULT 0,
  "storageMbUsed" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
  "automationsCount" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SubscriptionUsage_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Payment" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "subscriptionId" TEXT,
  "provider" TEXT NOT NULL DEFAULT 'manual',
  "externalId" TEXT,
  "amount" DECIMAL(10,2) NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'BRL',
  "status" TEXT NOT NULL DEFAULT 'PAID',
  "paymentMethod" TEXT,
  "receiptUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Payment_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "Payment_organizationId_idx" ON "Payment"("organizationId");
CREATE INDEX "Payment_subscriptionId_idx" ON "Payment"("subscriptionId");

-- ================================
-- DOMAINS / AUDIT / NOTIFICATIONS
-- ================================
CREATE TABLE "Domain" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "domain" TEXT NOT NULL UNIQUE,
  "verificationStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "sslStatus" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Domain_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Domain_organizationId_idx" ON "Domain"("organizationId");
CREATE INDEX "Domain_domain_idx" ON "Domain"("domain");

CREATE TABLE "AuditLog" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "userId" TEXT,
  "action" TEXT NOT NULL,
  "entity" TEXT NOT NULL,
  "entityId" TEXT,
  "metadata" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AuditLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);
CREATE INDEX "AuditLog_organizationId_idx" ON "AuditLog"("organizationId");
CREATE INDEX "AuditLog_userId_idx" ON "AuditLog"("userId");
CREATE INDEX "AuditLog_action_idx" ON "AuditLog"("action");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");

CREATE TABLE "Notification" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT,
  "userId" TEXT,
  "type" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "message" TEXT NOT NULL,
  "read" BOOLEAN NOT NULL DEFAULT FALSE,
  "link" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "Notification_organizationId_idx" ON "Notification"("organizationId");
CREATE INDEX "Notification_userId_idx" ON "Notification"("userId");

CREATE TABLE "TrackingConsent" (
  "id" TEXT PRIMARY KEY,
  "organizationId" TEXT NOT NULL,
  "visitorId" TEXT NOT NULL,
  "consentGiven" BOOLEAN NOT NULL DEFAULT TRUE,
  "policyVersion" TEXT NOT NULL DEFAULT '1.0',
  "preferencesJson" TEXT,
  "ipHash" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "TrackingConsent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX "TrackingConsent_organizationId_idx" ON "TrackingConsent"("organizationId");
CREATE INDEX "TrackingConsent_visitorId_idx" ON "TrackingConsent"("visitorId");

COMMIT;

-- NOTE:
-- Prisma remains the canonical ORM schema. For production migrations, prefer
-- `prisma migrate deploy` after configuring DATABASE_URL. This SQL is intended
-- for environments where a direct PostgreSQL schema bootstrap is required.
