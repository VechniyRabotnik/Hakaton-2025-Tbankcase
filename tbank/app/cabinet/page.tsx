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
  //updatedAt?: string;
};

type Profile = {
  nick: string;
  salary: number;
  totalSavingsProfile: number;
  monthlySavingProfile: number;
  blockedCategories: string[];
};

const API = "http://localhost:8080/api";

export default function CabinetPage() {
  const [nick, setNick] = useState<string>("");
  const [editingNick, setEditingNick] = useState("");
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
      // profile
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

      // active
      const wRes = await fetch(`${API}/wishes/${nick}?status=active`);
      const wjson: Wish[] = await wRes.json();
      setWishes(wjson || []);

      // history
      const hRes = await fetch(`${API}/wishes/${nick}?status=completed`);
      const h1: Wish[] = await hRes.json();
      const cRes = await fetch(`${API}/wishes/${nick}?status=canceled`);
      const h2: Wish[] = await cRes.json();
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
    <div className="min-h-screen bg-gray-900 text-yellow-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-yellow-300">Личный кабинет</h1>

        {!nick ? (
          <div className="mb-6">
            <p className="mb-2">Войдите через ник (без паролей):</p>
            <input value={editingNick} onChange={(e) => setEditingNick(e.target.value)} className="p-2 rounded bg-gray-800 text-yellow-100 mr-2"/>
            <button onClick={() => saveNickToLocal(editingNick.trim())} className="px-3 py-1 bg-yellow-500 rounded text-black">Войти</button>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <p>Вы вошли как: <strong className="text-yellow-300">{nick}</strong></p>
              <button onClick={() => { localStorage.removeItem("nick"); setNick(""); setProfile(null); }} className="mt-2 px-3 py-1 bg-gray-700 rounded">Выйти</button>
            </div>

            <section className="mb-6 bg-gray-800 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">О себе (финансовый профиль)</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="block">
                  Зарплата
                  <input type="number" value={salary as any} onChange={(e) => {
                  const v = e.target.value;
                  if (v.length > 15) return;
                  if (v.startsWith('-')) return;
                    setSalary(e.target.value === "" ? "" : Number(e.target.value))}}
                     className="w-full p-2 rounded bg-gray-900 text-yellow-100 mt-1"/>
                </label>

                <label className="block">
                  Текущие накопления
                  <input type="number" value={totalSavingsProfile as any} onChange={(e) => {
                  const v = e.target.value;
                  if (v.length > 17) return;
                  if (v.startsWith('-')) return;
                    setTotalSavingsProfile(e.target.value === "" ? "" : Number(e.target.value))}} 
                    className="w-full p-2 rounded bg-gray-900 text-yellow-100 mt-1"/>
                </label>

                <label className="block">
                  Откладываю в месяц
                  <input type="number" value={monthlySavingProfile as any} onChange={(e) => {
                    const v = e.target.value;
                  if (v.length > 19) return;
                  if (v.startsWith('-')) return;
                    setMonthlySavingProfile(e.target.value === "" ? "" : Number(e.target.value))}} 
                    className="w-full p-2 rounded bg-gray-900 text-yellow-100 mt-1"/>
                </label>

                <label className="block col-span-1 md:col-span-2">
                  Запрещённые категории (через запятую)
                  <input type="text" value={blockedText} onChange={(e) => setBlockedText(e.target.value)} 
                  className="w-full p-2 rounded bg-gray-900 text-yellow-100 mt-1"
                  maxLength={40}/>
                </label>
              </div>

              <div className="mt-3 flex gap-2">
                <button onClick={handleSaveProfile} className="px-4 py-2 bg-yellow-500 rounded text-black font-semibold">Сохранить профиль</button>
                <button onClick={loadProfileAndWishes} className="px-4 py-2 bg-gray-700 rounded">Обновить</button>
              </div>
            </section>

            <section className="mb-6 bg-gray-800 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">Активные желания</h2>
              {loading ? <p>Загрузка...</p> : wishes.length === 0 ? <p>Нет активных желаний</p> : (
                <div className="space-y-3">
                  {wishes.map(w => (
                    <div key={w.id} className="bg-gray-900 p-3 rounded border border-yellow-600">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{w.title}</div>
                          <div className="text-sm">Цена: {w.price} ₽ · Категория: {w.category}</div>
                          <div className="text-xs text-yellow-300">Рекомендовано ждать: {w.recommendedCooling} дн</div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <button onClick={() => markCompleted(w.id)} className="px-2 py-1 bg-green-600 rounded text-black">Выполнено</button>
                          <button onClick={() => markCanceled(w.id)} className="px-2 py-1 bg-red-600 rounded text-white">Отменить</button>
                          <button onClick={() => removeWish(w.id)} className="px-2 py-1 bg-gray-700 rounded text-yellow-100">Удалить</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section className="mb-6 bg-gray-800 p-4 rounded">
              <h2 className="text-xl font-semibold mb-2">История (выполненные / отменённые)</h2>
              {history.length === 0 ? <p>Еще нет истории</p> : (
                <div className="space-y-3">
                  {history.map(h => (
                    <div key={h.id} className="bg-gray-900 p-3 rounded border border-yellow-600">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-semibold">{h.title}</div>
                          <div className="text-sm">Цена: {h.price} ₽ · Категория: {h.category}</div>
                          <div className="text-xs text-yellow-300">Статус: {h.status} </div>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => removeWish(h.id)} className="px-2 py-1 bg-gray-700 rounded">Удалить</button>
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
