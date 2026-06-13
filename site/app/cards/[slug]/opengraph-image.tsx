import { ImageResponse } from "next/og";
import { allCardSlugs, getCardBySlug, providerName } from "../../lib/cards";

export const alt = "Credit card details on CreditWise";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return allCardSlugs().map((slug) => ({ slug }));
}

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const card = getCardBySlug(slug);

  const name = card?.name ?? "Credit Card";
  const provider = card ? providerName(card.provider) : "";
  const fee =
    card == null
      ? ""
      : card.annual_fee === 0
        ? "No annual fee"
        : `$${card.annual_fee} annual fee`;
  const isPoints = (card as { reward_type?: string } | undefined)?.reward_type === "points";
  const baseRate = card
    ? (card.cash_back as Record<string, number>).other ?? 0
    : 0;
  const rateText = card
    ? isPoints
      ? `${(baseRate * 100).toFixed(1)}x base points`
      : `${(baseRate * 100).toFixed(1)}% base cash back`
    : "";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px",
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          color: "#ffffff",
        }}
      >
        <div
          style={{
            fontSize: 40,
            fontStyle: "italic",
            fontWeight: 700,
            color: "#38bdf8",
          }}
        >
          CreditWise
        </div>

        <div style={{ display: "flex", flexDirection: "column" }}>
          {provider ? (
            <div style={{ fontSize: 30, color: "#94a3b8", marginBottom: 12 }}>
              {provider}
            </div>
          ) : null}
          <div style={{ fontSize: 64, fontWeight: 700, lineHeight: 1.1, maxWidth: 1000 }}>
            {name}
          </div>
        </div>

        <div style={{ display: "flex", gap: 16, fontSize: 28, color: "#e2e8f0" }}>
          {fee ? (
            <span
              style={{
                background: "rgba(56,189,248,0.15)",
                borderRadius: 9999,
                padding: "10px 24px",
              }}
            >
              {fee}
            </span>
          ) : null}
          {rateText ? (
            <span
              style={{
                background: "rgba(56,189,248,0.15)",
                borderRadius: 9999,
                padding: "10px 24px",
              }}
            >
              {rateText}
            </span>
          ) : null}
        </div>
      </div>
    ),
    { ...size }
  );
}
