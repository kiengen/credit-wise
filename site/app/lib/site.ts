// Single source of truth for the site's absolute URL.
// Override per-environment with NEXT_PUBLIC_SITE_URL (e.g. in Vercel).
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://creditwise.dev"
).replace(/\/$/, "");

export const SITE_NAME = "CreditWise";
export const SITE_DESCRIPTION =
  "Find and compare the best credit cards. Compare rewards, fees, APR, and benefits side by side based on your real spending.";
