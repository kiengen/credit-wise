"use client";

import { useState, useEffect } from "react";

const AmountInput = ({
  label,
  value,
  onCommit,
  barColor,
  pct,
  sub,
}: {
  label: string;
  value: number;
  onCommit: (val: number) => void;
  barColor: string;
  pct: number;
  sub?: boolean;
}) => {
  const [draft, setDraft] = useState(value.toFixed(2));

  useEffect(() => {
    setDraft(value.toFixed(2));
  }, [value]);

  return (
    <div className={sub ? "px-5 pb-2 pt-0 pl-9" : "px-5 py-3"}>
      <div className="flex items-center justify-between">
        <span className={`font-semibold text-[var(--color-primary)] ${sub ? "text-xs text-[var(--color-muted)]" : "text-sm"}`}>
          {label}
        </span>
        <div className="flex items-center gap-0.5 rounded-sm border-2 border-transparent bg-transparent px-3 pr-0 py-1 transition-colors duration-200 hover:border-[var(--color-border)] focus-within:border-[var(--color-border)]">
          <input
            type="text"
            inputMode="decimal"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={() => {
              const parsed = Math.max(0, Number(draft) || 0);
              setDraft(parsed.toFixed(2));
              onCommit(parsed);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="w-20 bg-transparent text-right text-sm font-bold text-[var(--color-primary)] focus:outline-none"
          />
          <span className="text-sm font-bold text-[var(--color-primary)]">$</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div
          className={`h-2.5 rounded-sm transition-all duration-800 ease-out ${barColor}`}
          style={{ width: `${Math.max(pct, 3)}%` }}
        />
        <span className="text-xs text-[var(--color-muted)]">{pct}%</span>
      </div>
    </div>
  );
};

export default AmountInput;
