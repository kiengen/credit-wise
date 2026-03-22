"use client";

import { useState, useMemo, useCallback } from "react";
import rawCards from "../data/capital-one.json";


export const spendingCategories = [
  { key: "dining", label: "Food", color: "bg-slate-300", description: "Restaurants, Bars, Delivery, Cafes" },
  { key: "grocery", label: "Grocery", color: "bg-amber-200", description: "Supermarkets, Farmers Markets" },
  { key: "recurring", label: "Recurring", color: "bg-sky-200", description: "Phone, Internet, Utilities" },
  { key: "streaming", label: "Streaming", color: "bg-sky-100", description: "Netflix, Spotify, etc.", sub: true },
  { key: "gas", label: "Gas", color: "bg-purple-200", description: "Fuel" },
  { key: "entertainment", label: "Entertainment", color: "bg-pink-200", description: "Movies, Concerts, Events" },
  { key: "foreign", label: "Foreign Purchases", color: "bg-indigo-200", description: "Non-domestic currency" },
  { key: "travel", label: "Travel", color: "bg-rose-200", description: "Flights, Hotels, Car Rentals" },
  { key: "pharmacy", label: "Pharmacy", color: "bg-emerald-200", description: "Drugstores, Prescriptions" },
  { key: "shopping", label: "Online Shopping", color: "bg-lime-200", description: "Amazon, Retail, Electronics" },
  { key: "other", label: "All Other Spending", color: "bg-orange-200", description: "Everything else" },
] as const;

export type SpendingKey = (typeof spendingCategories)[number]["key"];
export type SpendingInput = Record<SpendingKey, { amount: number; period: "monthly" | "yearly" }>;

const defaultSpending: SpendingInput = {
  dining: { amount: 250, period: "monthly" },
  grocery: { amount: 350, period: "monthly" },
  recurring: { amount: 50, period: "monthly" },
  streaming: { amount: 15, period: "monthly" },
  gas: { amount: 50, period: "monthly" },
  entertainment: { amount: 50, period: "monthly" },
  foreign: { amount: 0, period: "monthly" },
  travel: { amount: 100, period: "monthly" },
  pharmacy: { amount: 50, period: "monthly" },
  shopping: { amount: 0, period: "monthly" },
  other: { amount: 100, period: "monthly" },
};



export const airlines = [
  { key: "united", label: "United", alliance: "star-alliance" },
  { key: "air-canada", label: "Air Canada", alliance: "star-alliance" },
  { key: "lufthansa", label: "Lufthansa", alliance: "star-alliance" },
  { key: "ana", label: "ANA", alliance: "star-alliance" },
  { key: "singapore", label: "Singapore Airlines", alliance: "star-alliance" },
  { key: "avianca", label: "Avianca (LifeMiles)", alliance: "star-alliance" },
  { key: "turkish", label: "Turkish Airlines", alliance: "star-alliance" },
  { key: "delta", label: "Delta", alliance: "skyteam" },
  { key: "air-france", label: "Air France", alliance: "skyteam" },
  { key: "klm", label: "KLM", alliance: "skyteam" },
  { key: "korean-air", label: "Korean Air", alliance: "skyteam" },
  { key: "american", label: "American Airlines", alliance: "oneworld" },
  { key: "british-airways", label: "British Airways", alliance: "oneworld" },
  { key: "cathay-pacific", label: "Cathay Pacific", alliance: "oneworld" },
  { key: "qantas", label: "Qantas", alliance: "oneworld" },
  { key: "emirates", label: "Emirates", alliance: "none" },
] as const;

// Cents per point when transferred to each airline
const pointValuation: Record<string, number> = {
  "air-canada": 1.1,
  "air-france": 0.8,
  "klm": 0.8,
  "avianca": 1.6,
  "british-airways": 1.2,
  "emirates": 1.0,
  "singapore": 1.1,
  "turkish": 0.7,
};

export const alliances = [
  { key: "star-alliance", label: "Star Alliance", logo: "/airlines/star-alliance-logo.png" },
  { key: "skyteam", label: "SkyTeam", logo: "/airlines/skyteam-logo.png" },
  { key: "oneworld", label: "Oneworld", logo: "/airlines/one-world-logo.png" },
] as const;

