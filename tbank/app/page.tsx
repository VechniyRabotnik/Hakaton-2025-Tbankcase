"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

type Wish = {
  id: string;
  title: string;
  price: number;
  category: string;
  coolingDays: number;
  recommendedCooling: number;
  stillWant: boolean;
  createdAt?: string;
};

type CooldownRange = {
  min: number;
  max: number;
  period: number; // days
};

type Settings = {
  cooldowns: CooldownRange[];
  notificationFrequency?: string;
  excludedProducts?: string;
  notificationChannel?: string;
  totalSpent?: number;
  totalPurchases?: number;
};

const WISHES_API = "http://localhost:8080/api/wishes";
const SETTINGS_API = "http://localhost:8080/api/settings";

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [savings, setSavings] = useState<number | "">("");
  const [perMonth, setPerMonth] = useState<number | "">("");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const pathname = usePathname();

  const userId = "testmeowmeowmeow";

  // nastr
  async function fetchSettings() {
    try {
      const res = await fetch(`${SETTINGS_API}/${userId}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    setSettings(data);
    setSavings(data.totalSpent || "");
    setPerMonth(data.monthlySaving || "");
    } catch (err: any) {
      console.error("Ошибка загрузки настроек:", err.message);
    }
  }

  // wishes
  async function fetchWishes() {
    try {
      setLoading(true);
      const res = await fetch(`${WISHES_API}/${userId}`);
      if (!res.ok) throw new Error(await res.text());
      const data: Wish[] = await res.json();
      setWishes(data);
    } catch (err) {
      console.error("Ошибка получения желаний:", err);
      setWishes([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchSettings();
    fetchWishes();
  }, []);

  async function addWish() {
    if (!title || price === "" || Number(price) <= 0) {
      alert("Введите корректные название и цену");
      return;
    }

    const payload: any = {
      title,
      price: Number(price),
      category,
    };

    if (savings !== "") payload.savings = Number(savings);
    if (perMonth !== "") payload.perMonth = Number(perMonth);

    try {
      const res = await fetch(`${WISHES_API}/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || `status ${res.status}`);
      }
      
      await fetchWishes();

      // очистка
      setTitle("");
      setPrice("");
      setCategory("");
      //setSavings("");
      //setPerMonth("");
    } catch (err: any) {
      console.error("Ошибка добавления:", err);
      alert("Не удалось добавить желание: " + (err.message || err));
    }
  }

  async function toggleStillWant(id: string) {
    try {
      const res = await fetch(`${WISHES_API}/${userId}/${id}`, { method: "PUT" });
      if (!res.ok) throw new Error(await res.text());
      fetchWishes();
    } catch (err) {
      console.error("Ошибка toggleStillWant:", err);
    }
  }

  async function removeWish(id: string) {
    if (!confirm("Удалить желание?")) return;
    try {
      const res = await fetch(`${WISHES_API}/${userId}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      fetchWishes();
    } catch (err) {
      console.error("Ошибка удаления:", err);
    }
  }

  // ui
  function getCooldownHint(price: number) {
    if (!settings || !settings.cooldowns || settings.cooldowns.length === 0) return null;
    const r = settings.cooldowns.find((c) => price >= c.min && price <= c.max);
    return r ? `${r.period} дн (правило ${r.min}—${r.max} ₽)` : null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-yellow-100 p-6">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-start justify-between mb-8 gap-4">
          <h1 className="text-4xl font-extrabold text-yellow-300">T-Желания — помощник против импульсивных покупок</h1>
          <div className="flex gap-3">
            <button
              onClick={() => router.push("/settings")}
              className={`px-4 py-2 bg-gray-800 text-yellow-300 rounded ${pathname === "/settings" ? "ring-2 ring-yellow-400" : "hover:bg-gray-700"}`}
            >
              Настройки
            </button>
          </div>
        </header>

        <section className="mb-8 bg-gray-800 p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input
              placeholder="Название"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-3 rounded border border-yellow-600 bg-gray-900 text-yellow-100"
            />
            <input
              placeholder="Цена"
              type="number"
              value={price}
              onChange={(e) => {
                const v = e.target.value;
                setPrice(v === "" ? "" : Number(v));
              }}
              className="p-3 rounded border border-yellow-600 bg-gray-900 text-yellow-100"
            />
            <input
              placeholder="Категория"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-3 rounded border border-yellow-600 bg-gray-900 text-yellow-100"
            />

            <input
              placeholder="Накопления (необязательно)"
              type="number"
              value={savings}
              onChange={(e) => {
                const v = e.target.value;
                setSavings(v === "" ? "" : Number(v));
              }}
              className="p-3 rounded border border-yellow-600 bg-gray-900 text-yellow-100"
            />
            <input
              placeholder="Откладываю в месяц (необязательно)"
              type="number"
              value={perMonth}
              onChange={(e) => {
                const v = e.target.value;
                setPerMonth(v === "" ? "" : Number(v));
              }}
              className="p-3 rounded border border-yellow-600 bg-gray-900 text-yellow-100"
            />

            <button
              onClick={addWish}
              className="col-span-1 md:col-span-3 bg-yellow-500 text-black font-semibold py-3 rounded hover:bg-yellow-600"
            >
              Добавить желание
            </button>
          </div>

          {settings && settings.cooldowns && settings.cooldowns.length > 0 && (
            <div className="mt-3 text-sm text-yellow-300">
              Правила охлаждения:{" "}
              {settings.cooldowns.map((c, i) => (
                <span key={i} className="mr-3">
                  {c.min}—{c.max} ₽ → {c.period} дн
                </span>
              ))}
            </div>
          )}
        </section>

        <section>
          {loading ? (
            <p>Загрузка...</p>
          ) : !wishes || wishes.length === 0 ? (
            <p className="text-yellow-300">У вас пока нет желаний — добавьте первое.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wishes.map((w) => (
                <div key={w.id} className="bg-gray-800 p-4 rounded-lg border border-yellow-700 shadow">
                  <div className="flex justify-between items-start">
                    <h2 className="text-xl font-semibold">{w.title}</h2>
                    <div className="text-sm text-yellow-300">{new Date(w.createdAt || "").toLocaleString()}</div>
                  </div>

                  <p className="mt-2">Цена: {w.price} ₽</p>
                  <p>Категория: {w.category}</p>
                  <p>Базовое охлаждение: {w.coolingDays} дн {getCooldownHint(w.price) && <span className="text-sm text-yellow-300">· {getCooldownHint(w.price)}</span>}</p>
                  <p className="font-medium">Рекомендуется ждать: {w.recommendedCooling} дн</p>
                  <p>Статус: {w.stillWant ? "Хочу" : "Не хочу"}</p>

                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => toggleStillWant(w.id)}
                      className="px-3 py-1 rounded border border-yellow-300 bg-black text-yellow-300 hover:bg-yellow-300 hover:text-black"
                    >
                      Переключить
                    </button>
                    <button
                      onClick={() => removeWish(w.id)}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
