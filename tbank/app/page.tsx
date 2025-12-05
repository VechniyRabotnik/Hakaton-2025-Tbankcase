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
};

const API_BASE = "http://localhost:8080/api/wishes";

export default function HomePage() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [category, setCategory] = useState("");
  const [savings, setSavings] = useState<number | "">("");
  const [perMonth, setPerMonth] = useState<number | "">("");
  const [wishes, setWishes] = useState<Wish[]>([]);
  const [loading, setLoading] = useState(false);

  const userId = "testmeowmeowmeow";

  async function fetchWishes() {
    try {
      setLoading(true);
      const res = await fetch(`${API_BASE}/${userId}`);
      if (!res.ok) throw new Error(await res.text());
      const data: Wish[] = await res.json();
      setWishes(data);
    } catch (err: any) {
      console.error("Ошибка получения желаний:", err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchWishes();
  }, []);

  async function addWish() {
    if (
      !title ||
      price === "" ||
      price <= 0 ||
      (savings !== "" && savings < 0) ||
      (perMonth !== "" && perMonth < 0)
    ) {
      alert("Введите корректные данные");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          price: Number(price),
          category,
          savings: savings !== "" ? Number(savings) : 0,
          perMonth: perMonth !== "" ? Number(perMonth) : 0,
        }),
      });

      if (!res.ok) {
        const err = await res.text();
        alert("Ошибка: " + err);
        return;
      }

      
      setTitle("");
      setPrice("");
      setCategory("");
      setSavings("");
      setPerMonth("");

      fetchWishes(); 
    } catch (err: any) {
      console.error("Ошибка добавления желания:", err.message);
    }
  }

  async function toggleStillWant(id: string) {
    try {
      const res = await fetch(`${API_BASE}/${userId}/${id}`, { method: "PUT" });
      if (!res.ok) throw new Error(await res.text());
      fetchWishes();
    } catch (err: any) {
      console.error("Ошибка переключения:", err.message);
    }
  }

  async function removeWish(id: string) {
    try {
      const res = await fetch(`${API_BASE}/${userId}/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(await res.text());
      fetchWishes();
    } catch (err: any) {
      console.error("Ошибка удаления:", err.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-yellow-100 p-4 sm:p-6 font-sans">
      <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
        <h1 className="text-4xl font-extrabold mb-2 sm:mb-0 text-yellow-300 text-center sm:text-left">
          T-Желания — Помощник против импульсивных покупок
        </h1>
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-gray-800 text-yellow-300 rounded hover:bg-gray-700 transition font-semibold disabled:opacity-50" disabled>
            Личный кабинет
          </button>
          <button className="px-4 py-2 bg-gray-800 text-yellow-300 rounded hover:bg-gray-700 transition font-semibold disabled:opacity-50" disabled>
            Настройки
          </button>
        </div>
      </div>
      <div className="mb-10 grid grid-cols-1 md:grid-cols-2 gap-4 bg-gray-800 p-4 rounded-lg shadow-lg">
        <input
          placeholder="Название"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="p-3 rounded-lg border border-yellow-400 bg-gray-900 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
        />
        <input
          placeholder="Цена"
          type="number"
          value={price}
          onChange={(e) => {
            const val = e.target.value;
            setPrice(val !== "" ? Number(val) : "");
          }}
          className="p-3 rounded-lg border border-yellow-400 bg-gray-900 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
        />
        <input
          placeholder="Категория"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="p-3 rounded-lg border border-yellow-400 bg-gray-900 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
        />
        <input
          placeholder="Накопления"
          type="number"
          value={savings}
          onChange={(e) => {
            const val = e.target.value;
            setSavings(val !== "" ? Number(val) : "");
          }}
          className="p-3 rounded-lg border border-yellow-400 bg-gray-900 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
        />
        <input
          placeholder="Откладываю в месяц"
          type="number"
          value={perMonth}
          onChange={(e) => {
            const val = e.target.value;
            setPerMonth(val !== "" ? Number(val) : "");
          }}
          className="p-3 rounded-lg border border-yellow-400 bg-gray-900 text-yellow-100 focus:outline-none focus:ring-2 focus:ring-yellow-300 transition"
        />
        <button
          onClick={addWish}
          className="mt-4 md:mt-0 col-span-1 md:col-span-2 bg-yellow-500 hover:bg-yellow-600 text-black font-semibold py-3 px-6 rounded-lg shadow-lg transition w-full"
        >
          Добавить желание
        </button>
      </div>
      {loading ? (
        <p className="text-center text-yellow-300">Загрузка...</p>
      ) : wishes && wishes.length === 0 ? (
        <p className="text-center text-yellow-300">У вас пока нет желаний. Добавьте новое выше.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {wishes?.map((w) => (
            <div
              key={w.id}
              className="bg-gray-800 p-4 rounded-lg shadow-lg border-2 border-yellow-400 transition-transform hover:scale-105 hover:shadow-xl"
            >
              <h2 className="text-xl font-bold mb-2">{w.title}</h2>
              <p>Цена: {w.price} ₽</p>
              <p>Категория: {w.category}</p>
              <p>Базовое охлаждение: {w.coolingDays} дн</p>
              <p>Рекомендуется ждать: {w.recommendedCooling} дн</p>
              <p>Статус: {w.stillWant ? "Хочу" : "Не хочу"}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => toggleStillWant(w.id)}
                  className="px-3 py-1 bg-black text-yellow-300 border border-yellow-300 rounded hover:bg-yellow-300 hover:text-black transition font-semibold"
                >
                  Переключить
                </button>
                <button
                  onClick={() => removeWish(w.id)}
                  className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition font-semibold"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}