"use client";

import { useState, useEffect } from "react";
import { Plane } from "lucide-react";
import { spendingCategories, airlines } from "../hooks/useFilters";
import type { SpendingKey, AirlineKey } from "../hooks/useFilters";

export type Transaction = {
  date: string;
  description: string;
  amount: number;
  category: string;
};

const categoryKeys = spendingCategories.map((c) => c.key);
const categoryLabels: Record<string, string> = {};
for (const c of spendingCategories) categoryLabels[c.key] = c.label;

const TransactionModal = ({
  loading,
  progress,
  transactions: initial,
  detectedAirlines,
  onConfirm,
  onCancel,
}: {
  loading: boolean;
  progress: { done: number; total: number };
  transactions: Transaction[];
  detectedAirlines: AirlineKey[];
  onConfirm: (spending: Record<SpendingKey, number>) => void;
  onCancel: () => void;
}) => {
  const [transactions, setTransactions] = useState(initial);

  useEffect(() => {
    if (initial.length > 0) setTransactions(initial);
  }, [initial]);

  const updateCategory = (index: number, category: string) => {
    setTransactions((prev) =>
      prev.map((t, i) => (i === index ? { ...t, category } : t))
    );
  };

  const handleConfirm = () => {
    const totals: Record<string, number> = {};
    for (const key of categoryKeys) totals[key] = 0;
    for (const t of transactions) {
      const key = categoryKeys.includes(t.category as SpendingKey) ? t.category : "other";
      totals[key] += t.amount;
    }

    const dates = transactions.map((t) => new Date(t.date).getTime()).filter((d) => !isNaN(d));
    let months = 1;
    if (dates.length > 1) {
      const range = Math.max(...dates) - Math.min(...dates);
      months = Math.max(1, range / (1000 * 60 * 60 * 24 * 30));
    }

    const monthly: Record<SpendingKey, number> = {} as Record<SpendingKey, number>;
    for (const key of categoryKeys) {
      monthly[key as SpendingKey] = Math.round(totals[key] / months);
    }

    onConfirm(monthly);
  };

  const total = transactions.reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="w-full max-w-3xl rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-[var(--color-primary)]">Review Transactions</h2>
            <p className="text-xs text-[var(--color-muted)]">{transactions.length} transactions found; ${total.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} total</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onCancel} className="rounded-md border border-[var(--color-border)] px-4 py-2 text-xs font-semibold text-[var(--color-muted)] transition-colors hover:bg-[var(--color-surface)]">
              Cancel
            </button>
            <button onClick={handleConfirm} disabled={loading} className="rounded-md bg-[var(--color-primary)] px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-teal-800 disabled:opacity-50">
              Apply Spending
            </button>
          </div>
        </div>

        {detectedAirlines.length > 0 && (
          <div className="flex items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-2.5">
            <Plane className="h-3.5 w-3.5 text-[var(--color-primary)]" />
            <span className="text-xs text-[var(--color-muted)]">
              Frequent Airlines:{" "}
              <span className="font-semibold text-[var(--color-primary)]">
                {detectedAirlines.map((key) => airlines.find((a) => a.key === key)?.label ?? key).join(", ")}
              </span>
              . These will be auto-selected to accurately calculate your reward potential.
            </span>
          </div>
        )}

        <div className="max-h-[60vh] overflow-y-auto">
          {transactions.length > 0 && (
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-[var(--color-surface)]">
                <tr>
                  <th className="px-6 py-2 text-left text-xs font-semibold text-[var(--color-muted)]">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--color-muted)]">Description</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--color-muted)]">Amount</th>
                <th className="px-6 py-2 text-left text-xs font-semibold text-[var(--color-muted)]">Category</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {transactions.map((t, i) => (
                <tr key={i} className="hover:bg-[var(--color-surface)] transition-colors">
                  <td className="px-6 py-2.5 text-xs text-[var(--color-muted)] whitespace-nowrap">{t.date}</td>
                  <td className="px-3 py-2.5 text-sm text-[var(--color-primary)]">{t.description}</td>
                  <td className="px-3 py-2.5 text-sm font-semibold text-[var(--color-primary)] text-right whitespace-nowrap">
                    ${t.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-2.5">
                    <select
                      value={t.category}
                      onChange={(e) => updateCategory(i, e.target.value)}
                      className="rounded-md border border-[var(--color-border)] bg-white px-2 py-1 text-xs font-medium text-[var(--color-primary)] focus:border-[var(--color-accent)] focus:outline-none"
                    >
                      {spendingCategories.map((c) => (
                        <option key={c.key} value={c.key}>{c.label}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>)}
        </div>

        {loading && (
          <div className="border-t border-[var(--color-border)] px-6 py-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="flex items-center gap-2 text-xs font-semibold text-[var(--color-muted)]">
                {progress.done} of {progress.total} files processed
                <span className="h-3 w-3 animate-spin rounded-full border-2 border-[var(--color-border)] border-t-[var(--color-primary)]" />
              </span>
              <span className="text-xs text-[var(--color-muted)]">
                {Math.round((progress.done / progress.total) * 100)}%
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[var(--color-surface)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--color-primary)] transition-all duration-500 ease-out"
                style={{ width: `${(progress.done / progress.total) * 100}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TransactionModal;
