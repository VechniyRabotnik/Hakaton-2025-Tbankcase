"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

type CooldownRange = {
  min: number | "";
  max: number | "";
  period: number | "";
};

type SettingsPayload = {
  cooldowns: { min: number; max: number; period: number }[];
  notificationFrequency?: string;
  excludedProducts?: string;
  notificationChannel?: string;
  totalSpent?: number;
  monthlySaving?: number;
};

const SETTINGS_API = "http://localhost:8080/api/settings";

export default function SettingsPage() {
  const [cooldownRanges, setCooldownRanges] = useState<CooldownRange[]>([
    { min: "", max: "", period: "" },
  ]);

  const [notificationFrequency, setNotificationFrequency] = useState("");
  const [excludedProducts, setExcludedProducts] = useState("");
  const [notificationChannel, setNotificationChannel] = useState("");
  const [totalSpent, setTotalSpent] = useState<number | "">("");
  const [monthlySaving, setMonthlySaving] = useState<number | "">("");

  const router = useRouter();
  const userId = "testmeowmeow";

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const res = await fetch(`${SETTINGS_API}/${userId}`);
      if (!res.ok) {
        console.warn("Нет сохранённых настроек, status:", res.status);
        return;
      }
      const data = await res.json();

      if (Array.isArray(data.cooldowns) && data.cooldowns.length > 0) {
        setCooldownRanges(
          data.cooldowns.map((c: any) => ({
            min: c.min ?? "",
            max: c.max ?? "",
            period: c.period ?? "",
          }))
        );
      }

      setNotificationFrequency(data.notificationFrequency || "");
      setExcludedProducts(data.excludedProducts || "");
      setNotificationChannel(data.notificationChannel || "");
      setTotalSpent(data.totalSpent ?? "");
      setMonthlySaving(data.monthlySaving ?? "");
    } catch (err) {
      console.error("Ошибка загрузки настроек:", err);
    }
  }

  function handleRangeChange(index: number, field: keyof CooldownRange, value: string) {
    const arr = [...cooldownRanges];
    if (field === "min" || field === "max" || field === "period") {
      // easeeas 
      arr[index][field] = value === "" ? "" : (Number(value) as any);
      setCooldownRanges(arr);
    }
  }

  function addRange() {
    setCooldownRanges([...cooldownRanges, { min: "", max: "", period: "" }]);
  }

  function removeRange(idx: number) {
    const arr = cooldownRanges.filter((_, i) => i !== idx);
    setCooldownRanges(arr.length ? arr : [{ min: "", max: "", period: "" }]);
  }

  async function handleSave() {
    // baza
    const payload: SettingsPayload = {
      cooldowns: cooldownRanges
        .filter((r) => r.min !== "" && r.max !== "" && r.period !== "")
        .map((r) => ({ min: Number(r.min), max: Number(r.max), period: Number(r.period) })),
      notificationFrequency,
      excludedProducts,
      notificationChannel,
      totalSpent: totalSpent === "" ? 0 : Number(totalSpent),
      monthlySaving: monthlySaving === "" ? 0 : Number(monthlySaving),
    };

    try {
      const res = await fetch(`${SETTINGS_API}/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await res.text());
      alert("Настройки сохранены");
      router.push("/"); 
    } catch (err) {
      console.error("Ошибка сохранения настроек:", err);
      alert("Не удалось сохранить настройки");
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 text-yellow-100 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-extrabold text-yellow-300 mb-6">Настройки</h1>

        <section className="mb-6 bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-3">Диапазоны охлаждений</h2>

          {cooldownRanges.map((r, i) => (
            <div key={i} className="flex gap-2 items-center mb-2">
              <input
                type="number"
                placeholder="От (рублей)"
                value={r.min as any}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length > 15) return;
                if (v.startsWith('-')) return;
                  handleRangeChange(i, "min", e.target.value)}}
                className="p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600"
              />
              <input
                type="number"
                placeholder="До (рублей)"
                value={r.max as any}
                onChange={(e) =>  {
                const v = e.target.value;
                if (v.length > 17) return;
                if (v.startsWith('-')) return;
                handleRangeChange(i, "max", e.target.value)}}
                className="p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600"
              />
              <input
                type="number"
                placeholder="Период (дней)"
                value={r.period as any}
                onChange={(e) => {
                const v = e.target.value;
                if (v.length > 5) return;
                if (v.startsWith('-')) return;
                  handleRangeChange(i, "period", e.target.value)}}
                className="p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600"
              />
              <button onClick={() => removeRange(i)} className="px-2 py-1 bg-red-600 rounded text-white">Удалить</button>
            </div>
          ))}

          <div>
            <button onClick={addRange} className="px-4 py-2 bg-yellow-600 rounded text-black">Добавить диапазон</button>
          </div>
        </section>

        <section className="mb-6 bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-3">Настройка нотификатора</h2>

          <label className="block mb-2">
            Частота опроса
            <input
              type="text"
              value={notificationFrequency}
              onChange={(e) =>  {
                const v = e.target.value;
                if (v.length > 8) return;
                if (v.startsWith('-')) return;
                setNotificationFrequency(e.target.value)}}
              placeholder="например, каждые 30 минут"
              className="w-full p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 mt-1"
            />
          </label>

          <label className="block mb-2">
            Исключенные товары (через запятую)
            <input
              type="text"
              value={excludedProducts}
              onChange={(e) => setExcludedProducts(e.target.value)}
              placeholder="товар1, товар2"
              className="w-full p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 mt-1"
              maxLength={40}
            />
          </label>

          <label className="block mb-2">
            Канал нотификаций
            <select value={notificationChannel} onChange={(e) => setNotificationChannel(e.target.value)} className="w-full p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 mt-1">
              <option value="">Выберите канал</option>
              <option value="notifications">Уведомления</option>
              <option value="telegram">Telegram</option>
              <option value="email">Почта (SMTP)</option>
            </select>
          </label>
        </section>

        <section className="mb-6 bg-gray-800 p-4 rounded">
          <h2 className="text-xl font-semibold mb-3">Константы с накоплениями</h2>

          <label className="block mb-2">
            Текущие Накопления
            <input
              type="number"
              value={totalSpent as any}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length > 15) return;
                if (v.startsWith('-')) return;
                setTotalSpent(e.target.value === "" ? "" : Number(e.target.value))}}
              className="w-full p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 mt-1"
            />
          </label>

          <label className="block mb-2">
            Ежемесячные накопления
            <input
              type="number"
              value={monthlySaving as any}
              onChange={(e) => {
                const v = e.target.value;
                if (v.length > 17) return;
                if (v.startsWith('-')) return;
                setMonthlySaving(e.target.value === "" ? "" : Number(e.target.value))}}
              className="w-full p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 mt-1"
            />
          </label>
        </section>

        <div className="flex gap-3">
          <button onClick={handleSave} className="px-4 py-2 bg-green-600 rounded text-black">Сохранить</button>
          <button onClick={() => router.push("/")} className="px-4 py-2 bg-gray-700 rounded">Отмена</button>
        </div>
      </div>
    </div>
  );
}
