"use client";

import { useState, useRef, useEffect } from "react";
import { Check, Info } from "lucide-react";
import TiltCard from "./TiltCard";
import { spendingCategories, type CreditCard, type SpendingInput } from "../hooks/useFilters";

const formatCashBackKey = (key: string) =>
  key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const CreditCardItem = ({
  card,
  estimatedReward,
  firstYearReward,
  monthlySpend,
  spending,
  centsPerPoint,
  pointsReason,
}: {
  card: CreditCard;
  estimatedReward: number;
  firstYearReward: number;
  monthlySpend: number;
  spending: SpendingInput;
  centsPerPoint: number;
  pointsReason: string;
}) => {
  if (!card.application_link) return null;

  const [showBreakdown, setShowBreakdown] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const breakdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showBreakdown) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(timer);
    }
  }, [showBreakdown]);

  useEffect(() => {
    if (!showBreakdown) return;
    const handleClick = (e: MouseEvent) => {
      if (breakdownRef.current && !breakdownRef.current.contains(e.target as Node)) {
        setShowBreakdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showBreakdown]);

  const cashBackEntries = Object.entries(card.cash_back);
  const otherRate = card.cash_back.other ?? 0;
  const bonusCategories = cashBackEntries.filter(([k]) => k !== "other");
  const isPoints = (card as any).reward_type === "points";
  const multiplier = isPoints ? centsPerPoint : 1;

  const welcomeBonus = firstYearReward - estimatedReward;
  const perkValue = (card.bonus as any[])
    .filter((b: any) => !b.is_welcome && b.bonus > 0)
    .reduce((sum: number, b: any) => {
      const val = b.bonus_type === "points" ? b.bonus * (centsPerPoint / 100) : b.bonus;
      return sum + val;
    }, 0);
  const cashBackRewards = estimatedReward + card.annual_fee - perkValue;

  return (
    <div className="rounded-lg bg-[var(--color-card)] shadow-md transition-all duration-200 hover:shadow-xl">
      <div className="flex gap-6 p-5">
        <div className="w-52 shrink-0">
          <TiltCard src={card.image} alt={card.name} details_link={card.details_link} />
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-bold text-[var(--color-primary)]">
                {card.name}
              </h3>
              <p className="text-sm text-[var(--color-muted)] capitalize">{card.provider.replace(/_/g, " ")}</p>
            </div>
            <div className="relative shrink-0 ml-4 flex gap-2" ref={breakdownRef}>
              {firstYearReward !== estimatedReward && (
                <div
                  className="rounded-lg bg-[var(--color-accent)]/10 px-3 py-1.5 whitespace-nowrap cursor-pointer transition-colors hover:bg-[var(--color-accent)]/20"
                  onClick={(e) => { e.preventDefault(); setShowBreakdown(!showBreakdown); }}
                >
                  <div className="flex items-center gap-1">
                    <p className="text-[0.625rem] text-[var(--color-muted)]">1st Year</p>
                    <Info className="h-2.5 w-2.5 text-[var(--color-muted)]" />
                  </div>
                  <p className="text-sm font-bold text-[var(--color-primary)]">${firstYearReward.toLocaleString("en-US", { maximumFractionDigits: 0 })}</p>
                </div>
              )}
              <div
                className="rounded-lg bg-[var(--color-surface)] px-3 py-1.5 whitespace-nowrap cursor-pointer transition-colors hover:bg-[var(--color-border)]"
                onClick={(e) => { e.preventDefault(); setShowBreakdown(!showBreakdown); }}
              >
                <div className="flex items-center gap-1">
                  <p className="text-[0.625rem] text-[var(--color-muted)]">Ongoing</p>
                  <Info className="h-2.5 w-2.5 text-[var(--color-muted)]" />
                </div>
                <p className="text-sm font-bold text-[var(--color-primary)]">${estimatedReward.toLocaleString("en-US", { maximumFractionDigits: 0 })}/yr</p>
              </div>

              {mounted && (
                <div className={`absolute right-0 top-full z-30 mt-2 w-72 rounded-lg border border-[var(--color-border)] bg-white p-4 shadow-xl transition-all duration-150 origin-top ${
                  animateIn ? "opacity-100 scale-y-100 translate-y-0" : "opacity-0 scale-y-95 -translate-y-1"
                }`}>
                  <div className="flex items-center justify-between text-xs text-[var(--color-primary)]">
                    <span>{isPoints ? "Points Value" : "Cash Back"}</span>
                    <span>${cashBackRewards.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                  </div>
                  {isPoints && (
                    <p className="text-[0.625rem] text-[var(--color-muted)]">
                      Valued at {centsPerPoint}¢/point ({pointsReason})
                    </p>
                  )}
                  <div className="space-y-0.5 mt-0.5">
                    {(() => {
                      const cb = card.cash_back as unknown as Record<string, number>;
                      const baseRate = cb.other ?? 0;
                      const choiceRate = cb.choice;
                      let bestChoiceKey: string | null = null;

                      if (choiceRate) {
                        let bestGain = 0;
                        for (const cat of spendingCategories) {
                          if ("sub" in cat && cat.sub) continue;
                          const input = spending[cat.key];
                          const annual = input.period === "monthly" ? input.amount * 12 : input.amount;
                          const currentRate = cb[cat.key] ?? baseRate;
                          if (choiceRate > currentRate) {
                            const gain = annual * (choiceRate - currentRate);
                            if (gain > bestGain) { bestGain = gain; bestChoiceKey = cat.key; }
                          }
                        }
                      }

                      let otherAnnual = 0;
                      let otherReward = 0;
                      const rows: { label: string; annual: number; rate: number; reward: number; isChoice?: boolean }[] = [];

                      for (const cat of spendingCategories) {
                        const input = spending[cat.key];
                        const annual = input.period === "monthly" ? input.amount * 12 : input.amount;
                        if (annual === 0) continue;
                        let rate = cb[cat.key] ?? baseRate;
                        const isChoice = bestChoiceKey === cat.key;
                        if (isChoice) rate = choiceRate!;
                        const reward = annual * rate * multiplier;
                        if ((cb[cat.key] !== undefined && cb[cat.key] !== baseRate) || isChoice) {
                          rows.push({ label: cat.label, annual, rate, reward, isChoice });
                        } else {
                          otherAnnual += annual;
                          otherReward += annual * baseRate * multiplier;
                        }
                      }

                      const rateLabel = (rate: number) =>
                        isPoints ? `${(rate * 100).toFixed(1)}x` : `${(rate * 100).toFixed(1)}%`;

                      return (
                        <>
                          {rows.map((r) => (
                            <div key={r.label} className="flex items-center justify-between text-[0.625rem] text-[var(--color-muted)]">
                              <span>
                                {r.label} (${r.annual.toLocaleString()} x {rateLabel(r.rate)})
                                {r.isChoice && <span className="ml-1 text-[var(--color-accent)]">★ Choice</span>}
                              </span>
                              <span>${r.reward.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                            </div>
                          ))}
                          {otherAnnual > 0 && (
                            <div className="flex items-center justify-between text-[0.625rem] text-[var(--color-muted)]">
                              <span>Other spending (${otherAnnual.toLocaleString()} x {rateLabel(baseRate)})</span>
                              <span>${otherReward.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>


                  {perkValue > 0 && (
                    <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-1.5 mt-1.5 text-xs text-[var(--color-primary)]">
                      <span>Card Perks</span>
                      <span>+ ${perkValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                    </div>
                  )}

                  {welcomeBonus > 0 && (
                    <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-1.5 mt-1.5 text-xs text-[var(--color-primary)]">
                      <div>
                        <span>Welcome Bonus</span>
                        <p className="text-[0.625rem] text-[var(--color-muted)]">First year only</p>
                      </div>
                      <span>+ ${welcomeBonus.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                    </div>
                  )}

                  {card.annual_fee > 0 && (
                    <div className="flex items-center justify-between border-t border-[var(--color-border)] pt-1.5 mt-1.5 text-xs text-[var(--color-primary)]">
                      <span>Annual Fee</span>
                      <span>&minus; ${card.annual_fee.toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                    </div>
                  )}

                  <div className="mt-2 border-t-2 border-[var(--color-primary)] pt-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-[var(--color-primary)]">
                      <span>{firstYearReward !== estimatedReward ? "First Year Value" : "Net Value"}</span>
                      <span>${(firstYearReward !== estimatedReward ? firstYearReward : estimatedReward).toLocaleString("en-US", { maximumFractionDigits: 0 })}</span>
                    </div>
                    {firstYearReward !== estimatedReward && (
                      <p className="text-right text-[0.625rem] text-[var(--color-muted)]">
                        ${estimatedReward.toLocaleString("en-US", { maximumFractionDigits: 0 })}/yr in years after
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
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
              <p className="text-xs text-[var(--color-muted)]">APR</p>
              <p className="text-base font-bold text-[var(--color-primary)]">
                {card.apr === 0 ? "N/A" : `${card.apr}%`}
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Base Cash Back</p>
              <p className="text-base font-bold text-[var(--color-primary)]">
                {(otherRate * 100)}%
              </p>
            </div>
            <div>
              <p className="text-xs text-[var(--color-muted)]">Credit Level</p>
              <p className="text-base font-bold text-[var(--color-primary)] capitalize">
                {card.credit}
              </p>
            </div>
            {!card.has_ftf && (
              <div>
                <p className="text-xs text-[var(--color-muted)]">Foreign Txn Fee</p>
                <p className="text-base font-bold text-green-700">None</p>
              </div>
            )}
          </div>

          {bonusCategories.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {bonusCategories.map(([key, rate]) => (
                <span
                  key={key}
                  className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-xs font-semibold text-[var(--color-primary)]"
                >
                  {((rate as number) * 100).toFixed(1)}% {formatCashBackKey(key)}
                </span>
              ))}
            </div>
          )}

          {card.bonus.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {card.bonus.map((item: any) => {
                const unmet = item.is_welcome && item.min_spend > 0 && monthlySpend < item.min_spend;
                return (
                  <span
                    key={item.description}
                    className={`flex items-center gap-1 text-xs ${
                      unmet ? "line-through" : ""
                    } ${item.is_welcome ? "text-[var(--color-accent)] font-semibold" : "text-[var(--color-muted)]"}`}
                    title={unmet ? `Failed to reach spending requirement ($${item.min_spend}/mo needed)` : undefined}
                  >
                    <Check className="h-3 w-3 shrink-0" />
                    {item.description}
                  </span>
                );
              })}
            </div>
          )}

          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
            {card.other.map((item: string) => (
              <span key={item} className="flex items-center gap-1 text-xs text-[var(--color-muted)]">
                <Check className="h-3 w-3 shrink-0 text-green-400" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </div>

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
