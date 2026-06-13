"use client";

import { useEffect } from "react";
import { sendGAEvent } from "@next/third-parties/google";

// Fires a GA4 event when a card detail page is viewed. Keyed on slug so it
// re-fires when navigating between card pages (same route segment).
export default function TrackCardView({
  cardName,
  cardSlug,
  provider,
}: {
  cardName: string;
  cardSlug: string;
  provider: string;
}) {
  useEffect(() => {
    sendGAEvent("event", "view_card_details", {
      card_name: cardName,
      card_slug: cardSlug,
      provider,
    });
  }, [cardName, cardSlug, provider]);

  return null;
}
