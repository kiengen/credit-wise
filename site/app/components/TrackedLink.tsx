"use client";

import { sendGAEvent } from "@next/third-parties/google";

// Outbound CTA link that fires a GA4 event on click. The link opens in a new
// tab, so the current page survives long enough for the event to send.
export default function TrackedLink({
  href,
  event,
  params,
  className,
  children,
}: {
  href: string;
  event: string;
  params?: Record<string, string | number | undefined>;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={() => sendGAEvent("event", event, params ?? {})}
    >
      {children}
    </a>
  );
}
