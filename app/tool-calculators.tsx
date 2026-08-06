"use client";

import Link from "next/link";
import { useState } from "react";

type ToolShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
};

function ToolShell({ eyebrow, title, description, children }: ToolShellProps) {
  return (
    <main className="min-h-screen bg-zinc-950 px-4 py-8 text-white sm:p-8">
      <div className="mx-auto max-w-3xl">
        <header className="pt-4 text-center sm:pt-10">
          <p className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            {eyebrow}
          </p>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-6xl">
            {title}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            {description}
          </p>
          <nav
            aria-label="CutForecast tools"
            className="mt-6 flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm font-semibold text-zinc-300"
          >
            <Link href="/" className="hover:text-emerald-300">
              Cut calculator
            </Link>
            <Link
              href="/body-fat-calculator"
              className="hover:text-emerald-300"
            >
              Body fat
            </Link>
            <Link
              href="/calorie-deficit-calculator"
              className="hover:text-emerald-300"
            >
              Calorie deficit
            </Link>
            <Link
              href="/how-long-to-lose-weight"
              className="hover:text-emerald-300"
            >
              Timeline
            </Link>
          </nav>
        </header>
        {children}
        <footer className="mt-10 text-center text-xs text-zinc-500">
          <Link href="/privacy" className="mr-4 hover:text-zinc-300">
            Privacy Policy
          </Link>
          <Link href="/terms" className="hover:text-zinc-300">
            Terms of Service
          </Link>
        </footer>
      </div>
    </main>
  );
}

function NumberField({
  label,
  value,
  onChange,
  placeholder,
  min = 0,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  min?: number;
}) {
  return (
    <label className="block text-sm font-medium text-zinc-300">
      {label}
      <input
        type="number"
        min={min}
        step="any"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-white placeholder:text-zinc-500 focus:border-emerald-400 focus:outline-none"
      />
    </label>
  );
}

function UnitToggle({
  unit,
  setUnit,
}: {
  unit: "metric" | "imperial";
  setUnit: (unit: "metric" | "imperial") => void;
}) {
  return (
    <div className="mb-5 flex rounded-xl bg-zinc-800 p-1 text-sm font-semibold">
      <button
        type="button"
        onClick={() => setUnit("metric")}
        className={`flex-1 rounded-lg px-3 py-2 transition ${unit === "metric" ? "bg-emerald-400 text-zinc-950" : "text-zinc-400"}`}
      >
        Metric
      </button>
      <button
        type="button"
        onClick={() => setUnit("imperial")}
        className={`flex-1 rounded-lg px-3 py-2 transition ${unit === "imperial" ? "bg-emerald-400 text-zinc-950" : "text-zinc-400"}`}
      >
        Imperial
      </button>
    </div>
  );
}

