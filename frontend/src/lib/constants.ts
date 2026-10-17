export const APP_NAME = "BotForge";
export const APP_DESCRIPTION = "Multi-Tenant AI Bot-as-a-Service Platform";

export const PLAN_TIERS = [
  { value: "trial", label: "Trial Plan (14 Days)" },
  { value: "starter", label: "Starter ($49/mo)" },
  { value: "pro", label: "Professional ($199/mo)" },
] as const;

export const DOCUMENT_SOURCE_TYPES = {
  PDF: "pdf",
  URL: "url",
  FAQ: "faq_text",
} as const;

export const DOCUMENT_STATUSES = {
  PENDING: "pending",
  PROCESSING: "processing",
  READY: "ready",
  FAILED: "failed",
} as const;

export const BRAND_STATUSES = {
  ACTIVE: "active",
  SUSPENDED: "suspended",
} as const;
