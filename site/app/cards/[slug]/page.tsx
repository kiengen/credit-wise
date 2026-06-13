import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check } from "lucide-react";
import TiltCard from "../../components/TiltCard";
import TrackedLink from "../../components/TrackedLink";
import TrackCardView from "../../components/TrackCardView";
import {
  allCardSlugs,
  getCardBySlug,
  providerName,
  cardUrl,
  type CardWithSlug,
} from "../../lib/cards";
import { SITE_URL, SITE_NAME } from "../../lib/site";

export const dynamicParams = false;

export function generateStaticParams() {
  return allCardSlugs().map((slug) => ({ slug }));
}

const formatKey = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const isPoints = (card: CardWithSlug) =>
  (card as { reward_type?: string }).reward_type === "points";

const rateLabel = (card: CardWithSlug, rate: number) =>
  isPoints(card) ? `${(rate * 100).toFixed(1)}x` : `${(rate * 100).toFixed(1)}%`;

const baseRate = (card: CardWithSlug) =>
  (card.cash_back as Record<string, number>).other ?? 0;

function cardDescription(card: CardWithSlug) {
  const fee = card.annual_fee === 0 ? "no annual fee" : `a $${card.annual_fee} annual fee`;
  const rewards = isPoints(card)
    ? `${(baseRate(card) * 100).toFixed(1)}x base points`
    : `${(baseRate(card) * 100).toFixed(1)}% base cash back`;
  return `The ${card.name} from ${providerName(card.provider)} has ${fee} and earns ${rewards}. Compare rewards, fees, APR, and benefits on ${SITE_NAME}.`;
}

