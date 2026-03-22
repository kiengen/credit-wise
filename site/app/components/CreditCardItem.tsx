"use client";

import { Check } from "lucide-react";
import TiltCard from "./TiltCard";
import type { CreditCard } from "../hooks/useFilters";

const CreditCardItem = ({
  card,
  estimatedReward,
}: {
  card: CreditCard;
  estimatedReward: number;
}) => {
  if (!card.application_link) return null;

  const content = (
    <div className="flex gap-6 p-5">
      <div className="w-52 shrink-0">
        <TiltCard src={card.image} alt={card.name} />
      </div>

      <div className="flex flex-1 flex-col">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-[var(--color-primary)]">
              {card.name}
            </h3>
            <p className="text-sm text-[var(--color-muted)] capitalize">{card.provider.replace(/_/g, " ")}</p>
          </div>
          <div className="rounded-full bg-[var(--color-surface)] px-4 py-1.5">
            <span className="text-xs text-[var(--color-muted)]">Est. Rewards: </span>
            <span className="text-sm font-bold text-[var(--color-primary)]">
              ${estimatedReward.toLocaleString("en-US", { maximumFractionDigits: 0 })}
              <span className="text-xs font-normal text-[var(--color-muted)]">/yr</span>
            </span>
          </div>
        </div>

        <div className="mt-4 flex gap-8">
          <div>
            <p className="text-xs text-[var(--color-muted)]">Annual Fee</p>
            <p className="text-base font-bold text-[var(--color-primary)]">
              {card.annual_fee === 0 ? (
                <span className="text-green-700">$0</span>
              ) : (
                `$${card.annual_fee}`
              )}
            </p>
          </div>
          <div>
            <p className="text-xs text-[var(--color-muted)]">Credit Level</p>
            <p className="text-base font-bold text-[var(--color-primary)] capitalize">
              {card.credit.replace(/-/g, " ")}
            </p>
          </div>
          {!card.has_ftf && (
            <div>
              <p className="text-xs text-[var(--color-muted)]">Foreign Transaction Fee</p>
              <p className="text-base font-bold text-green-700">None</p>
            </div>
          )}
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
          {card.other.map((item: string) => (
            <span key={item} className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
              <Check className="h-3 w-3 shrink-0 text-green-400" />
              {item}
            </span>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="rounded-lg bg-[var(--color-card)] shadow-md transition-all duration-200 hover:shadow-xl">
      {card.details_link ? (
        <a href={card.details_link} target="_blank" rel="noopener noreferrer" className="block cursor-pointer">
          {content}
        </a>
      ) : (
        content
      )}

      <div className="flex items-center gap-3 border-t border-[var(--color-border)] px-5 py-3">
        {card.application_link && (
          <a
            href={card.application_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-md bg-[var(--color-primary)] py-2.5 text-center text-xs font-semibold tracking-wide text-white uppercase transition-colors hover:bg-teal-800"
          >
            Apply Now
          </a>
        )}
        {card.preapproval_link && (
          <a
            href={card.preapproval_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-md border border-[var(--color-border)] py-2.5 text-center text-xs font-semibold tracking-wide text-[var(--color-primary)] uppercase transition-colors hover:bg-[var(--color-surface)]"
          >
            Check Pre-Approval
          </a>
        )}
        {card.details_link && (
          <a
            href={card.details_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 rounded-md border border-[var(--color-border)] py-2.5 text-center text-xs font-semibold tracking-wide text-[var(--color-primary)] uppercase transition-colors hover:bg-[var(--color-surface)]"
          >
            More Details
          </a>
        )}
      </div>
    </div>
  );
};

export default CreditCardItem;
