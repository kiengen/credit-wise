"use client";

import { useState, useMemo, useCallback } from "react";
import creditCards from "../data/credit-cards.json";

// --- Spending categories ---

export const spendingCategories = [
  { key: "dining", label: "Food & Dining", color: "bg-slate-300", description: "Restaurants, Bars, Delivery, Cafes" },
  { key: "groceries", label: "Groceries", color: "bg-amber-200", description: "Supermarkets, Farmers Markets" },
  { key: "gas", label: "Gas & Transit", color: "bg-purple-200", description: "Fuel, Public Transit, Rideshare" },
  { key: "travel", label: "Travel", color: "bg-rose-200", description: "Flights, Hotels, Car Rentals" },
  { key: "streaming", label: "Recurring", color: "bg-sky-200", description: "Subscriptions, Phone, Utilities" },
  { key: "shopping", label: "Online Shopping", color: "bg-lime-200", description: "Amazon, Retail, Electronics" },
  { key: "other", label: "Everything Else", color: "bg-orange-200", description: "Miscellaneous spending" },
] as const;

export type SpendingKey = (typeof spendingCategories)[number]["key"];
export type SpendingInput = Record<SpendingKey, { amount: number; period: "monthly" | "yearly" }>;

const defaultSpending: SpendingInput = {
  dining: { amount: 250, period: "monthly" },
  groceries: { amount: 350, period: "monthly" },
  gas: { amount: 150, period: "monthly" },
  travel: { amount: 200, period: "monthly" },
  streaming: { amount: 80, period: "monthly" },
  shopping: { amount: 200, period: "monthly" },
  other: { amount: 300, period: "monthly" },
};

const emptySpending: SpendingInput = {
  dining: { amount: 0, period: "monthly" },
  groceries: { amount: 0, period: "monthly" },
  gas: { amount: 0, period: "monthly" },
  travel: { amount: 0, period: "monthly" },
  streaming: { amount: 0, period: "monthly" },
  shopping: { amount: 0, period: "monthly" },
  other: { amount: 0, period: "monthly" },
};

// --- Airlines & alliances ---

export const airlines = [
  { key: "united", label: "United", alliance: "star-alliance" },
  { key: "air-canada", label: "Air Canada", alliance: "star-alliance" },
  { key: "lufthansa", label: "Lufthansa", alliance: "star-alliance" },
  { key: "ana", label: "ANA", alliance: "star-alliance" },
  { key: "singapore", label: "Singapore Airlines", alliance: "star-alliance" },
  { key: "delta", label: "Delta", alliance: "skyteam" },
  { key: "air-france", label: "Air France", alliance: "skyteam" },
  { key: "klm", label: "KLM", alliance: "skyteam" },
  { key: "korean-air", label: "Korean Air", alliance: "skyteam" },
  { key: "american", label: "American Airlines", alliance: "oneworld" },
  { key: "british-airways", label: "British Airways", alliance: "oneworld" },
  { key: "cathay-pacific", label: "Cathay Pacific", alliance: "oneworld" },
  { key: "qantas", label: "Qantas", alliance: "oneworld" },
] as const;

export const alliances = [
  { key: "star-alliance", label: "Star Alliance", logo: "/airlines/star-alliance-logo.png" },
  { key: "skyteam", label: "SkyTeam", logo: "/airlines/skyteam-logo.png" },
  { key: "oneworld", label: "Oneworld", logo: "/airlines/one-world-logo.png" },
] as const;

export type AirlineKey = (typeof airlines)[number]["key"];
export type AllianceKey = (typeof alliances)[number]["key"];

// --- Credit card type & parsing ---

export type CreditCard = (typeof creditCards)[number];

// --- Hook ---

export type SortBy = "bestValue" | "annualFee";

export function useFilters() {
  const [spending, setSpending] = useState<SpendingInput>(defaultSpending);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortBy>("bestValue");
  const [selectedAirlines, setSelectedAirlines] = useState<Set<AirlineKey>>(new Set());
  const [personalIncome, setPersonalIncome] = useState("unknown");
  const [householdIncome, setHouseholdIncome] = useState("unknown");
  const [creditScore, setCreditScore] = useState("good");

  const rewardsMap = useMemo(() => {
    const map: Record<string, number> = {};
    let totalAnnual = 0;
    for (const cat of spendingCategories) {
      const input = spending[cat.key];
      totalAnnual += (input.period === "monthly" ? input.amount * 12 : input.amount);
    }
    for (let i = 0; i < creditCards.length; i++) {
      const rate = [1, 1.5, 2, 1.25, 3, 1.5, 2][i % 7];
      map[creditCards[i].name] = totalAnnual * (rate / 100);
    }
    return map;
  }, [spending]);

  const toggleAirline = useCallback((key: AirlineKey) => {
    setSelectedAirlines((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
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

  const resetSpending = useCallback(() => setSpending(emptySpending), []);
  const useAverageSpending = useCallback(() => setSpending(defaultSpending), []);

  const filtered = useMemo(() => {
    let cards = [...creditCards];

    if (search.trim()) {
      const q = search.toLowerCase();
      cards = cards.filter(
        (c) => c.name.toLowerCase().includes(q) || c.provider.toLowerCase().includes(q)
      );
    }

    switch (sortBy) {
      case "bestValue":
        cards.sort((a, b) => (rewardsMap[b.name] ?? 0) - (rewardsMap[a.name] ?? 0));
        break;
      case "annualFee":
        break;
    }

    return cards;
  }, [rewardsMap, search, sortBy]);

  return {
    spending,
    handleSpendingChange,
    resetSpending,
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
    rewardsMap,
    filtered,
  };
}
