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
  status: string;
};

type CooldownRange = {
  min: number;
  max: number;
  period: number;
};

type Settings = {
  cooldowns: CooldownRange[];
  notificationFrequency?: string;
  excludedProducts?: string;
  notificationChannel?: string;
  totalSpent?: number;
  totalPurchases?: number;
};

type Profile = {
  nick: string;
  salary: number;
  totalSavingsProfile: number;
  monthlySavingProfile: number;
  blockedCategories: string[];
};

const WISHES_API = "http://localhost:8080/api/wishes";
const SETTINGS_API = "http://localhost:8080/api/settings";
const PROFILE_API = "http://localhost:8080/api/profile";

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [totalSpent, setTotalSpent] = useState<number | "">("");
  const [monthlySaving, setMonthlySaving] = useState<number | "">("");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [status, setStatus] = useState("");
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);

  const router = useRouter();
  const pathname = usePathname();

  const userId = "testmeowmeow";

  async function fetchSettings() {
    try {
      const res = await fetch(`${SETTINGS_API}/${userId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setSettings(data);
      setTotalSpent(data.totalSpent || "");
      setMonthlySaving(data.monthlySaving || "");
    } catch (err: any) {
      console.error("Ошибка загрузки настроек:", err.message);
    }
  }

  async function fetchProfile() {
    try {
      const res = await fetch(`http://localhost:8080/api/user/${userId}`);
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();

      setProfile({
        nick: data.nick,
        salary: data.salary || 0,
        totalSavingsProfile: data.totalSavingsProfile || 0,
        monthlySavingProfile: data.monthlySavingProfile || 0,
        blockedCategories: (data.blockedCategories || []).map((c: string) =>
          c.toLowerCase()
        ),
      });
    } catch (err) {
      console.error("Ошибка загрузки профиля:", err);
    }
  }

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
    fetchProfile();
  }, []);

  async function addWish() {
    if (!title || price === "" || Number(price) <= 0) {
      alert("Введите корректные название и цену");
      return;
    }

    const blocked = profile?.blockedCategories || [];

    if (blocked.includes(category.trim().toLowerCase())) {
      alert("Эта категория запрещена в вашем профиле.");
      return;
    }

    const payload: any = {
      title,
      price: Number(price),
      category,
    };

    if (totalSpent !== "") payload.totalSpent = Number(totalSpent);
    if (monthlySaving !== "") payload.monthlySaving = Number(monthlySaving);

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
      setTitle("");
      setPrice("");
      setCategory("");
    } catch (err: any) {
      console.error("Ошибка добавления:", err);
      alert("Не удалось добавить желание: " + (err.message || err));
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

  function getCooldownHint(price: number) {
    if (!settings || !settings.cooldowns || settings.cooldowns.length === 0) return null;
    const r = settings.cooldowns.find((c) => price >= c.min && price <= c.max);
    return r ? `${r.period} дн (правило ${r.min}—${r.max} ₽)` : null;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-yellow-100 font-sans transition-colors duration-300 hover:bg-gray-800 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-3">
            <svg
              className="w-8 h-8 text-yellow-300 animate-bounce"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8 2 4 6 4 10c0 4 4 8 8 8s8-4 8-8c0-4-4-8-8-8zm0 14c-2.21 0-4-1.79-4-4h2c0 1.1.9 2 2 2s2-.9 2-2h2c0 2.21-1.79 4-4 4z" />
            </svg>
            <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-300 flex items-center space-x-2 transition-transform hover:scale-105">
              <span>T-Желания</span>
              <span className="hidden md:inline-block font-semibold text-sm bg-yellow-500 text-gray-900 px-2 py-0.5 rounded shadow-lg transition hover:scale-105 hover:bg-yellow-600">
                — помощник против импульсивных покупок
              </span>
            </h1>
          </div>

          <div className="flex gap-3 flex-wrap justify-center md:justify-end mt-4 md:mt-0">
            <button
              onClick={() => router.push("/cabinet")}
              className={`px-4 py-2 rounded transition-all duration-300 ${
                pathname === "/cabinet"
                  ? "bg-gray-800 ring-2 ring-yellow-400 scale-105"
                  : "bg-gray-800 hover:bg-gray-700 hover:scale-105"
              }`}
            >
              Личный кабинет
            </button>
            <button
              onClick={() => router.push("/settings")}
              className={`px-4 py-2 rounded transition-all duration-300 ${
                pathname === "/settings"
                  ? "bg-gray-800 ring-2 ring-yellow-400 scale-105"
                  : "bg-gray-800 hover:bg-gray-700 hover:scale-105"
              }`}
            >
              Настройки
            </button>
          </div>
        </header>

        <section className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg transition-transform hover:shadow-xl hover:-translate-y-2 duration-300">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 mb-4">
            <input
              placeholder="Название"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="p-3 rounded border border-yellow-600 bg-gray-900 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              maxLength={25}
            />
            <input
              placeholder="Цена"
              type="number"
              value={price}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length > 15 || v.startsWith("-")) return;
                setPrice(v === "" ? "" : Number(v));
              }}
              className="p-3 rounded border border-yellow-600 bg-gray-900 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            />
            <input
              placeholder="Категория"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="p-3 rounded border border-yellow-600 bg-gray-900 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              maxLength={25}
            />
            <input
              placeholder="Накопления (необязательно)"
              type="number"
              value={totalSpent}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length > 15 || v.startsWith("-")) return;
                setTotalSpent(v === "" ? "" : Number(v));
              }}
              className="p-3 rounded border border-yellow-600 bg-gray-900 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            />
            <input
              placeholder="Откладываю в месяц (необязательно)"
              type="number"
              value={monthlySaving}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length > 15 || v.startsWith("-")) return;
                setMonthlySaving(v === "" ? "" : Number(v));
              }}
              className="p-3 rounded border border-yellow-600 bg-gray-900 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
            />
            <button
              onClick={addWish}
              className="col-span-1 md:col-span-3 bg-yellow-500 text-black font-semibold py-3 px-4 rounded shadow hover:bg-yellow-600 transition transform hover:-translate-y-1"
            >
              Добавить желание
            </button>
          </div>
          {settings && settings.cooldowns && settings.cooldowns.length > 0 && (
            <div className="mt-3 text-sm text-yellow-300 transition-opacity opacity-80 hover:opacity-100 duration-300">
              Правила охлаждения:&nbsp;
              {settings.cooldowns.map((c, i) => (
                <span key={i} className="mr-3 inline-block">
                  {c.min}—{c.max} ₽ → {c.period} дн
                </span>
              ))}
            </div>
          )}
        </section>

        <section>
          {loading ? (
            <p className="text-yellow-300 text-center animate-pulse text-xl my-8">
              Загрузка...
            </p>
          ) : !wishes || wishes.length === 0 ? (
            <p className="text-yellow-300 text-center opacity-70 transition-opacity hover:opacity-100 text-lg my-8">
              У вас пока нет желаний — добавьте первое.
            </p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {wishes.map((w) => (
                <div
                  key={w.id}
                  className="bg-gray-800 p-4 rounded-lg border border-yellow-700 shadow-lg transition-transform hover:scale-105 hover:shadow-xl duration-300 animate-fadeInUp"
                >
                  <div className="flex justify-between items-start mb-2">
                    <h2 className="text-xl font-semibold">{w.title}</h2>
                    <div className="text-sm text-yellow-300">{new Date(w.createdAt || "").toLocaleString()}</div>
                  </div>
                  <p className="mb-1">Цена: {w.price} ₽</p>
                  <p className="mb-1">Категория: {w.category}</p>
                  <p className="mb-1">
                    Базовое охлаждение: От {w.coolingDays} до {getCooldownHint(w.price) && <span className="text-sm text-yellow-300">· {getCooldownHint(w.price)}</span>} дней
                  </p>
                  <p className="font-medium mb-1">Рекомендуется ждать: {w.recommendedCooling} дн</p>
                  <p className="mb-3">Статус: {w.status}</p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => removeWish(w.id)}
                      className="px-3 py-1 rounded bg-red-600 hover:bg-red-700 text-white transition"
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