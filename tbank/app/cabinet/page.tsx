"use client";

import { useEffect, useState } from "react";

type Wish = {
  id: string;
  title: string;
  price: number;
  category: string;
  coolingDays: number;
  recommendedCooling: number;
  stillWant: boolean;
  status: string;
  createdAt?: string;
};

type Profile = {
  nick: string;
  salary: number;
  totalSavingsProfile: number;
  monthlySavingProfile: number;
  blockedCategories: string[];
};

const API = "http://localhost:8080/api";

function calcComfortPeriod(price: number, total: number, monthly: number) {
  const comfort = 0.5;
  if (monthly <= 0 && total < price * comfort) return null;
  const numerator = price - (1 - comfort) * total;
  const denominator = monthly * comfort;
  if (numerator <= 0) return 0;
  if (denominator <= 0) return null;
  const months = Math.ceil(numerator / denominator);
  return months < 0 ? 0 : months;
}

export default function CabinetPage() {
  const [nick, setNick] = useState<string>("");
  const [profile, setProfile] = useState<Profile | null>(null);
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [history, setHistory] = useState<Wish[]>([]);
  const [blockedText, setBlockedText] = useState("");
  const [loading, setLoading] = useState(false);
  const [salary, setSalary] = useState<number | "">("");
  const [totalSavingsProfile, setTotalSavingsProfile] = useState<number | "">("");
  const [monthlySavingProfile, setMonthlySavingProfile] = useState<number | "">("");

  useEffect(() => {
    const storedNick = localStorage.getItem("nick");
    if (storedNick) {
      setNick(storedNick);
    }
  }, []);

  useEffect(() => {
    if (nick) {
      loadProfileAndWishes();
    }
  }, [nick]);

  function saveNickToLocal(n: string) {
    localStorage.setItem("nick", n);
    setNick(n);
  }

  async function loadProfileAndWishes() {
    setLoading(true);
    try {
      const pRes = await fetch(`${API}/user/${nick}`);
      const pjson = await pRes.json();
      setProfile({
        nick: pjson.nick,
        salary: pjson.salary || 0,
        totalSavingsProfile: pjson.totalSavingsProfile || 0,
        monthlySavingProfile: pjson.monthlySavingProfile || 0,
        blockedCategories: pjson.blockedCategories || [],
      });
      setSalary(pjson.salary || "");
      setTotalSavingsProfile(pjson.totalSavingsProfile || "");
      setMonthlySavingProfile(pjson.monthlySavingProfile || "");
      setBlockedText((pjson.blockedCategories || []).join(", "));

      const wRes = await fetch(`${API}/wishes/${nick}?status=active`);
      const wjson: Wish[] = await wRes.json();
      setWishes(wjson || []);

      const hRes1 = await fetch(`${API}/wishes/${nick}?status=completed`);
      const hRes2 = await fetch(`${API}/wishes/${nick}?status=canceled`);
      const h1: Wish[] = await hRes1.json();
      const h2: Wish[] = await hRes2.json();
      setHistory([...(h1 || []), ...(h2 || [])]);
    } catch (err) {
      console.error("Ошибка загрузки кабинета:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProfile() {
    if (!nick) {
      alert("Введите ник и войдите.");
      return;
    }
    const body = {
      nick,
      salary: salary === "" ? 0 : Number(salary),
      totalSavingsProfile: totalSavingsProfile === "" ? 0 : Number(totalSavingsProfile),
      monthlySavingProfile: monthlySavingProfile === "" ? 0 : Number(monthlySavingProfile),
      blockedCategories: blockedText.split(",").map(s => s.trim()).filter(Boolean),
    };
    try {
      const res = await fetch(`${API}/user/${nick}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Профиль сохранён");
      loadProfileAndWishes();
    } catch (err) {
      console.error("Ошибка сохранения профиля:", err);
      alert("Не удалось сохранить профиль");
    }
  }

  async function markCompleted(id: string) {
    try {
      const res = await fetch(`${API}/wishes/${nick}/${id}?action=complete`, { method: "PUT" });
      if (!res.ok) throw new Error(await res.text());
      loadProfileAndWishes();
    } catch (err) {
      console.error(err);
      alert("Не удалось пометить выполненным");
    }
  }

  async function markCanceled(id: string) {
    try {
      const res = await fetch(`${API}/wishes/${nick}/${id}?action=cancel`, { method: "PUT" });
      if (!res.ok) throw new Error(await res.text());
      loadProfileAndWishes();
    } catch (err) {
      console.error(err);
      alert("Не удалось отменить");
    }
  }

  async function removeWish(id: string) {
    if (!confirm("Удалить желание?")) return;
    try {
      const res = await fetch(`${API}/wishes/${nick}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      loadProfileAndWishes();
    } catch (err) {
      console.error(err);
      alert("Не удалось удалить");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-yellow-100 p-6 font-sans transition-colors duration-300 hover:bg-gray-800">
      <div className="max-w-5xl mx-auto">
        <header className="flex items-center justify-center mb-8">
          <div className="flex items-center space-x-4">
            <svg
              className="w-12 h-12 text-yellow-300 animate-bounce"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8 2 4 6 4 10c0 4 4 8 8 8s8-4 8-8c0-4-4-8-8-8zm0 14c-2.21 0-4-1.79-4-4h2c0 1.1.9 2 2 2s2-.9 2-2h2c0 2.21-1.79 4-4 4z" />
            </svg>
            <h1 className="text-4xl font-extrabold text-yellow-300 flex items-center space-x-2 transition-transform hover:scale-105">
              <span>Личный кабинет</span>
            </h1>
          </div>
        </header>

        {!nick ? (
          <div className="mb-6 bg-gray-800 p-4 rounded-lg shadow-lg transition-transform hover:shadow-xl hover:-translate-y-2 duration-300 flex items-center justify-center gap-3">
            <svg
              className="w-6 h-6 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <input
              className="p-2 bg-gray-700 rounded text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-400"
              placeholder="Введите ник"
              value={nick}
              onChange={(e) => setNick(e.target.value)}
            />
            <button
              className="px-4 py-2 bg-yellow-500 text-black rounded font-semibold hover:bg-yellow-600 transition"
              onClick={() => saveNickToLocal(nick.trim())}
            >
              Войти
            </button>
          </div>
        ) : (
          <>
            <div className="mb-4 flex justify-between items-center">
              <div className="flex items-center space-x-3">
                <svg
                  className="w-8 h-8 text-yellow-300 animate-bounce"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2C8 2 4 6 4 10c0 4 4 8 8 8s8-4 8-8c0-4-4-8-8-8zm0 14c-2.21 0-4-1.79-4-4h2c0 1.1.9 2 2 2s2-.9 2-2h2c0 2.21-1.79 4-4 4z" />
                </svg>
                <span className="text-xl font-semibold text-yellow-300">{nick}</span>
              </div>
              <button
                onClick={() => {
                  localStorage.removeItem("nick");
                  setNick("");
                  setProfile(null);
                }}
                className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
              >
                Выйти
              </button>
            </div>

            <section className="mb-6 bg-gray-800 p-4 rounded-lg shadow-lg transition-transform hover:shadow-xl hover:-translate-y-2 duration-300">
              <h2 className="flex items-center mb-4 space-x-3 text-xl font-semibold text-yellow-300">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                </svg>
                <span>Профиль</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block mb-1 font-semibold">Зарплата</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded bg-gray-700 border border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-yellow-100"
                    value={salary}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.length > 15 || v.startsWith("-")) return;
                      setSalary(v === "" ? "" : Number(v));
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Текущие накопления</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded bg-gray-700 border border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-yellow-100"
                    value={totalSavingsProfile}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.length > 17 || v.startsWith("-")) return;
                      setTotalSavingsProfile(v === "" ? "" : Number(v));
                    }}
                  />
                </div>
                <div>
                  <label className="block mb-1 font-semibold">Откладываю в месяц</label>
                  <input
                    type="number"
                    className="w-full p-2 rounded bg-gray-700 border border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-yellow-100"
                    value={monthlySavingProfile}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.length > 19 || v.startsWith("-")) return;
                      setMonthlySavingProfile(v === "" ? "" : Number(v));
                    }}
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-1 font-semibold">Запрещённые категории</label>
                  <input
                    type="text"
                    className="w-full p-2 rounded bg-gray-700 border border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-yellow-100"
                    placeholder="через запятую"
                    maxLength={40}
                    value={blockedText}
                    onChange={(e) => setBlockedText(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleSaveProfile}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 rounded font-semibold transition"
                >
                  Сохранить профиль
                </button>
                <button
                  onClick={loadProfileAndWishes}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition"
                >
                  Обновить
                </button>
              </div>
            </section>

            <section className="mb-6 bg-gray-800 p-4 rounded-lg shadow-lg transition-transform hover:shadow-xl hover:-translate-y-2 duration-300">
              <h2 className="flex items-center mb-4 space-x-3 text-xl font-semibold text-yellow-300">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4V1L8 5l4 4V7c3.31 0 6 2.69 6 6 0 2.21-1.79 4-4 4s-4-1.79-4-4h-2c0 3.31 2.69 6 6 6 3.31 0 6-2.69 6-6s-2.69-6-6-6z" />
                </svg>
                <span>Активные желания</span>
              </h2>
              {loading ? (
                <p className="text-yellow-300 animate-pulse">Загрузка...</p>
              ) : wishes.length === 0 ? (
                <p className="text-yellow-300 opacity-70">Нет активных желаний</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-gray-700">
                  {wishes.map((w) => {
                    const comfortMonths = calcComfortPeriod(
                      w.price,
                      profile?.totalSavingsProfile || 0,
                      profile?.monthlySavingProfile || 0
                    );

                    return (
                      <div
                        key={w.id}
                        className="bg-gray-900 p-4 rounded border border-yellow-600 shadow hover:shadow-xl transition-all duration-300 animate-fadeInUp"
                      >
                        <div className="flex justify-between items-start flex-col md:flex-row gap-2 md:gap-4">
                          <div>
                            <div className="font-semibold text-lg">{w.title}</div>
                            <div className="text-sm mb-1">
                              Цена: {w.price} ₽ · Категория: {w.category}
                            </div>
                            <div className="text-xs text-yellow-300 mb-1">
                              Рекомендуют ждать: {w.recommendedCooling} дн
                            </div>
                            <div className="text-xs text-yellow-300">
                              Комфортная покупка через:{" "}
                              {comfortMonths === null
                                ? "недостижимо"
                                : comfortMonths === 0
                                ? "уже можно"
                                : `${comfortMonths} мес.`}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2 mt-2 md:mt-0 md:self-start">
                            <button
                              onClick={() => markCompleted(w.id)}
                              className="px-3 py-1 bg-green-600 rounded hover:bg-green-500 transition"
                            >
                              Выполнено
                            </button>
                            <button
                              onClick={() => markCanceled(w.id)}
                              className="px-3 py-1 bg-red-600 rounded hover:bg-red-500 transition"
                            >
                              Отменить
                            </button>
                            <button
                              onClick={() => removeWish(w.id)}
                              className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition"
                            >
                              Удалить
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            <section className="mb-6 bg-gray-800 p-4 rounded-lg shadow-lg transition-transform hover:shadow-xl hover:-translate-y-2 duration-300">
              <h2 className="flex items-center mb-4 space-x-3 text-xl font-semibold text-yellow-300">
                <svg
                  className="w-6 h-6 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-3 12H8v-2h8v2z" />
                </svg>
                <span>История</span>
              </h2>
              {history.length === 0 ? (
                <p className="text-yellow-300 opacity-70">Еще нет истории</p>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-yellow-400 scrollbar-track-gray-700">
                  {history.map((h) => (
                    <div
                      key={h.id}
                      className="bg-gray-900 p-3 rounded border border-yellow-600 shadow hover:shadow-xl transition-all duration-300 animate-fadeInUp"
                    >
                      <div className="flex justify-between items-start flex-col md:flex-row gap-2 md:gap-4">
                        <div>
                          <div className="font-semibold">{h.title}</div>
                          <div className="text-sm mb-1">
                            Цена: {h.price} ₽ · Категория: {h.category}
                          </div>
                          <div className="text-xs text-yellow-300">Статус: {h.status}</div>
                        </div>
                        <div className="flex gap-2 mt-2 md:mt-0">
                          <button className="px-3 py-1 bg-gray-700 rounded hover:bg-gray-600 transition">Удалить</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </div>
  );
}