export function BodyFatCalculator() {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [sex, setSex] = useState("male");
  const [height, setHeight] = useState("");
  const [neck, setNeck] = useState("");
  const [waist, setWaist] = useState("");
  const [hip, setHip] = useState("");
  const [weight, setWeight] = useState("");
  const [result, setResult] = useState<{
    percent: number;
    fatMass?: number;
    leanMass?: number;
  } | null>(null);
  const [error, setError] = useState("");
  const calculate = () => {
    const toInches = (value: string) =>
      unit === "metric" ? Number(value) / 2.54 : Number(value);
    const h = toInches(height);
    const n = toInches(neck);
    const w = toInches(waist);
    const hips = toInches(hip);
    const circumference = sex === "male" ? w - n : w + hips - n;
    if (!h || !n || !w || (sex === "female" && !hips) || circumference <= 0) {
      setError(
        `Enter valid measurements in ${unit === "metric" ? "centimetres" : "inches"}. Women also need a hip measurement.`,
      );
      return;
    }
    const percent =
      sex === "male"
        ? 86.01 * Math.log10(circumference) - 70.041 * Math.log10(h) + 36.76
        : 163.205 * Math.log10(circumference) - 97.684 * Math.log10(h) - 78.387;
    if (!Number.isFinite(percent) || percent < 2 || percent > 70) {
      setError(
        "Those measurements produced an unrealistic estimate. Check the measurements and try again.",
      );
      return;
    }
    const kg = unit === "metric" ? Number(weight) : Number(weight) * 0.453592;
    setResult({
      percent: Number(percent.toFixed(1)),
      fatMass: kg ? Number(((kg * percent) / 100).toFixed(1)) : undefined,
      leanMass: kg ? Number((kg * (1 - percent / 100)).toFixed(1)) : undefined,
    });
    setError("");
  };
  const planWeight =
    unit === "metric" ? Number(weight) : Number(weight) * 0.453592;
  const planHeight = unit === "metric" ? Number(height) : Number(height) * 2.54;
  return (
    <ToolShell
      eyebrow="Circumference estimate"
      title="Body Fat Calculator"
      description="Estimate body-fat percentage from height and circumference measurements using the U.S. Navy method."
    >
      <section className="mt-10 rounded-3xl border border-white/10 bg-zinc-900 p-5 shadow-xl sm:p-7">
        <UnitToggle unit={unit} setUnit={setUnit} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-zinc-300">
            Sex
            <select
              value={sex}
              onChange={(event) => setSex(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-white"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <NumberField
            label={`Height (${unit === "metric" ? "cm" : "in"})`}
            value={height}
            onChange={setHeight}
            placeholder={unit === "metric" ? "e.g. 180" : "e.g. 71"}
            min={unit === "metric" ? 120 : 48}
          />
          <NumberField
            label={`Neck (${unit === "metric" ? "cm" : "in"})`}
            value={neck}
            onChange={setNeck}
            placeholder={unit === "metric" ? "e.g. 38" : "e.g. 15"}
            min={1}
          />
          <NumberField
            label={`Waist / abdomen (${unit === "metric" ? "cm" : "in"})`}
            value={waist}
            onChange={setWaist}
            placeholder={unit === "metric" ? "e.g. 84" : "e.g. 33"}
            min={1}
          />
          {sex === "female" && (
            <NumberField
              label={`Hips (${unit === "metric" ? "cm" : "in"})`}
              value={hip}
              onChange={setHip}
              placeholder={unit === "metric" ? "e.g. 100" : "e.g. 39"}
              min={1}
            />
          )}
          <NumberField
            label={`Weight (${unit === "metric" ? "kg" : "lb"}, optional)`}
            value={weight}
            onChange={setWeight}
            placeholder="For fat and lean mass"
            min={1}
          />
        </div>
        <button
          onClick={calculate}
          className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-zinc-950 hover:bg-emerald-300"
        >
          Estimate body fat
        </button>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200"
          >
            {error}
          </p>
        )}
        {result && (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-5 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Estimated body fat
            </p>
            <p className="mt-1 text-5xl font-black">{result.percent}%</p>
            {result.fatMass !== undefined && result.leanMass !== undefined && (
              <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-zinc-950/60 p-3">
                  <p className="text-zinc-400">Estimated fat mass</p>
                  <p className="mt-1 text-xl font-bold">
                    {unit === "metric"
                      ? result.fatMass
                      : (result.fatMass * 2.20462).toFixed(1)}{" "}
                    {unit === "metric" ? "kg" : "lb"}
                  </p>
                </div>
                <div className="rounded-xl bg-zinc-950/60 p-3">
                  <p className="text-zinc-400">Estimated lean mass</p>
                  <p className="mt-1 text-xl font-bold">
                    {unit === "metric"
                      ? result.leanMass
                      : (result.leanMass * 2.20462).toFixed(1)}{" "}
                    {unit === "metric" ? "kg" : "lb"}
                  </p>
                </div>
              </div>
            )}
            <Link
              href={`/?cf=1&weight=${planWeight.toFixed(1)}&height=${planHeight.toFixed(0)}&bodyFat=${result.percent}&sex=${sex}`}
              className="mt-5 inline-flex rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-300"
            >
              Use this in my cut plan
            </Link>
            <p className="mt-4 text-xs leading-5 text-zinc-400">
              This is a circumference-based estimate, not a medical measurement.
              Consistent measuring technique matters more than a single number.
            </p>
          </div>
        )}
      </section>
    </ToolShell>
  );
}

