"use client";

import { useState, useEffect } from "react";
import AmountInput from "./AmountInput";
import ProfileRow from "./ProfileRow";
import { spendingCategories, airlines, alliances, type useFilters } from "../hooks/useFilters";

type Filters = ReturnType<typeof useFilters>;

const Sidebar = ({ filters }: { filters: Filters }) => {
  const [viewAnnual, setViewAnnual] = useState(false);
  const [airlinesExpanded, setAirlinesExpanded] = useState(false);
  const [airlinesMounted, setAirlinesMounted] = useState(false);
  const [airlinesAnimateIn, setAirlinesAnimateIn] = useState(false);
  const { spending } = filters;

  useEffect(() => {
    if (airlinesExpanded) {
      setAirlinesMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAirlinesAnimateIn(true));
      });
    } else {
      setAirlinesAnimateIn(false);
      const timer = setTimeout(() => setAirlinesMounted(false), 150);
      return () => clearTimeout(timer);
    }
  }, [airlinesExpanded]);

  const monthlyTotal = spendingCategories.reduce((sum, cat) => {
    const input = spending[cat.key];
    return sum + (input.period === "monthly" ? input.amount : input.amount / 12);
  }, 0);
  const displayTotal = viewAnnual ? monthlyTotal * 12 : monthlyTotal;

  return (
    <aside className="w-84 shrink-0">
      <div className="rounded-lg border border-[var(--color-border)] bg-white">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-5 py-3">
          <span className="text-sm font-bold text-[var(--color-primary)]">Spending</span>
          <div className="flex text-xs font-semibold">
            <button
              onClick={() => setViewAnnual(false)}
              className={`cursor-pointer px-1.5 ${!viewAnnual ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"}`}
            >
              Monthly
            </button>
            <span className="text-[var(--color-border)]">/</span>
            <button
              onClick={() => setViewAnnual(true)}
              className={`cursor-pointer px-1.5 ${viewAnnual ? "text-[var(--color-primary)]" : "text-[var(--color-muted)]"}`}
            >
              Annually
            </button>
          </div>
        </div>

        <div className="divide-y divide-[var(--color-border)]">
          {spendingCategories.map((cat) => {
            const { amount, period } = spending[cat.key];
            const monthly = period === "monthly" ? amount : amount / 12;
            const pct = monthlyTotal > 0 ? Math.round((monthly / monthlyTotal) * 100) : 0;

            return (
              <AmountInput
                key={cat.key}
                label={cat.label}
                value={Math.round((viewAnnual ? monthly * 12 : monthly) * 100) / 100}
                onCommit={(val) => {
                  const monthlyVal = viewAnnual ? val / 12 : val;
                  filters.handleSpendingChange(cat.key, monthlyVal, "monthly");
                }}
                barColor={cat.color}
                pct={pct}
              />
            );
          })}
        </div>

        <div className="border-t border-[var(--color-border)] px-5 py-3">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-bold text-[var(--color-primary)]">Total</span>
            <span className="text-lg font-bold text-[var(--color-primary)]">
              {displayTotal.toLocaleString("fr-CA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} $
              <span className="text-xs font-normal text-[var(--color-muted)]">
                {viewAnnual ? "/yr" : "/mo"}
              </span>
            </span>
          </div>
          <div className="flex gap-2">
            <button
              onClick={filters.resetSpending}
              className="flex-1 rounded-md border border-[var(--color-border)] py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface)]"
            >
              Reset
            </button>
            <button
              onClick={filters.useAverageSpending}
              className="flex-1 rounded-md border border-[var(--color-border)] py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface)]"
            >
              Use Average
            </button>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-white shadow-md divide-y divide-[var(--color-border)]">
        <ProfileRow type="creditScore" label="Credit Score" selected={filters.creditScore} onSelect={filters.setCreditScore} />
        <ProfileRow type="income" label="Personal Income" selected={filters.personalIncome} onSelect={filters.setPersonalIncome} />
        <ProfileRow type="income" label="Household Income" selected={filters.householdIncome} onSelect={filters.setHouseholdIncome} />
      </div>

      <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-white shadow-md overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-3">
          <span className="text-sm font-bold text-[var(--color-primary)]">Airlines</span>
        </div>
        <div className="px-5 py-3 space-y-0.5">
          {alliances.map((a) => {
            const allianceAirlines = airlines.filter((al) => al.alliance === a.key);
            const allSelected = allianceAirlines.every((al) => filters.selectedAirlines.has(al.key));
            const someSelected = allianceAirlines.some((al) => filters.selectedAirlines.has(al.key));
            return (
              <label
                key={a.key}
                className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-2 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface)]"
              >
                <input
                  type="checkbox"
                  checked={allSelected}
                  ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                  onChange={() => filters.selectAlliance(a.key)}
                  className="h-3.5 w-3.5 rounded"
                />
                <img src={a.logo} alt={a.label} className="h-5 w-5 object-contain" />
                {a.label}
              </label>
            );
          })}
        </div>

        <button
          onClick={() => setAirlinesExpanded(!airlinesExpanded)}
          className="w-full border-t border-[var(--color-border)] px-5 py-2 text-xs font-semibold text-[var(--color-muted)] hover:bg-[var(--color-surface)] transition-colors cursor-pointer"
        >
          {airlinesExpanded ? "Hide individual airlines" : "Show individual airlines"}
        </button>

        {airlinesMounted && (
          <div
            className={`border-t border-[var(--color-border)] px-5 py-3 space-y-0.5 transition-all duration-150 origin-top ${
              airlinesAnimateIn
                ? "opacity-100 scale-y-100"
                : "opacity-0 scale-y-95"
            }`}
          >
            {alliances.map((a) => {
              const allianceAirlines = airlines.filter((al) => al.alliance === a.key);
              return (
                <div key={a.key}>
                  <p className="px-2 pt-2 pb-1 text-xs font-bold text-[var(--color-muted)] uppercase tracking-wide">{a.label}</p>
                  {allianceAirlines.map((airline) => (
                    <label
                      key={airline.key}
                      className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-sm text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface)]"
                    >
                      <input
                        type="checkbox"
                        checked={filters.selectedAirlines.has(airline.key)}
                        onChange={() => filters.toggleAirline(airline.key)}
                        className="h-3.5 w-3.5 rounded border-gray-300"
                      />
                      {airline.label}
                    </label>
                  ))}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