// Ai generated placeholder for now

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const card = getCardBySlug(slug);
  if (!card) return {};

  const description = cardDescription(card);
  const url = cardUrl(card.slug);

  return {
    title: card.name,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${card.name} | ${SITE_NAME}`,
      description,
    },
    twitter: {
      card: "summary_large_image",
      title: `${card.name} | ${SITE_NAME}`,
      description,
    },
  };
}

export default async function CardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = getCardBySlug(slug);
  if (!card) notFound();

  const cashBack = card.cash_back as Record<string, number>;
  const bonusRows = Object.entries(cashBack).filter(([k]) => k !== "choice");
  const welcomeBonuses = (card.bonus as { description: string; is_welcome?: boolean }[]).filter(
    (b) => b.is_welcome
  );
  const ongoingBonuses = (card.bonus as { description: string; is_welcome?: boolean }[]).filter(
    (b) => !b.is_welcome
  );

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CreditCard",
        name: card.name,
        url: `${SITE_URL}${cardUrl(card.slug)}`,
        provider: { "@type": "Organization", name: providerName(card.provider) },
        feesAndCommissionsSpecification: `Annual fee: $${card.annual_fee}`,
        ...(typeof card.apr === "number" ? { annualPercentageRate: card.apr } : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "All Cards", item: SITE_URL },
          {
            "@type": "ListItem",
            position: 2,
            name: card.name,
            item: `${SITE_URL}${cardUrl(card.slug)}`,
          },
        ],
      },
    ],
  };

  const stats: { label: string; value: React.ReactNode }[] = [
    {
      label: "Annual Fee",
      value:
        card.annual_fee === 0 ? (
          <span className="text-green-700">$0</span>
        ) : (
          `$${card.annual_fee}`
        ),
    },
    { label: "APR", value: card.apr === 0 ? "N/A" : `${card.apr}%` },
    {
      label: isPoints(card) ? "Base Points" : "Base Cash Back",
      value: rateLabel(card, baseRate(card)),
    },
    { label: "Credit Level", value: <span className="capitalize">{card.credit}</span> },
    {
      label: "Foreign Txn Fee",
      value: card.has_ftf ? (
        "Yes"
      ) : (
        <span className="text-green-700">None</span>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--color-bg)]">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <TrackCardView
        cardName={card.name}
        cardSlug={card.slug}
        provider={card.provider}
      />

      <header className="w-full bg-white border-b border-[var(--color-border)]">
        <div className="max-w-5xl mx-auto px-6 sm:px-12 py-6">
          <Link
            href="/"
            className="text-4xl font-bold italic font-[family-name:var(--font-logo)] text-[var(--color-primary)]"
          >
            <span>Credit</span>
            <span className="-ml-2.5">Wise</span>
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 sm:px-12 py-8">
        <nav aria-label="Breadcrumb" className="mb-6 text-sm text-[var(--color-muted)]">
          <Link href="/" className="hover:text-[var(--color-accent)] hover:underline">
            All Cards
          </Link>
          <span className="mx-2">/</span>
          <span className="text-[var(--color-primary)]">{card.name}</span>
        </nav>

        <div className="flex flex-col gap-8 sm:flex-row">
          <div className="w-full sm:w-72 shrink-0">
            <TiltCard
              src={card.image === "" ? "/default_cc.png" : card.image}
              alt={card.name}
              href={card.details_link}
              default_src="/default_cc.png"
            />
          </div>

          <div className="flex-1">
            <p className="text-sm text-[var(--color-muted)]">
              {providerName(card.provider)}
            </p>
            <h1 className="mt-1 text-3xl font-bold text-[var(--color-primary)]">
              {card.name}
            </h1>
            <p className="mt-3 text-sm text-[var(--color-muted)] leading-relaxed">
              {cardDescription(card)}
            </p>

            <div className="mt-6 flex flex-wrap gap-x-8 gap-y-3">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-xs text-[var(--color-muted)]">{s.label}</p>
                  <p className="text-base font-bold text-[var(--color-primary)]">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <TrackedLink
                href={card.application_link}
                event="apply_now_click"
                params={{ card_name: card.name, card_slug: card.slug, provider: card.provider, annual_fee: card.annual_fee }}
                className="rounded-md bg-[var(--color-primary)] px-6 py-2.5 text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:bg-teal-800"
              >
                Apply Now
              </TrackedLink>
              {card.preapproval_link && (
                <TrackedLink
                  href={card.preapproval_link}
                  event="preapproval_click"
                  params={{ card_name: card.name, card_slug: card.slug, provider: card.provider }}
                  className="rounded-md border border-[var(--color-border)] px-6 py-2.5 text-xs font-semibold tracking-wide text-[var(--color-primary)] uppercase transition-colors hover:bg-[var(--color-surface)]"
                >
                  Check Pre-Approval
                </TrackedLink>
              )}
            </div>
          </div>
        </div>

        <section className="mt-10">
          <h2 className="text-xl font-bold text-[var(--color-primary)]">
            Rewards
          </h2>
          <div className="mt-3 overflow-hidden rounded-lg border border-[var(--color-border)] bg-white">
            <table className="w-full text-sm">
              <tbody>
                {bonusRows.map(([key, rate]) => (
                  <tr
                    key={key}
                    className="border-b border-[var(--color-border)] last:border-0"
                  >
                    <td className="px-4 py-2.5 text-[var(--color-primary)]">
                      {key === "other" ? "All other spending" : formatKey(key)}
                    </td>
                    <td className="px-4 py-2.5 text-right font-semibold text-[var(--color-primary)]">
                      {rateLabel(card, rate)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {welcomeBonuses.length > 0 && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-[var(--color-primary)]">
              Welcome Bonus
            </h2>
            <ul className="mt-3 space-y-2">
              {welcomeBonuses.map((b) => (
                <li
                  key={b.description}
                  className="flex items-start gap-2 text-sm text-[var(--color-primary)]"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-accent)]" />
                  {b.description}
                </li>
              ))}
            </ul>
          </section>
        )}

        {(ongoingBonuses.length > 0 || card.other.length > 0) && (
          <section className="mt-8">
            <h2 className="text-xl font-bold text-[var(--color-primary)]">
              Benefits &amp; Perks
            </h2>
            <ul className="mt-3 space-y-2">
              {ongoingBonuses.map((b) => (
                <li
                  key={b.description}
                  className="flex items-start gap-2 text-sm text-[var(--color-primary)]"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {b.description}
                </li>
              ))}
              {(card.other as string[]).map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-[var(--color-muted)]"
                >
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                  {item}
                </li>
              ))}
            </ul>
          </section>
        )}

        <div className="mt-10 border-t border-[var(--color-border)] pt-6">
          <Link
            href="/"
            className="text-sm font-semibold text-[var(--color-accent)] hover:underline"
          >
            ← Compare all credit cards
          </Link>
        </div>
      </main>
    </div>
  );
}
