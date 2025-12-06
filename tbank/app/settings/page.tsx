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
        console.warn("Нет сохранённых настроек, статус:", res.status);
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
      console.error("Ошибка сохранения:", err);
      alert("Не удалось сохранить настройки");
    }
  }

  async function sendTestNotification() {
    await fetch(`http://localhost:8080/api/notify/${userId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Проверка уведомлений",
        message: "Если ты видишь это — всё работает!",
        type: "debug",
      }),
    });

    if ("Notification" in window) {
      const permission = await Notification.requestPermission();

      if (permission === "granted") {
        const n = new Notification("Проверка уведомлений", {
          body: "Нажми здесь, чтобы открыть приложение",
        });

        n.onclick = () => window.open("http://localhost:3000", "_blank");
      } else {
        alert("Разреши уведомления в браузере.");
      }
    } else {
      alert("Уведомления не поддерживаются браузером.");
    }
  }


  return (
    <div className="min-h-screen bg-gray-900 text-yellow-100 p-6 font-sans transition-colors duration-300 hover:bg-gray-800">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <svg
              className="w-10 h-10 text-yellow-300 animate-bounce"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 2C8 2 4 6 4 10c0 4 4 8 8 8s8-4 8-8c0-4-4-8-8-8zm0 14c-2.21 0-4-1.79-4-4h2c0 1.1.9 2 2 2s2-.9 2-2h2c0 2.21-1.79 4-4 4z" />
            </svg>
            <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-300 flex items-center space-x-2 transition-transform hover:scale-105">
              <span>Настройки</span>
            </h1>
          </div>
        </header>

        <section className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg transition-transform hover:shadow-xl hover:-translate-y-2 duration-300">
          <h2 className="flex items-center text-xl font-semibold mb-4 space-x-3">
            <svg
              className="w-6 h-6 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
            </svg>
            <span>Диапазоны охлаждений</span>
          </h2>

          {cooldownRanges.map((r, i) => (
            <div key={i} className="flex gap-3 items-center mb-3 animate-fadeInUp">
              <input
                type="number"
                placeholder="От (рублей)"
                value={r.min}
                onChange={(e) => handleRangeChange(i, "min", e.target.value)}
                className="w-full md:w-1/3 p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
              <input
                type="number"
                placeholder="До (рублей)"
                value={r.max}
                onChange={(e) => handleRangeChange(i, "max", e.target.value)}
                className="w-full md:w-1/3 p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
              <input
                type="number"
                placeholder="Период (дней)"
                value={r.period}
                onChange={(e) => handleRangeChange(i, "period", e.target.value)}
                className="w-full md:w-1/3 p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
              <button
                onClick={() => removeRange(i)}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition"
              >
                Удалить
              </button>
            </div>
          ))}
          <button
            onClick={addRange}
            className="mt-4 px-4 py-2 bg-yellow-600 hover:bg-yellow-500 text-black rounded transition transform hover:scale-105"
          >
            Добавить диапазон
          </button>
        </section>

        <section className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg transition-transform hover:shadow-xl hover:-translate-y-2 duration-300">
          <h2 className="flex items-center text-xl font-semibold mb-4 space-x-3">
            <svg
              className="w-6 h-6 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 4V1L8 5l4 4V7c3.31 0 6 2.69 6 6 0 2.21-1.79 4-4 4s-4-1.79-4-4h-2c0 3.31 2.69 6 6 6 3.31 0 6-2.69 6-6s-2.69-6-6-6z" />
            </svg>
            <span>Настройка нотификатора</span>
          </h2>

          <div className="space-y-4">
            <label className="block">
              <div className="flex items-center mb-1 text-sm font-medium space-x-2">
                <svg
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2a9.99 9.99 0 0 0-9.95 8.5A8 8 0 0 0 20 10a9.99 9.99 0 0 0-8-8z" />
                </svg>
                <span>Частота опроса</span>
              </div>
              <input
                type="text"
                placeholder="например, каждые 30 минут"
                value={notificationFrequency}
                onChange={(e) => setNotificationFrequency(e.target.value)}
                className="w-full p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 mt-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </label>

            <label className="block">
              <div className="flex items-center mb-1 text-sm font-medium space-x-2">
                <svg
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 20c4.41 0 8-3.59 8-8s-3.59-8-8-8-8 3.59-8 8 3.59 8 8 8zm0-14c3.31 0 6 2.69 6 6 0 2.21-1.79 4-4 4s-4-1.79-4-4c0-3.31 2.69-6 6-6z" />
                </svg>
                <span>Исключённые товары</span>
              </div>
              <input
                type="text"
                placeholder="товар1, товар2"
                value={excludedProducts}
                onChange={(e) => setExcludedProducts(e.target.value)}
                className="w-full p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 mt-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
                maxLength={40}
              />
            </label>

            <label className="block">
              <div className="flex items-center mb-1 text-sm font-medium space-x-2">
                <svg
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 3v2m0 14v2m7-7h2M3 12H1m17.66-6.34l1.42-1.42M4.93 19.07l-1.42 1.42m12.02 2.02l-1.42-1.42M6.34 6.34L4.93 4.93" />
                </svg>
                <span>Канал нотификаций</span>
              </div>
              <select
                value={notificationChannel}
                onChange={(e) => setNotificationChannel(e.target.value)}
                className="w-full p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 mt-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              >
                <option value="">Выберите канал</option>
                <option value="notifications">Уведомления</option>
                <option value="telegram">Telegram</option>
                <option value="email">Почта (SMTP)</option>
              </select>
            </label>
          </div>
        </section>

        <section className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg transition-transform hover:shadow-xl hover:-translate-y-2 duration-300">
          <h2 className="flex items-center text-xl font-semibold mb-4 space-x-3">
            <svg
              className="w-6 h-6 text-yellow-400"
              fill="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="M12 4V1L8 5l4 4V7c3.31 0 6 2.69 6 6 0 2.21-1.79 4-4 4s-4-1.79-4-4h-2c0 3.31 2.69 6 6 6 3.31 0 6-2.69 6-6s-2.69-6-6-6z" />
            </svg>
            <span>Константы с накоплениями</span>
          </h2>
          <div className="space-y-4">
            <label className="block">
              <div className="flex items-center mb-1 text-sm font-medium space-x-2">
                <svg
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 20c4.41 0 8-3.59 8-8s-3.59-8-8-8-8 3.59-8 8 3.59 8 8 8zm0-14c3.31 0 6 2.69 6 6 0 2.21-1.79 4-4 4s-4-1.79-4-4c0-3.31 2.69-6 6-6z" />
                </svg>
                <span>Текущие Накопления</span>
              </div>
              <input
                type="number"
                value={totalSpent}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.length > 15 || v.startsWith("-")) return;
                  setTotalSpent(e.target.value === "" ? "" : Number(e.target.value));
                }}
                className="w-full p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 mt-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </label>

            <label className="block">
              <div className="flex items-center mb-1 text-sm font-medium space-x-2">
                <svg
                  className="w-4 h-4 text-yellow-400"
                  fill="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 4V1L8 5l4 4V7c3.31 0 6 2.69 6 6 0 2.21-1.79 4-4 4s-4-1.79-4-4h-2c0 3.31 2.69 6 6 6 3.31 0 6-2.69 6-6s-2.69-6-6-6z" />
                </svg>
                <span>Ежемесячные накопления</span>
              </div>
              <input
                type="number"
                value={monthlySaving}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v.length > 17 || v.startsWith("-")) return;
                  setMonthlySaving(e.target.value === "" ? "" : Number(e.target.value));
                }}
                className="w-full p-2 rounded bg-gray-900 text-yellow-100 border border-yellow-600 mt-1 focus:outline-none focus:ring-2 focus:ring-yellow-400 transition"
              />
            </label>
          </div>
        </section>
        <section className="mb-8 bg-gray-800 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl font-semibold mb-4 text-yellow-400">
            Тест уведомления
          </h2>

          <button
            onClick={sendTestNotification}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded font-semibold"
          >
            Отправить тестовое уведомление
          </button>
        </section>

        <div className="flex flex-col md:flex-row gap-4 justify-center md:justify-start mb-8">
          <button
            onClick={handleSave}
            className="px-6 py-3 bg-green-600 hover:bg-green-500 rounded font-semibold transition transform hover:scale-105"
          >
            Сохранить
          </button>
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-gray-700 hover:bg-gray-600 rounded font-semibold transition transform hover:scale-105"
          >
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}