"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Wish = {
  id: string;
  title: string;
  price: number;
  category: string;
  createdAt: string; 
  coolingUntil: string; 
  savingsAtCreation: number;
  monthlyAllocation: number; // сколько пользователь может откладывать в месяц
  stillWant?: boolean;
};

const BLOCKED_CATEGORIES = ["игры", "техника", "шопинг"];

function uid() {
  return Math.random().toString(36).slice(2, 9);
}

export default function Home() {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState(0);
  const [category, setCategory] = useState("");
  const [coolDays, setCoolDays] = useState(3);
  const [savings, setSavings] = useState(0);
  const [monthlyAllocation, setMonthlyAllocation] = useState(0);
  const [wishes, setWishes] = useState<Wish[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("tbankwishcooler:wishes");
      if (raw) setWishes(JSON.parse(raw));
      const rawS = localStorage.getItem("tbankwishcooler:savings");
      if (rawS) setSavings(Number(rawS));
      const rawM = localStorage.getItem("tbankwishcooler:monthlyAllocation");
      if (rawM) setMonthlyAllocation(Number(rawM));
    } catch (e) {
      console.error(e);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("tbankwishcooler:wishes", JSON.stringify(wishes));
  }, [wishes]);

  useEffect(() => {
    localStorage.setItem("tbankwishcooler:savings", String(savings));
  }, [savings]);

  useEffect(() => {
    localStorage.setItem("tbankwishcooler:monthlyAllocation", String(monthlyAllocation));
  }, [monthlyAllocation]);

  // Проверка заблокированных категорий
  function isBlocked(cat: string) {
    const c = cat.trim().toLowerCase();
    return BLOCKED_CATEGORIES.some((b) => c.includes(b));
  }

  function addWish(e?: React.FormEvent) {
    e?.preventDefault();
    if (!title || price <= 0) return alert("Введите название и корректную цену");
    if (isBlocked(category)) return alert("Данная категория заблокирована для отложенных желаний.");

    const now = new Date();
    const coolingUntil = new Date(now.getTime() + coolDays * 24 * 60 * 60 * 1000);

    const w: Wish = {
      id: uid(),
      title: title.trim(),
      price: Number(price),
      category: category.trim() || "прочее",
      createdAt: now.toISOString(),
      coolingUntil: coolingUntil.toISOString(),
      savingsAtCreation: Number(savings),
      monthlyAllocation: Number(monthlyAllocation) || 0,
      stillWant: true,
    };

    setWishes((s) => [w, ...s]);
    setTitle("");
    setPrice(0);
    setCategory("");
  }

  function removeWish(id: string) {
    setWishes((s) => s.filter((w) => w.id !== id));
  }

  function toggleStillWant(id: string) {
    setWishes((s) => s.map((w) => (w.id === id ? { ...w, stillWant: !w.stillWant } : w)));
  }

  function monthsToAfford(w: Wish) {
    const have = w.savingsAtCreation;
    if (w.price <= have) return 0;
    const alloc = w.monthlyAllocation || 0;
    if (alloc <= 0) return Infinity;
    return Math.ceil((w.price - have) / alloc);
  }

  function affordDate(w: Wish) {
    const months = monthsToAfford(w);
    if (months === 0) return new Date(w.createdAt).toLocaleDateString();
    if (!isFinite(months)) return "Н/Д — нужно указать накопления/копить больше";
    const d = new Date(w.createdAt);
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString();
  }

  // При загрузке: опросить пользователя для желаний, у которых остыл период
  useEffect(() => {
    // Есть желание?
    const now = new Date();
    const cooled = wishes.filter((w) => new Date(w.coolingUntil) <= now && w.stillWant !== false);
    if (cooled.length > 0) {
      // Модал 
      cooled.forEach((w) => {
        const keep = confirm(`Период охлаждения для "${w.title}" завершился. Ты всё ещё хочешь это?`);
        setWishes((s) => s.map((x) => (x.id === w.id ? { ...x, stillWant: keep } : x)));
      });
    }
  }, []);

  const summary = useMemo(() => {
    const total = wishes.reduce((a, b) => a + b.price, 0);
    return { count: wishes.length, total };
  }, [wishes]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-yellow-50 font-sans dark:bg-yellow-900">
      <main className="flex w-full max-w-4xl flex-col gap-8 rounded-lg bg-yellow-100 p-8 dark:bg-yellow-900">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src="/next.svg" alt="logo" width={80} height={16} className="dark:invert" />
            <h1 className="text-2xl font-semibold text-yellow-900 dark:text-zinc-50">T-Желания — помощник против импульсивных покупок</h1>
          </div>
          <div className="text-right text-sm text-yellow-700 dark:text-zinc-400">
            <div>Желаний: <strong>{summary.count}</strong></div>
            <div>Сумма: <strong>{summary.total} ₽</strong></div>
          </div>
        </header>

        <section className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <form className="flex flex-col gap-3 rounded border-yellow-300 p-4" onSubmit={addWish}>
            <label className="text-sm font-medium">Что хочется</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-3 py-2" placeholder="Название (напр. Наушники)" />

            <label className="text-sm font-medium">Категория</label>
            <input value={category} onChange={(e) => setCategory(e.target.value)} className="rounded border px-3 py-2" placeholder="Категория (напр. Техника)" />

            <label className="text-sm font-medium">Цена (₽)</label>
            <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className="rounded border px-3 py-2" />

            <label className="text-sm font-medium">Период охлаждения (дней)</label>
            <input type="number" min={0} value={coolDays} onChange={(e) => setCoolDays(Number(e.target.value))} className="rounded border px-3 py-2" />

            <div className="mt-2 flex gap-2">
              <button type="submit" className="rounded bg-foreground px-4 py-2 text-white">Отложить желание</button>
              <button type="button" onClick={() => { setTitle(""); setPrice(0); setCategory(""); }} className="rounded border px-4 py-2">Очистить</button>
            </div>

            <p className="mt-2 text-xs text-yellow-600">Заблокированные категории: {BLOCKED_CATEGORIES.join(", ")}. Если категория совпадает — добавление не получится.</p>
          </form>

          <div className="rounded border p-4">
            <h3 className="mb-2 text-lg font-medium">Финансы (для расчёта доступности)</h3>
            <label className="text-sm">Накопления сейчас (₽)</label>
            <input type="number" value={savings} onChange={(e) => setSavings(Number(e.target.value))} className="mt-1 w-full rounded border px-3 py-2" />

            <label className="mt-2 text-sm">Сколько можешь откладывать в месяц (₽)</label>
            <input type="number" value={monthlyAllocation} onChange={(e) => setMonthlyAllocation(Number(e.target.value))} className="mt-1 w-full rounded border px-3 py-2" />

            <div className="mt-4 text-sm text-yellow-700">
              <p>Совет: увеличив ежемесячные отчисления, вы сможете позволить себе покупку быстрее.</p>
            </div>
          </div>
        </section>

        <section className="rounded border p-4">
          <h3 className="mb-4 text-lg font-medium">Список желаемого</h3>
          {wishes.length === 0 && <div className="text-yellow-600">Пока нет отложенных желаний — добавьте первое!</div>}

          <ul className="flex flex-col gap-3">
            {wishes.map((w) => {
              const cooled = new Date(w.coolingUntil) <= new Date();
              const months = monthsToAfford(w);
              return (
                <li key={w.id} className="flex w-full items-center justify-between gap-4 rounded border p-3">
                  <div className="flex flex-col">
                    <div className="flex items-baseline gap-3">
                      <strong className="text-base">{w.title}</strong>
                      <span className="text-xs text-yellow-600">{w.category}</span>
                    </div>
                    <div className="text-sm text-yellow-700">Цена: {w.price} ₽ • Накоплено: {w.savingsAtCreation} ₽</div>
                    <div className="text-xs text-yellow-600">Период охлаждения до: {new Date(w.coolingUntil).toLocaleDateString()}</div>
                    <div className="mt-1 text-sm">
                      {w.price <= w.savingsAtCreation ? (
                        <span className="text-green-600">Уже можно купить</span>
                      ) : !isFinite(months) ? (
                        <span className="text-red-600">Нельзя посчитать — укажите ежемесячные отчисления</span>
                      ) : (
                        <span>Примерно через <strong>{months}</strong> мес. (≈ {affordDate(w)})</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <div className="text-sm">
                      {cooled ? <span className="text-zinc-700">Остывшее</span> : <span className="text-zinc-400">В охлаждении</span>}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => toggleStillWant(w.id)} className="rounded border px-3 py-1 text-sm">{w.stillWant ? "Я всё ещё хочу" : "Уже не хочу"}</button>
                      <button onClick={() => removeWish(w.id)} className="rounded bg-red-600 px-3 py-1 text-sm text-white">Удалить</button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </main>
    </div>
  
  );
}