export type AirlineKey = (typeof airlines)[number]["key"];
export type AllianceKey = (typeof alliances)[number]["key"];

export const networks = [
  { key: "visa", label: "Visa", logo: "/networks/visa-logo.png" },
  { key: "mastercard", label: "Mastercard", logo: "/networks/mastercard-logo.svg" },
  { key: "amex", label: "Amex", logo: "/networks/amex-logo.png" },
  { key: "discover", label: "Discover", logo: "/networks/discover-logo.png" },
] as const;


export type CreditCard = (typeof rawCards)[number];


export type SortBy = "bestValue" | "annualFee";

export function useFilters() {
  const [spending, setSpending] = useState<SpendingInput>(defaultSpending);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("bestValue");
  const [selectedAirlines, setSelectedAirlines] = useState<Set<AirlineKey>>(new Set());
  const [personalIncome, setPersonalIncome] = useState("unknown");
  const [householdIncome, setHouseholdIncome] = useState("unknown");
  const [creditScore, setCreditScore] = useState("unknown");
  const [selectedNetworks, setSelectedNetworks] = useState<Set<string>>(new Set());

  // Best cents-per-point based on selected airlines (0.5c default if none selected)
  const pointsInfo = useMemo(() => {
    if (selectedAirlines.size === 0) {
      return { centsPerPoint: 0.5, reason: "Statement credit" };
    }
    let best = 1;
    let bestKey = "";
    for (const key of selectedAirlines) {
      const val = pointValuation[key] ?? 1;
      if (val >= best) {
        best = val;
        bestKey = key;
      }
    }
    const label = airlines.find((a) => a.key === bestKey)?.label ?? bestKey;
    return { centsPerPoint: best, reason: `Transfer to ${label}` };
  }, [selectedAirlines]);

  const centsPerPoint = pointsInfo.centsPerPoint;

  const { rewardsMap, firstYearMap } = useMemo(() => {
    const rewards: Record<string, number> = {};
    const firstYear: Record<string, number> = {};

    for (const card of rawCards) {
      const cb = card.cash_back as Record<string, number>;
      const baseRate = cb.other ?? 0;
      const isPoints = (card as any).reward_type === "points";
      const multiplier = isPoints ? centsPerPoint : 1;
      let totalAnnualSpend = 0;
      let totalRewards = 0;

      for (const cat of spendingCategories) {
        const input = spending[cat.key];
        const annual = input.period === "monthly" ? input.amount * 12 : input.amount;
        totalAnnualSpend += annual;
        const rate = cb[cat.key] ?? baseRate;
        totalRewards += annual * rate * multiplier;
      }

      const bonuses = (card as any).bonus as { bonus: number; bonus_type: string; min_spend: number; is_welcome: boolean }[] | undefined;
      let perkValue = 0;
      let welcomeBonus = 0;
      const monthlySpend = totalAnnualSpend / 12;

      if (bonuses) {
        for (const b of bonuses) {
          const val = b.bonus_type === "points" ? b.bonus * (centsPerPoint / 100) : b.bonus;
          if (b.is_welcome && monthlySpend >= b.min_spend) {
            welcomeBonus += val;
          } else if (!b.is_welcome && val > 0) {
            perkValue += val;
          }
        }
      }

      const net = totalRewards + perkValue - card.annual_fee;
      rewards[card.name] = net;
      firstYear[card.name] = net + welcomeBonus;
    }

    return { rewardsMap: rewards, firstYearMap: firstYear };
  }, [spending, centsPerPoint]);

  const toggleAirline = useCallback((key: AirlineKey) => {
    setSelectedAirlines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const toggleNetwork = useCallback((network: string) => {
    setSelectedNetworks((prev) => {
      const next = new Set(prev);
      if (next.has(network)) next.delete(network);
      else next.add(network);
      return next;
    });
  }, []);

  const selectAlliance = useCallback((allianceKey: string) => {
    setSelectedAirlines((prev) => {
      const next = new Set(prev);
      const allianceAirlines = airlines.filter((a) => a.alliance === allianceKey);
      const allSelected = allianceAirlines.every((a) => prev.has(a.key));
      for (const a of allianceAirlines) {
        if (allSelected) next.delete(a.key);
        else next.add(a.key);
      }
      return next;
    });
  }, []);

  const handleSpendingChange = useCallback(
    (key: SpendingKey, amount: number, period: "monthly" | "yearly") => {
      setSpending((prev) => ({ ...prev, [key]: { amount, period } }));
    },
    []
  );


  const useAverageSpending = useCallback(() => setSpending(defaultSpending), []);
  const [importing, setImporting] = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [pendingTransactions, setPendingTransactions] = useState<
    { date: string; description: string; amount: number; category: string }[] | null
  >(null);
  const [detectedAirlines, setDetectedAirlines] = useState<AirlineKey[]>([]);

  const importStatement = useCallback(async (files: File[]) => {
    setImporting(true);
    setPendingTransactions([]);
    setDetectedAirlines([]);
    setImportProgress({ done: 0, total: files.length });

    let completed = 0;
    const allTransactions: { date: string; description: string; amount: number; category: string }[] = [];
    const allAirlines: AirlineKey[] = [];

    await Promise.all(
      files.map(async (file) => {
        const form = new FormData();
        form.append("file", file);
        const res = await fetch("/api/parse-statement", { method: "POST", body: form });
        const json = await res.json();
        allTransactions.push(...json.transactions);
        allAirlines.push(...(json.airlines ?? []));
        completed++;
        setImportProgress({ done: completed, total: files.length });
        setPendingTransactions(
          [...allTransactions].sort((a, b) => a.date.localeCompare(b.date))
        );
        setDetectedAirlines([...new Set(allAirlines)]);
      })
    );
    setImporting(false);
  }, []);

  const applyTransactionSpending = useCallback((monthly: Record<SpendingKey, number>) => {
    const next = {} as SpendingInput;
    for (const cat of spendingCategories) {
      next[cat.key] = { amount: monthly[cat.key] ?? 0, period: "monthly" };
    }
    setSpending(next);

    if (detectedAirlines.length > 0) {
      setSelectedAirlines(new Set(detectedAirlines));
    }

    setPendingTransactions(null);
    setDetectedAirlines([]);
  }, [detectedAirlines]);

  const cancelImport = useCallback(() => setPendingTransactions(null), []);


  const creditRank: Record<string, number> = {
    "rebuilding": 1,
    "poor": 1,
    "fair": 2,
    "good": 3,
    "good-excellent": 4,
    "very-good": 4,
    "excellent": 5,
  };

  const filtered = useMemo(() => {
    let cards = [...rawCards];

    if (search.trim()) {
      const q = search.toLowerCase();
      cards = cards.filter(
        (c) => c.name.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q)
      );
    }

    if (creditScore !== "unknown") {
      const userRank = creditRank[creditScore] ?? 5;
      cards = cards.filter((c) => (creditRank[c.credit] ?? 0) <= userRank);
    }

    if (selectedNetworks.size > 0) {
      cards = cards.filter((c) => selectedNetworks.has(c.network));
    }

    switch (sortBy) {
      case "bestValue":
        cards.sort((a, b) => (rewardsMap[b.name] ?? 0) - (rewardsMap[a.name] ?? 0));
        break;
      case "annualFee":
        cards.sort((a, b) => a.annual_fee - b.annual_fee);
        break;
    }

    return cards;
  }, [rewardsMap, search, sortBy, selectedNetworks, creditScore]);

  const monthlySpend = useMemo(() => {
    let total = 0;
    for (const cat of spendingCategories) {
      if ("sub" in cat && cat.sub) continue;
      const input = spending[cat.key];
      total += input.period === "monthly" ? input.amount : input.amount / 12;
    }
    return total;
  }, [spending]);

  return {
    spending,
    handleSpendingChange,
    monthlySpend,

    useAverageSpending,
    search,
    setSearch,
    sortBy,
    setSortBy,
    personalIncome,
    setPersonalIncome,
    householdIncome,
    setHouseholdIncome,
    creditScore,
    setCreditScore,
    selectedAirlines,
    toggleAirline,
    selectAlliance,
    selectedNetworks,
    toggleNetwork,
    importStatement,
    importing,
    importProgress,
    detectedAirlines,
    pendingTransactions,
    applyTransactionSpending,
    cancelImport,
    rewardsMap,
    firstYearMap,
    centsPerPoint,
    pointsReason: pointsInfo.reason,
    filtered,
  };
}
