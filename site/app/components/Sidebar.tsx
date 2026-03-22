"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { usePlaidLink } from "react-plaid-link";
import AmountInput from "./AmountInput";
import ProfileRow from "./ProfileRow";
import { spendingCategories, airlines, alliances, networks, type useFilters, type SpendingKey } from "../hooks/useFilters";

type Filters = ReturnType<typeof useFilters>;

const Sidebar = ({ filters }: { filters: Filters }) => {
  const [viewAnnual, setViewAnnual] = useState(false);
  const [recurringExpanded, setRecurringExpanded] = useState(false);
  const [travelExpanded, setTravelExpanded] = useState(false);
  const [airlinesExpanded, setAirlinesExpanded] = useState(false);
  const [airlinesMounted, setAirlinesMounted] = useState(false);
  const [airlinesAnimateIn, setAirlinesAnimateIn] = useState(false);
  const [importMenuOpen, setImportMenuOpen] = useState(false);
  const [plaidToken, setPlaidToken] = useState<string | null>(null);
  const { spending } = filters;
  const fileRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const onPlaidSuccess = useCallback(
    (publicToken: string) => {
      filters.importFromPlaid(publicToken);
    },
    [filters.importFromPlaid]
  );

  const { open: openPlaid, ready: plaidReady } = usePlaidLink({
    token: plaidToken,
    onSuccess: onPlaidSuccess,
  });

  const handlePlaidClick = useCallback(async () => {
    setImportMenuOpen(false);
    const token = await filters.createPlaidLinkToken();
    setPlaidToken(token);
  }, [filters.createPlaidLinkToken]);

  useEffect(() => {
    if (plaidToken && plaidReady) {
      openPlaid();
      setPlaidToken(null);
    }
  }, [plaidToken, plaidReady, openPlaid]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setImportMenuOpen(false);
      }
    };
    if (importMenuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [importMenuOpen]);

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
    if ("sub" in cat && cat.sub) return sum;
    const input = spending[cat.key];
    return sum + (input.period === "monthly" ? input.amount : input.amount / 12);
  }, 0);
  const displayTotal = viewAnnual ? monthlyTotal * 12 : monthlyTotal;

  return (
    <aside className="w-84 shrink-0">

      {/* Spending Section */}
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
          {(() => {
            let currentParent: string | null = null;
            const parentSubs: Record<string, string[]> = {};

            // Build parent -> subs mapping
            for (const cat of spendingCategories) {
              const isSub = "sub" in cat && cat.sub === true;
              if (!isSub) {
                currentParent = cat.key;
              } else if (currentParent) {
                if (!parentSubs[currentParent]) parentSubs[currentParent] = [];
                parentSubs[currentParent].push(cat.key);
              }
            }

            const expandedParents: Record<string, boolean> = {
              recurring: recurringExpanded,
              travel: travelExpanded,
            };
            const toggleParent: Record<string, () => void> = {
              recurring: () => setRecurringExpanded(!recurringExpanded),
              travel: () => setTravelExpanded(!travelExpanded),
            };

            currentParent = null;

            return spendingCategories.map((cat) => {
              const isSub = "sub" in cat && cat.sub === true;

              if (!isSub) currentParent = cat.key;

              // Find this sub's parent
              let parentKey: string | null = null;
              if (isSub) {
                for (const [p, subs] of Object.entries(parentSubs)) {
                  if (subs.includes(cat.key)) { parentKey = p; break; }
                }
              }

              if (isSub && parentKey && !expandedParents[parentKey]) return null;

              const { amount, period } = spending[cat.key];
              const monthly = period === "monthly" ? amount : amount / 12;
              const pct = monthlyTotal > 0 ? Math.round((monthly / monthlyTotal) * 100) : 0;

              const hasSubcategories = !!parentSubs[cat.key];

              const getMonthly = (key: string) => {
                const s = spending[key as SpendingKey];
                return s.period === "monthly" ? s.amount : s.amount / 12;
              };

              return (
                <div
                  key={cat.key}
                  onClick={hasSubcategories ? toggleParent[cat.key] : undefined}
                  className={hasSubcategories ? "cursor-pointer" : ""}
                >
                  <AmountInput
                    label={cat.label}
                    value={Math.round((viewAnnual ? monthly * 12 : monthly) * 100) / 100}
                    onCommit={(val) => {
                      const monthlyVal = viewAnnual ? val / 12 : val;
                      filters.handleSpendingChange(cat.key, monthlyVal, "monthly");

                      // If sub exceeds parent, bump parent
                      if (isSub && parentKey) {
                        const parentMonthly = getMonthly(parentKey);
                        if (monthlyVal > parentMonthly) {
                          filters.handleSpendingChange(parentKey as SpendingKey, monthlyVal, "monthly");
                        }
                      }

                      // If parent lowered, scale subs proportionally
                      if (hasSubcategories) {
                        const oldParentMonthly = getMonthly(cat.key);
                        if (oldParentMonthly > 0) {
                          const ratio = monthlyVal / oldParentMonthly;
                          for (const subKey of parentSubs[cat.key]) {
                            const subMonthly = getMonthly(subKey);
                            filters.handleSpendingChange(
                              subKey as SpendingKey,
                              Math.round(subMonthly * ratio * 100) / 100,
                              "monthly"
                            );
                          }
                        }
                      }
                    }}
                    barColor={cat.color}
                    pct={pct}
                    sub={isSub}
                  />
                </div>
              );
            });
          })()}
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
              onClick={filters.useAverageSpending}
              className="flex-1 rounded-md cursor-pointer border border-[var(--color-border)] py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface)]"
            >
              Reset
            </button>
            <div className="relative flex-1" ref={menuRef}>
              <button
                onClick={() => !filters.importing && setImportMenuOpen(!importMenuOpen)}
                disabled={filters.importing}
                className="w-full rounded-md cursor-pointer border border-[var(--color-border)] py-1.5 text-xs font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface)] disabled:opacity-50"
              >
                {filters.importing ? "Importing..." : "Import ▾"}
              </button>
              {importMenuOpen && (
                <div className="absolute left-0 right-0 top-full mt-1 z-10 rounded-md border border-[var(--color-border)] bg-white shadow-lg overflow-hidden">
                  <button
                    onClick={() => { setImportMenuOpen(false); fileRef.current?.click(); }}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface)] cursor-pointer transition-colors"
                  >
                    Upload Statement
                  </button>
                  <button
                    onClick={handlePlaidClick}
                    className="w-full px-3 py-2 text-left text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-surface)] cursor-pointer transition-colors border-t border-[var(--color-border)]"
                  >
                    Connect Bank (Plaid)
                  </button>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => {
                const files = e.target.files;
                if (files && files.length > 0) filters.importStatement(Array.from(files));
                e.target.value = "";
              }}
            />
          </div>
        </div>
      </div>

      {/* Profile Section */}
      <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-white shadow-md divide-y divide-[var(--color-border)]">
        <ProfileRow type="creditScore" label="Credit Score" selected={filters.creditScore} onSelect={filters.setCreditScore} />
        <ProfileRow type="income" label="Personal Income" selected={filters.personalIncome} onSelect={filters.setPersonalIncome} />
        <ProfileRow type="income" label="Household Income" selected={filters.householdIncome} onSelect={filters.setHouseholdIncome} />
      </div>

      {/* Network Section */}
      <div className="mt-4 rounded-lg border border-[var(--color-border)] bg-white shadow-md overflow-hidden">
        <div className="border-b border-[var(--color-border)] px-5 py-3">
          <span className="text-sm font-bold text-[var(--color-primary)]">Card Network</span>
        </div>
        <div className="px-5 py-3 space-y-0.5">
          {networks.map((n) => (
            <label
              key={n.key}
              className="flex cursor-pointer items-center gap-2.5 rounded px-2 py-2 text-sm font-semibold text-[var(--color-primary)] transition-colors hover:bg-[var(--color-surface)]"
            >
              <input
                type="checkbox"
                checked={filters.selectedNetworks.has(n.key)}
                onChange={() => filters.toggleNetwork(n.key)}
                className="h-3.5 w-3.5 rounded"
              />
              <img src={n.logo} alt={n.label} className="h-5 w-5 object-contain" />
              {n.label}
            </label>
          ))}
        </div>
      </div>

      {/* Airlines Section */}

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
