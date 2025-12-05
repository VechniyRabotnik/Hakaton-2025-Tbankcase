"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";

type Wish = {
  id: string;
  title: string;
  price: number;
  category: string;
  createdAt: string;
  coolingDays: number;
  recommendedCooling: number;
  fromLink?: boolean;
  parsed?: boolean;
  stillWant: boolean;
};

const DEFAULT_COOLING_RANGES = [
  { from: 0, to: 5000, days: 3 },
  { from: 5000, to: 50000, days: 7 },
  { from: 50000, to: 100000, days: 30 },
  { from: 100000, to: Infinity, days: 90 },
];

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export default function HomePage() {
  const [link, setLink] = useState("");
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [category, setCategory] = useState("");

  const [blockedCategories, setBlockedCategories] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem("cooler:blocked");
      return raw ? JSON.parse(raw) : ["Косметика", "Транспорт", "Фигурки"];
    } catch {
      return ["Косметика", "Транспорт", "Фигурки"];
    }
  });

  const [coolingRanges] = useState(DEFAULT_COOLING_RANGES);

  const [considerSavings, setConsiderSavings] = useState(false);
  const [savings, setSavings] = useState(0);
  const [perMonth, setPerMonth] = useState(0);

  const [wishes, setWishes] = useState<Wish[]>(() => {
    try {
      const raw = localStorage.getItem("cooler:wishes");
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem("cooler:wishes", JSON.stringify(wishes));
  }, [wishes]);

  useEffect(() => {
    localStorage.setItem("cooler:blocked", JSON.stringify(blockedCategories));
  }, [blockedCategories]);

  function mockParseLink(url: string) {
    return new Promise<{ title: string; price: number; category: string }>((res) => {
      setTimeout(() => {
        res({
          title: "Товар с сайта <3",
          price: 2025,
          category: "Фигурка",
        });
      }, 1000);
    });
  }

  async function parseFromLink() {
    if (!link.trim()) return alert("Введите ссылку");

    const data = await mockParseLink(link);
    setTitle(data.title);
    setPrice(data.price);
    setCategory(data.category);
  }

  // Logic

  function isBlocked(cat: string) {
    const c = cat.toLowerCase();
    return blockedCategories.some((b) => c.includes(b.toLowerCase()));
  }

  function calculateCooling(price: number) {
    const range = coolingRanges.find((r) => price >= r.from && price < r.to);
    return range ? range.days : 7;
  }

  function calculateExtraSavingDelay(price: number) {
    if (!considerSavings) return 0;
    if (savings >= price) return 0;
    if (perMonth <= 0) return 99999;
    const diff = price - savings;
    return Math.ceil(diff / perMonth) * 30;
  }

  function addWish() {
    if (!title.trim() || price === "") return alert("Введите корректные данные о товаре");

    if (isBlocked(category)) {
      return alert("Категория товара входит в список запрещённых. Покупка запрещена.");
    }

    const priceNum = Number(price);
    const baseCooling = calculateCooling(priceNum);
    const savingDelay = calculateExtraSavingDelay(priceNum);
    const recommended = baseCooling + savingDelay;

    const w: Wish = {
      id: uid(),
      title: title.trim(),
      price: priceNum,
      category: category.trim() || "Прочее",
      createdAt: new Date().toISOString(),
      coolingDays: baseCooling,
      recommendedCooling: recommended,
      stillWant: true,
      fromLink: Boolean(link),
      parsed: Boolean(link),
    };

    setWishes((s) => [w, ...s]);

    setTitle("");
    setPrice("");
    setCategory("");
    setLink("");
  }

  function removeWish(id: string) {
    setWishes((s) => s.filter((w) => w.id !== id));
  }

  function toggleStillWant(id: string) {
    setWishes((s) => s.map((w) => (w.id === id ? { ...w, stillWant: !w.stillWant } : w)));
  }

  const summary = useMemo(() => {
    const total = wishes.reduce((a, b) => a + b.price, 0);
    return { count: wishes.length, total };
  }, [wishes]);

  // UI

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-yellow-100 p-6 dark:from-yellow-900 dark:to-yellow-950">
      <main className="mx-auto max-w-5xl space-y-10 rounded-xl bg-white p-8 shadow-xl dark:bg-neutral-900">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/tbank.svg" width={60} height={20} alt="Logo" className="dark:invert" />
            <h1 className="text-3xl font-bold dark:text-neutral-100">T-Желания — помощник против импульсивных покупок</h1>
          </div>
          <div className="rounded-lg bg-amber-100 px-4 py-2 text-sm text-amber-800 dark:bg-yellow-800 dark:text-yellow-100">
            <div>Товаров: {summary.count}</div>
            <div>На сумму: {summary.total} ₽</div>
          </div>
        </header>



        <section className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div className="space-y-4 rounded-xl border bg-amber-50 p-6 shadow dark:bg-neutral-800">
            <h2 className="text-xl font-semibold dark:text-neutral-100">Добавить товар</h2>

            <div>
              <label className="text-sm font-medium">Ссылка на товар</label>
              <input
                value={link}
                onChange={(e) => setLink(e.target.value)}
                placeholder="https://..."
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-neutral-700"
              />
              <button
                onClick={parseFromLink}
                className="mt-2 rounded-lg bg-amber-600 px-4 py-2 text-white shadow hover:bg-amber-700 dark:bg-yellow-700"
              >
                Сканировать
              </button>
            </div>

            <hr className="border-amber-300 dark:border-yellow-700" />

            <div>
              <label className="text-sm font-medium">Название</label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-neutral-700"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Цена (₽)</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-neutral-700"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Категория</label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-neutral-700"
              />
            </div>

            <button
              onClick={addWish}
              className="mt-4 w-full rounded-lg bg-amber-600 px-4 py-2 font-semibold text-white shadow hover:bg-amber-700 dark:bg-yellow-700"
            >
              Добавить в список
            </button>
          </div>

          <div className="space-y-4 rounded-xl border bg-white p-6 shadow dark:bg-neutral-800">
            <h3 className="text-xl font-semibold dark:text-neutral-100">Финансовые параметры</h3>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={considerSavings}
                onChange={(e) => setConsiderSavings(e.target.checked)}
              />
              <span className="text-sm dark:text-neutral-200">Учитывать накопления</span>
            </div>

            {considerSavings && (
              <>
                <div>
                  <label className="text-sm font-medium">Текущие накопления (₽)</label>
                  <input
                    type="number"
                    value={savings}
                    onChange={(e) => setSavings(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-neutral-700"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium">Откладываю в месяц (₽)</label>
                  <input
                    type="number"
                    value={perMonth}
                    onChange={(e) => setPerMonth(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border px-3 py-2 dark:bg-neutral-700"
                  />
                </div>
              </>
            )}

            <div>
              <label className="text-sm font-medium">Запрещённые категории</label>
              <textarea
                value={blockedCategories.join(", ")}
                onChange={(e) => setBlockedCategories(e.target.value.split(","))}
                className="mt-1 w-full rounded-lg border px-3 py-2 text-sm dark:bg-neutral-700"
              />
            </div>
          </div>
        </section>

        <section className="rounded-xl border bg-white p-6 shadow dark:bg-neutral-800">
          <h3 className="mb-5 text-2xl font-semibold dark:text-neutral-100">Список желаний</h3>

          {wishes.length === 0 && (
            <div className="text-amber-700 dark:text-yellow-300">Пока пусто — добавьте первый товар!</div>
          )}

          <ul className="space-y-4">
            {wishes.map((w) => (
              <li
                key={w.id}
                className="flex flex-col justify-between gap-4 rounded-xl border bg-amber-50 p-4 shadow dark:bg-neutral-700 md:flex-row"
              >
                <div className="space-y-1">
                  <strong className="text-lg dark:text-neutral-100">{w.title}</strong>
                  <div className="text-sm dark:text-neutral-300">Цена: {w.price} ₽</div>
                  <div className="text-sm dark:text-neutral-300">Категория: {w.category}</div>
                  <div className="text-sm dark:text-neutral-300">
                    Базовое охлаждение: {w.coolingDays} дней
                  </div>
                  <div className="text-sm dark:text-neutral-200 font-medium">
                    Рекомендуется ждать: {w.recommendedCooling} дней
                  </div>
                </div>

                <div className="flex items-end gap-2 md:flex-col md:items-end">
                  <button
                    onClick={() => toggleStillWant(w.id)}
                    className="rounded-lg border px-3 py-1 text-sm shadow dark:bg-neutral-800 dark:text-neutral-100"
                  >
                    {w.stillWant ? "Всё ещё хочу" : "Не хочу"}
                  </button>

                  <button
                    onClick={() => removeWish(w.id)}
                    className="rounded-lg bg-red-600 px-3 py-1 text-sm font-medium text-white shadow hover:bg-red-700"
                  >
                    Удалить
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
