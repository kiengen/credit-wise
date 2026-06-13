import {
  american_express,
  bank_of_america,
  capital_one,
  chase,
  citigroup,
  wells_fargo,
} from "../data";

export const PROVIDER_NAMES: Record<string, string> = {
  american_express: "American Express",
  bank_of_america: "Bank of America",
  capital_one: "Capital One",
  chase: "Chase",
  citigroup: "Citi",
  wells_fargo: "Wells Fargo",
};

export const providerName = (provider: string) =>
  PROVIDER_NAMES[provider] ?? provider.replace(/_/g, " ");

// Canonical, stable ordering — must match the homepage list order.
const RAW = [
  ...american_express,
  ...bank_of_america,
  ...capital_one,
  ...chase,
  ...citigroup,
  ...wells_fargo,
].filter((c) => c.application_link);

const baseSlug = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

function assignSlugs() {
  const seen: Record<string, number> = {};
  return RAW.map((card) => {
    const base = baseSlug(card.name);
    const n = (seen[base] = (seen[base] ?? 0) + 1);
    const slug = n === 1 ? base : `${base}-${n}`;
    return { ...card, slug };
  });
}

export const ALL_CARDS = assignSlugs();
export type CardWithSlug = (typeof ALL_CARDS)[number];

const BY_SLUG = new Map(ALL_CARDS.map((c) => [c.slug, c]));

export const getCardBySlug = (slug: string): CardWithSlug | undefined =>
  BY_SLUG.get(slug);

export const allCardSlugs = (): string[] => ALL_CARDS.map((c) => c.slug);

export const cardUrl = (slug: string) => `/cards/${slug}`;
