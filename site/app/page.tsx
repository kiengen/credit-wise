"use client";

import { Search } from "lucide-react";
import { useFilters } from "./hooks/useFilters";
import CreditCardItem from "./components/CreditCardItem";
import Sidebar from "./components/Sidebar";
import TransactionModal from "./components/TransactionModal";

const ComparePage = () => {
  const filters = useFilters();

  return (
    <div className="min-h-screen mx-auto bg-[var(--color-bg)]">
      <header className="w-screen bg-white border-b border-[var(--color-border)]">
        <div className="max-w-7xl mx-auto px-12 py-8">
          <h1 className="text-6xl font-bold italic font-[family-name:var(--font-logo)] text-[var(--color-primary)]">
            <span>Credit</span>
            <span className="-ml-3.5">Wise</span>
          </h1>
          <p className="mt-1 text-sm text-[var(--color-muted)]">
            Find the best credit card for your spending habits. Compare rewards,
            fees, and benefits side by side.
          </p>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-12 py-6">
        <div className="flex flex-row gap-6">
          <Sidebar filters={filters} />

          <div className="flex-1">
            <div className="mb-5 flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--color-muted)]" />
                <input
                  type="text"
                  placeholder="Search credit cards..."
                  value={filters.search}
                  onChange={(e) => filters.setSearch(e.target.value)}
                  className="h-10 w-full rounded-lg border border-[var(--color-border)] bg-white pl-10 pr-4 text-sm text-[var(--color-primary)] placeholder:text-[var(--color-muted)] focus:border-[var(--color-accent)] focus:outline-none"
                />
              </div>
              <select
                value={filters.sortBy}
                onChange={(e) => filters.setSortBy(e.target.value as typeof filters.sortBy)}
                className="h-10 rounded-lg border border-[var(--color-border)] bg-white px-3 text-sm font-medium text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
              >
                <option value="bestValue">Best Ongoing Value</option>
                <option value="bestFirstYear">Best First Year Value</option>
                <option value="annualFee">Lowest Annual Fee</option>
                <option value="lowestInterest">Lowest Interest Rate</option>
              </select>
            </div>

            {filters.filtered.length === 0 ? (
              <p className="py-16 text-center text-sm text-[var(--color-muted)]">
                No cards match your search.
              </p>
            ) : (
              <div className="flex flex-col gap-5">
                {filters.filtered.map((card) => (
                  <CreditCardItem
                    key={card.name}
                    card={card}
                    estimatedReward={filters.rewardsMap[card.name]}
                    firstYearReward={filters.firstYearMap[card.name]}
                    monthlySpend={filters.monthlySpend}
                    spending={filters.spending}
                    pointValueMap={filters.pointValueMap}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      {(filters.importing || filters.pendingTransactions) && (
        <TransactionModal
          loading={filters.importing}
          progress={filters.importProgress}
          transactions={filters.pendingTransactions ?? []}
          detectedAirlines={filters.detectedAirlines}
          onConfirm={filters.applyTransactionSpending}
          onCancel={filters.cancelImport}
        />
      )}
    </div>
  );
};

export default ComparePage;
