import React, { useEffect, useState } from "react";
import Image from "next/image";

type CoolingRange = {
  id: string;
  min: number | null; // inclusive
  max: number | null; // inclusive, null означает бесконечность
  days: number;
};

type Product = {
  id: string;
  title: string;
  price: number;
  category: string;
  addedAt: string;
  recommendedDays: number;
  excludedFromNotifications?: boolean;
};

type Profile = {
  monthlySavings: number; // сколько откладывает в месяц на комфортные покупки
  totalSavings: number; // текущие накопления
  salary: number; // необязательно, но мб. Зарплата
  notifyEveryDays: number;
  channels: string[]; //['email','telegram'] wtf idk
  bannedCategories: string[];
  considerSavings: boolean;
};

const DEFAULT_RANGES: CoolingRange[] = [
  { id: "r1", min: 0, max: 15000, days: 1 },
  { id: "r2", min: 15001, max: 50000, days: 7 },
  { id: "r3", min: 50001, max: 100000, days: 30 },
  { id: "r4", min: 100001, max: null, days: 90 },
];

const uid = (p = "") => ${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 9)}${p};

export default function Home() {
  const [profile, setProfile] = useState<Profile>(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("tbank_profile") : null;
    if (raw) return JSON.parse(raw) as Profile;
    return {
      monthlySavings: 5000,
      totalSavings: 80000,
      salary: 0,
      notifyEveryDays: 7,
      channels: ["in-app"],
      bannedCategories: [],
      considerSavings: true,
    };
  });

  const [ranges, setRanges] = useState<CoolingRange[]>(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("tbank_ranges") : null;
    if (raw) return JSON.parse(raw) as CoolingRange[];
    return DEFAULT_RANGES;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const raw = typeof window !== "undefined" ? localStorage.getItem("tbank_products") : null;
    if (raw) return JSON.parse(raw) as Product[];
    return [];
  });

    // Формы для товаров
  const [formTitle, setFormTitle] = useState("");
  const [formPrice, setFormPrice] = useState<number | "">("");
  const [formCategory, setFormCategory] = useState("");
  const [scanUrl, setScanUrl] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem("tbank_profile", JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem("tbank_ranges", JSON.stringify(ranges));
  }, [ranges]);

  useEffect(() => {
    localStorage.setItem("tbank_products", JSON.stringify(products));
  }, [products]);

  function computeCoolingByPrice(price: number) {
    // Нахождение хрени из прайса
    const r = ranges.find((rng) => {
      const minOK = rng.min === null ? true : price >= rng.min;
      const maxOK = rng.max === null ? true : price <= rng.max!;
      return minOK && maxOK;
    });
    return r ? r.days : 0;
  }

  function computeDaysConsideringSavings(price: number) {
    if (!profile.considerSavings) return 0;

    const needed = Math.max(0, price - profile.totalSavings);
    if (needed <= 0) return 0; 
  }

  const monthly = Math.max(1, profile.monthlySavings);
    const months = Math.ceil(needed / monthly);
    const days = months * 30;
    return days;
  }

  function recommendDays(price: number) {
    const base = computeCoolingByPrice(price);
    const savingsDays = computeDaysConsideringSavings(price);
    return Math.max(base, savingsDays);
  }
  
}