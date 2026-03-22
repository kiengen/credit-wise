"use client";

import { useState, useMemo, useCallback } from "react";
import capitalOneCards from "../data/capital-one.json";
import boaCards from "../data/bank-of-america.json";
import amexCards from "../data/american-express.json";
import citiCards from "../data/citigroup.json";

const rawCards = [...capitalOneCards, ...boaCards, ...amexCards, ...citiCards];


export const spendingCategories = [
  { key: "dining", label: "Food", color: "bg-slate-300", description: "Restaurants, Bars, Delivery, Cafes" },
  { key: "grocery", label: "Grocery", color: "bg-amber-200", description: "Supermarkets, Farmers Markets" },
  { key: "recurring", label: "Recurring", color: "bg-sky-200", description: "Phone, Internet, Utilities" },
  { key: "streaming", label: "Streaming", color: "bg-sky-100", description: "Netflix, Spotify, etc.", sub: true },
  { key: "gas", label: "Gas", color: "bg-purple-200", description: "Fuel" },
  { key: "entertainment", label: "Entertainment", color: "bg-pink-200", description: "Movies, Concerts, Events" },
  { key: "foreign", label: "Foreign Purchases", color: "bg-indigo-200", description: "Non-domestic currency" },
  { key: "travel", label: "Travel", color: "bg-rose-200", description: "General travel" },
  { key: "flights", label: "Flights", color: "bg-rose-100", description: "Airfare", sub: true },
  { key: "hotels", label: "Hotels", color: "bg-rose-100", description: "Accommodation", sub: true },
  { key: "rental_cars", label: "Rental Cars", color: "bg-rose-100", description: "Car rentals", sub: true },
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
  flights: { amount: 50, period: "monthly" },
  hotels: { amount: 30, period: "monthly" },
  rental_cars: { amount: 20, period: "monthly" },
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
  { key: "jetblue", label: "JetBlue", alliance: "none" },
  { key: "emirates", label: "Emirates", alliance: "none" },
  { key: "virgin-atlantic", label: "Virgin Atlantic", alliance: "none" },
] as const;

const transferPartners: Record<string, Record<string, number>> = {
  capital_one: {
    "air-canada": 1.1,
    "air-france": 0.8,
    "klm": 0.8,
    "avianca": 1.6,
    "british-airways": 1.2,
    "emirates": 1.0,
    "singapore": 1.1,
    "turkish": 0.7,
  },
  american_express: {
    "air-canada": 1.1,
    "british-airways": 1.2,
    "delta": 1.2,
    "emirates": 1.0,
    "air-france": 0.8,
    "klm": 0.8,
    "jetblue": 0.96,
    "virgin-atlantic": 1.4,
  },
  citi: {
    "air-france": 0.8,
    "klm": 0.8,
    "singapore": 1.1,
    "turkish": 0.7,
    "emirates": 1.0,
    "virgin-atlantic": 1.4,
    "jetblue": 1.2,
    "qantas": 1.0,
    "cathay-pacific": 1.0,
  },
};

