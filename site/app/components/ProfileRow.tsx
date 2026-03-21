"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

const creditScoreOptions = [
  { key: "unknown", label: "N/A" },
  { key: "excellent", label: "Excellent  760+" },
  { key: "very-good", label: "Very Good  725-759" },
  { key: "good", label: "Good  660-724" },
  { key: "fair", label: "Fair  560-659" },
  { key: "poor", label: "Poor  300-559" },
];

const creditScoreDisplay: Record<string, string> = {
  excellent: "Excellent",
  "very-good": "Very Good",
  good: "Good",
  fair: "Fair",
  poor: "Poor",
  unknown: "N/A",
};

const incomeOptions = [
  { key: "unknown", label: "N/A" },
  { key: "under-12k", label: "Less than $12,000" },
  { key: "12k-15k", label: "$12,000 - $14,999" },
  { key: "15k-60k", label: "$15,000 - $59,999" },
  { key: "60k-80k", label: "$60,000 - $79,999" },
  { key: "80k-100k", label: "$80,000 - $99,999" },
  { key: "100k-150k", label: "$100,000 - $149,999" },
  { key: "150k-200k", label: "$150,000 - $199,999" },
  { key: "200k-plus", label: "$200,000+" },
];

const getOptionsAndDisplay = (type: "creditScore" | "income") => {
  if (type === "creditScore") {
    return {
      options: creditScoreOptions,
      display: (key: string) => creditScoreDisplay[key] ?? "N/A",
    };
  }
  return {
    options: incomeOptions,
    display: (key: string) => incomeOptions.find((t) => t.key === key)?.label ?? "N/A",
  };
};

const ProfileRow = ({
  label,
  type,
  selected,
  onSelect,
}: {
  label: string;
  type: "creditScore" | "income";
  selected: string;
  onSelect: (key: string) => void;
}) => {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const { options, display } = getOptionsAndDisplay(type);

  useEffect(() => {
    if (open) {
      setMounted(true);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setAnimateIn(true));
      });
    } else {
      setAnimateIn(false);
      const timer = setTimeout(() => setMounted(false), 150);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen(!open)} className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-[var(--color-surface)] transition-colors">
        <span className="text-sm text-[var(--color-muted)]">{label}</span>
        <span className="flex items-center gap-1.5 text-sm font-semibold text-[var(--color-primary)]">
          {display(selected)}
          <ChevronDown className={`h-3.5 w-3.5 text-[var(--color-muted)] transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {mounted && (
        <div
          className={`absolute left-0 right-0 z-20 max-h-56 overflow-y-auto rounded-b-lg border border-[var(--color-border)] bg-white shadow-lg transition-all duration-150 origin-top ${
            animateIn
              ? "opacity-100 scale-y-100 translate-y-0"
              : "opacity-0 scale-y-95 -translate-y-1"
          }`}
        >
          {options.map((opt) => (
            <button
              key={opt.key}
              onClick={() => { onSelect(opt.key); setOpen(false); }}
              className={`w-full px-5 py-2 text-left text-sm transition-colors hover:bg-[var(--color-surface)] ${
                selected === opt.key ? "bg-[var(--color-surface)] font-bold text-[var(--color-primary)]" : "text-[var(--color-primary)]"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProfileRow;
