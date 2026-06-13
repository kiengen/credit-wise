import { ALL_CARDS, providerName, cardUrl } from "../lib/cards";
import { SITE_URL, SITE_NAME, SITE_DESCRIPTION } from "../lib/site";

export default function JsonLd() {
  const website = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: SITE_NAME,
    url: SITE_URL,
    description: SITE_DESCRIPTION,
  };

  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Credit Card Comparison",
    description: SITE_DESCRIPTION,
    numberOfItems: ALL_CARDS.length,
    itemListElement: ALL_CARDS.map((card, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "CreditCard",
        name: card.name,
        url: `${SITE_URL}${cardUrl(card.slug)}`,
        ...(card.provider
          ? {
              provider: {
                "@type": "Organization",
                name: providerName(card.provider),
              },
            }
          : {}),
        feesAndCommissionsSpecification: `Annual fee: $${card.annual_fee}`,
        ...(typeof card.apr === "number"
          ? { annualPercentageRate: card.apr }
          : {}),
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(website) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
    </>
  );
}