const fixedPointValue: Record<string, { value: number; reason: string; requiresAirline?: string }> = {
  bank_of_america: { value: 1.0, reason: "Travel redemption" },
  delta: { value: 1.2, reason: "Delta SkyMiles", requiresAirline: "delta" },
  hilton: { value: 0.5, reason: "Hilton Honors" },
  marriott: { value: 0.7, reason: "Marriott Bonvoy" },
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


export type SortBy = "bestValue" | "bestFirstYear" | "annualFee" | "lowestInterest";

export function useFilters() {
  const [spending, setSpending] = useState<SpendingInput>(defaultSpending);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("bestValue");
  const [selectedAirlines, setSelectedAirlines] = useState<Set<AirlineKey>>(new Set());
  const [personalIncome, setPersonalIncome] = useState("unknown");
  const [householdIncome, setHouseholdIncome] = useState("unknown");
  const [creditScore, setCreditScore] = useState("unknown");
  const [selectedNetworks, setSelectedNetworks] = useState<Set<string>>(new Set());

  const pointValueMap = useMemo(() => {
    const map: Record<string, { centsPerPoint: number; reason: string }> = {};

    for (const [provider, info] of Object.entries(fixedPointValue)) {
      if (info.requiresAirline && !selectedAirlines.has(info.requiresAirline as AirlineKey)) {
        map[provider] = { centsPerPoint: 0, reason: `Select ${info.reason} to value` };
      } else {
        map[provider] = { centsPerPoint: info.value, reason: info.reason };
      }
    }

    for (const [provider, partners] of Object.entries(transferPartners)) {
      if (selectedAirlines.size === 0) {
        map[provider] = { centsPerPoint: 0.5, reason: "Statement credit" };
        continue;
      }
      let best = 0;
      let bestKey = "";
      for (const key of selectedAirlines) {
        const val = partners[key];
        if (val !== undefined && val > best) {
          best = val;
          bestKey = key;
        }
      }
      if (best > 0) {
        const label = airlines.find((a) => a.key === bestKey)?.label ?? bestKey;
        map[provider] = { centsPerPoint: best, reason: `Transfer to ${label}` };
      } else {
        map[provider] = { centsPerPoint: 0.5, reason: "Statement credit" };
      }
    }

    return map;
  }, [selectedAirlines]);

  const getPointValue = (provider: string) =>
    pointValueMap[provider] ?? { centsPerPoint: 1, reason: "Statement credit" };

  const { rewardsMap, firstYearMap } = useMemo(() => {
    const rewards: Record<string, number> = {};
    const firstYear: Record<string, number> = {};

    for (const card of rawCards) {
      const cb = card.cash_back as unknown as Record<string, number>;
      const baseRate = cb.other ?? 0;
      const isPoints = (card as any).reward_type === "points";
      const { centsPerPoint } = getPointValue(card.provider);
      const multiplier = isPoints ? centsPerPoint : 1;
      let totalAnnualSpend = 0;
      let totalRewards = 0;

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
            if (gain > bestGain) {
              bestGain = gain;
              bestChoiceKey = cat.key;
            }
          }
        }
      }

      for (const cat of spendingCategories) {
        const input = spending[cat.key];
        const annual = input.period === "monthly" ? input.amount * 12 : input.amount;
        totalAnnualSpend += annual;
        let rate = cb[cat.key] ?? baseRate;
        if (bestChoiceKey && cat.key === bestChoiceKey) rate = choiceRate!;
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

      const fyCb = (card as any).first_year_cash_back as Record<string, number> | undefined;
      let firstYearRewards = totalRewards;
      if (fyCb) {
        const fyBaseRate = fyCb.other ?? baseRate;
        firstYearRewards = 0;
        for (const cat of spendingCategories) {
          const input = spending[cat.key];
          const annual = input.period === "monthly" ? input.amount * 12 : input.amount;
          let rate = fyCb[cat.key] ?? cb[cat.key] ?? fyBaseRate;
          if (bestChoiceKey && cat.key === bestChoiceKey) rate = Math.max(rate, choiceRate!);
          firstYearRewards += annual * rate * multiplier;
        }
      }
      firstYear[card.name] = firstYearRewards + perkValue - card.annual_fee + welcomeBonus;
    }

    return { rewardsMap: rewards, firstYearMap: firstYear };
  }, [spending, pointValueMap]);

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

  const createPlaidLinkToken = useCallback(async (): Promise<string> => {
    const res = await fetch("/api/plaid/create-link-token", { method: "POST" });
    const json = await res.json();
    return json.link_token;
  }, []);

  const importFromPlaid = useCallback(async (publicToken: string) => {
    setImporting(true);
    setPendingTransactions([]);
    setDetectedAirlines([]);
    setImportProgress({ done: 0, total: 1 });

    const res = await fetch("/api/plaid/exchange-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ public_token: publicToken }),
    });
    const json = await res.json();

    setPendingTransactions(json.transactions);
    setDetectedAirlines(json.airlines ?? []);
    setImportProgress({ done: 1, total: 1 });
    setImporting(false);
  }, []);

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
      case "bestFirstYear":
        cards.sort((a, b) => (firstYearMap[b.name] ?? 0) - (firstYearMap[a.name] ?? 0));
        break;
      case "annualFee":
        cards.sort((a, b) => a.annual_fee - b.annual_fee);
        break;
      case "lowestInterest":
        cards.sort((a, b) => (a.apr || 999) - (b.apr || 999));
        break;
    }

    return cards;
  }, [rewardsMap, firstYearMap, search, sortBy, selectedNetworks, creditScore]);

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
    createPlaidLinkToken,
    importFromPlaid,
    rewardsMap,
    firstYearMap,
    pointValueMap,
    filtered,
  };
}