export function CalorieDeficitCalculator() {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [sex, setSex] = useState("male");
  const [age, setAge] = useState("");
  const [height, setHeight] = useState("");
  const [weight, setWeight] = useState("");
  const [activity, setActivity] = useState("1.55");
  const [rate, setRate] = useState("0.5");
  const [result, setResult] = useState<{
    maintenance: number;
    calories: number;
    deficit: number;
  } | null>(null);
  const [error, setError] = useState("");
  const calculate = () => {
    const a = Number(age);
    const h = unit === "metric" ? Number(height) : Number(height) * 2.54;
    const w = unit === "metric" ? Number(weight) : Number(weight) * 0.453592;
    if (a < 16 || a > 100 || h < 120 || h > 240 || w < 35 || w > 350) {
      setError(
        "Enter a realistic age, height, and weight to calculate your target.",
      );
      return;
    }
    const bmr = 10 * w + 6.25 * h - 5 * a + (sex === "male" ? 5 : -161);
    const maintenance = Math.round(bmr * Number(activity));
    const deficit = Math.round((Number(rate) * 7700) / 7);
    setResult({ maintenance, calories: maintenance - deficit, deficit });
    setError("");
  };
  const planWeight =
    unit === "metric" ? Number(weight) : Number(weight) * 0.453592;
  const planHeight = unit === "metric" ? Number(height) : Number(height) * 2.54;
  return (
    <ToolShell
      eyebrow="Daily calorie target"
      title="Calorie Deficit Calculator"
      description="Estimate maintenance calories and a daily calorie target from your stats, activity, and chosen weekly loss rate."
    >
      <section className="mt-10 rounded-3xl border border-white/10 bg-zinc-900 p-5 shadow-xl sm:p-7">
        <UnitToggle unit={unit} setUnit={setUnit} />
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-medium text-zinc-300">
            Sex
            <select
              value={sex}
              onChange={(event) => setSex(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-white"
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
          </label>
          <NumberField
            label="Age"
            value={age}
            onChange={setAge}
            placeholder="e.g. 30"
            min={16}
          />
          <NumberField
            label={`Height (${unit === "metric" ? "cm" : "in"})`}
            value={height}
            onChange={setHeight}
            placeholder={unit === "metric" ? "e.g. 180" : "e.g. 71"}
            min={1}
          />
          <NumberField
            label={`Weight (${unit === "metric" ? "kg" : "lb"})`}
            value={weight}
            onChange={setWeight}
            placeholder={unit === "metric" ? "e.g. 82" : "e.g. 181"}
            min={1}
          />
          <label className="text-sm font-medium text-zinc-300">
            Activity level
            <select
              value={activity}
              onChange={(event) => setActivity(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-white"
            >
              <option value="1.2">Mostly sedentary</option>
              <option value="1.375">Lightly active</option>
              <option value="1.55">Moderately active</option>
              <option value="1.725">Very active</option>
            </select>
          </label>
          <label className="text-sm font-medium text-zinc-300">
            Preferred weekly loss
            <select
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-white"
            >
              <option value="0.25">0.25 kg / week</option>
              <option value="0.5">0.5 kg / week</option>
              <option value="0.75">0.75 kg / week</option>
            </select>
          </label>
        </div>
        <button
          onClick={calculate}
          className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-zinc-950 hover:bg-emerald-300"
        >
          Calculate calorie target
        </button>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200"
          >
            {error}
          </p>
        )}
        {result && (
          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <div className="rounded-2xl bg-zinc-800 p-4">
              <p className="text-sm text-zinc-400">Estimated maintenance</p>
              <p className="mt-1 text-2xl font-black">{result.maintenance}</p>
              <p className="text-xs text-zinc-500">kcal/day</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-4">
              <p className="text-sm text-emerald-200">Suggested target</p>
              <p className="mt-1 text-2xl font-black">{result.calories}</p>
              <p className="text-xs text-zinc-400">kcal/day</p>
            </div>
            <div className="rounded-2xl bg-zinc-800 p-4">
              <p className="text-sm text-zinc-400">Daily deficit</p>
              <p className="mt-1 text-2xl font-black">{result.deficit}</p>
              <p className="text-xs text-zinc-500">kcal/day</p>
            </div>
          </div>
        )}
        {result && (
          <div className="mt-4 text-center">
            <Link
              href={`/?cf=1&weight=${planWeight.toFixed(1)}&height=${planHeight.toFixed(0)}&age=${age}&sex=${sex}&calories=${result.calories}`}
              className="inline-flex rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-300"
            >
              Continue in my cut plan
            </Link>
          </div>
        )}
        <p className="mt-5 text-xs leading-5 text-zinc-500">
          This is an estimate. Adjust from weekly average weight trends rather
          than day-to-day scale changes. If you are pregnant, under 18, managing
          a medical condition, or have a history of disordered eating, speak to
          a qualified clinician before restricting calories.
        </p>
      </section>
    </ToolShell>
  );
}

export function WeightLossTimelineCalculator() {
  const [unit, setUnit] = useState<"metric" | "imperial">("metric");
  const [start, setStart] = useState("");
  const [goal, setGoal] = useState("");
  const [rate, setRate] = useState("0.5");
  const [weeks, setWeeks] = useState<number | null>(null);
  const [goalDate, setGoalDate] = useState<string | null>(null);
  const [error, setError] = useState("");
  const startKg = unit === "metric" ? Number(start) : Number(start) * 0.453592;
  const goalKg = unit === "metric" ? Number(goal) : Number(goal) * 0.453592;
  const calculate = () => {
    const r = Number(rate);
    if (startKg < 35 || goalKg < 35 || goalKg >= startKg || r <= 0) {
      setError(
        "Enter a current weight above your goal weight, plus a weekly loss rate.",
      );
      return;
    }
    const estimatedWeeks = Math.ceil((startKg - goalKg) / r);
    setWeeks(estimatedWeeks);
    setGoalDate(
      new Date(
        Date.now() + estimatedWeeks * 7 * 24 * 60 * 60 * 1000,
      ).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      }),
    );
    setError("");
  };
  return (
    <ToolShell
      eyebrow="Goal-date estimate"
      title="How Long To Lose Weight?"
      description="Estimate how many weeks a weight-loss goal could take at a pace you choose."
    >
      <section className="mt-10 rounded-3xl border border-white/10 bg-zinc-900 p-5 shadow-xl sm:p-7">
        <UnitToggle unit={unit} setUnit={setUnit} />
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField
            label={`Current weight (${unit === "metric" ? "kg" : "lb"})`}
            value={start}
            onChange={setStart}
            placeholder={unit === "metric" ? "e.g. 90" : "e.g. 198"}
            min={1}
          />
          <NumberField
            label={`Goal weight (${unit === "metric" ? "kg" : "lb"})`}
            value={goal}
            onChange={setGoal}
            placeholder={unit === "metric" ? "e.g. 80" : "e.g. 176"}
            min={1}
          />
          <label className="text-sm font-medium text-zinc-300">
            Expected weekly loss
            <select
              value={rate}
              onChange={(event) => setRate(event.target.value)}
              className="mt-2 w-full rounded-xl border border-zinc-700 bg-zinc-800 p-3 text-white"
            >
              <option value="0.25">0.25 kg / week</option>
              <option value="0.5">0.5 kg / week</option>
              <option value="0.75">0.75 kg / week</option>
              <option value="1">1 kg / week</option>
            </select>
          </label>
        </div>
        <button
          onClick={calculate}
          className="mt-6 w-full rounded-xl bg-emerald-400 px-4 py-3 font-bold text-zinc-950 hover:bg-emerald-300"
        >
          Estimate timeline
        </button>
        {error && (
          <p
            role="alert"
            className="mt-4 rounded-xl border border-rose-400/30 bg-rose-400/10 p-3 text-sm text-rose-200"
          >
            {error}
          </p>
        )}
        {weeks && (
          <div className="mt-6 rounded-2xl border border-emerald-400/30 bg-emerald-400/10 p-6 text-center">
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Estimated timeline
            </p>
            <p className="mt-1 text-5xl font-black">{weeks} weeks</p>
            <p className="mt-3 text-zinc-300">
              Estimated goal date: <strong>{goalDate}</strong>
            </p>
            <Link
              href={`/?cf=1&weight=${startKg.toFixed(1)}`}
              className="mt-5 inline-flex rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-zinc-950 hover:bg-emerald-300"
            >
              Continue in my cut plan
            </Link>
            <p className="mt-4 text-xs leading-5 text-zinc-400">
              This is a planning estimate. Scale weight naturally varies with
              water, food intake, and activity, so review progress using a
              weekly average.
            </p>
          </div>
        )}
      </section>
    </ToolShell>
  );
}
