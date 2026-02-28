"use client";

import { useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
} from "chart.js";
import dayjs from "dayjs";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement);

type ResultsType = {
  targetWeight: string;
  weeksToGoal: number;
  trend: number[];
  proteinTarget: number;
  suggestedCalories: number;
  targetBF: number;
};

const generateTrend = (current: number, target: number, weeks: number) => {
  const arr: number[] = [];
  let w = current;
  const loss = (current - target) / weeks;

  for (let i = 0; i < weeks; i++) {
    const fluct = (Math.random() - 0.5) * 0.5;
    w -= loss;
    w += fluct;
    arr.push(parseFloat(w.toFixed(1)));
  }

  return arr;
};

const getPhysiqueTargets = (value: number) => {
  const targetBF = 20 - value * 0.1;
  const proteinMultiplier = 2 + value * 0.006;
  return { targetBF, proteinMultiplier };
};
const PhysiqueFigure = ({ level }: { level: number }) => {
  const t = level;

  // subtle scaling (NOT distortion)
  const scale = 0.95 + t * 0.1;
  const muscleOpacity = 0.3 + t * 0.7;

  return (
    <div className="flex justify-center">
      <svg
        width="220"
        height="320"
        viewBox="0 0 200 300"
        style={{ transform: `scale(${scale})` }}
      >

        {/* Head */}
        <ellipse cx="100" cy="28" rx="14" ry="18" fill="#d1d5db" />

        {/* Neck */}
        <rect x="92" y="45" width="16" height="10" fill="#d1d5db" />

        {/* Torso */}
        <path
          d="
            M70 70
            Q100 55 130 70
            L120 160
            Q100 175 80 160
            Z
          "
          fill="#e5e7eb"
        />

        {/* Shoulders */}
        <ellipse cx="70" cy="75" rx="12" ry="8" fill="#e5e7eb" />
        <ellipse cx="130" cy="75" rx="12" ry="8" fill="#e5e7eb" />

        {/* Arms */}
        <path d="M60 80 Q50 120 65 160" stroke="#e5e7eb" strokeWidth="14" fill="none" />
        <path d="M140 80 Q150 120 135 160" stroke="#e5e7eb" strokeWidth="14" fill="none" />

        {/* Forearms */}
        <path d="M65 160 Q70 200 75 240" stroke="#e5e7eb" strokeWidth="10" />
        <path d="M135 160 Q130 200 125 240" stroke="#e5e7eb" strokeWidth="10" />

        {/* Legs */}
        <ellipse cx="85" cy="210" rx="14" ry="38" fill="#e5e7eb" />
        <ellipse cx="115" cy="210" rx="14" ry="38" fill="#e5e7eb" />

        {/* Calves */}
        <ellipse cx="85" cy="260" rx="10" ry="25" fill="#e5e7eb" />
        <ellipse cx="115" cy="260" rx="10" ry="25" fill="#e5e7eb" />

        {/* 🔥 Muscle lines */}
        <g opacity={muscleOpacity} stroke="#9ca3af" strokeWidth="1.2" fill="none">

          {/* Traps */}
          <path d="M85 65 L100 55 L115 65" />

          {/* Chest */}
          <path d="M75 90 Q100 80 125 90" />
          <line x1="100" y1="85" x2="100" y2="120" />

          {/* Abs */}
          <line x1="90" y1="105" x2="110" y2="105" />
          <line x1="90" y1="120" x2="110" y2="120" />
          <line x1="90" y1="135" x2="110" y2="135" />

          {/* Obliques */}
          <path d="M80 110 L90 145" />
          <path d="M120 110 L110 145" />

          {/* Arms */}
          <path d="M60 110 Q65 130 70 150" />
          <path d="M140 110 Q135 130 130 150" />

          {/* Quads */}
          <line x1="80" y1="190" x2="75" y2="240" />
          <line x1="120" y1="190" x2="125" y2="240" />

          {/* Calves */}
          <line x1="75" y1="240" x2="80" y2="275" />
          <line x1="125" y1="240" x2="120" y2="275" />

          {/* Groin */}
          <path d="M90 165 Q100 175 110 165" />

        </g>

      </svg>
    </div>
  );
};
export default function Home() {
  const chartRef = useRef<any>(null);

  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [trainingDays, setTrainingDays] = useState("");
  const [goalSpeed, setGoalSpeed] = useState("moderate");
  const [physiqueGoal, setPhysiqueGoal] = useState(50);

  const [results, setResults] = useState<ResultsType | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const calculate = () => {
    const w = Number(weight);
    const bf = Number(bodyFat) / 100;

    if (!w || !bf) return alert("Please fill in your stats");

    const { targetBF, proteinMultiplier } = getPhysiqueTargets(physiqueGoal);
    const tbf = targetBF / 100;

    const LBM = w * (1 - bf);
    const targetWeight = LBM / (1 - tbf);

    const BMR = 370 + 21.6 * LBM;

    let activityMultiplier = 1.2;
    if (Number(trainingDays) <= 3) activityMultiplier = 1.375;
    else if (Number(trainingDays) <= 5) activityMultiplier = 1.55;
    else activityMultiplier = 1.725;

    const TDEE = BMR * activityMultiplier;

    let dailyDeficit = 500;
    if (goalSpeed === "slow") dailyDeficit = 300;
    if (goalSpeed === "aggressive") dailyDeficit = 700;

    const weeklyLossKg = (dailyDeficit * 7) / 7700;
    const weeksToGoal = Math.max(
      1,
      Math.ceil((w - targetWeight) / weeklyLossKg)
    );

    const trend = generateTrend(w, targetWeight, weeksToGoal);

    const proteinTarget = Math.round(LBM * proteinMultiplier);
    const suggestedCalories = Math.round(TDEE - dailyDeficit);

    setResults({
      targetWeight: targetWeight.toFixed(1),
      weeksToGoal,
      trend,
      proteinTarget,
      suggestedCalories,
      targetBF: Math.round(targetBF),
    });
  };

  // 🔥 Graph dragging
  const handleMouseDown = (e: any) => {
    const chart = chartRef.current;
    if (!chart) return;

    const points = chart.getElementsAtEventForMode(
      e.nativeEvent,
      "nearest",
      { intersect: true },
      false
    );

    if (points.length > 0) setDraggingIndex(points[0].index);
  };

  const handleMouseMove = (e: any) => {
    if (draggingIndex === null || !results) return;

    const chart = chartRef.current;
    const yAxis = chart.scales.y;

    let newValue = yAxis.getValueForPixel(e.nativeEvent.offsetY);
    newValue = Math.max(60, Math.min(120, newValue));

    let updated = [...results.trend];
    updated[draggingIndex] = parseFloat(newValue.toFixed(1));

    const target = Number(results.targetWeight);

    for (let i = draggingIndex + 1; i < updated.length; i++) {
      const remaining = updated.length - i;
      const current = updated[i - 1];
      const step = (current - target) / remaining;
      updated[i] = parseFloat((current - step).toFixed(1));
    }

    setResults({ ...results, trend: updated });
  };

  const handleMouseUp = () => setDraggingIndex(null);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        <h1 className="text-5xl font-bold text-center">CutForecast</h1>

        {/* 🔥 Physique slider (placeholder visual for now) */}
        <div className="bg-zinc-900 p-6 rounded-xl text-center space-y-4">
          <h2 className="text-xl font-semibold">Your Goal Physique</h2>

          <PhysiqueFigure level={physiqueGoal / 100} />

          <input
            type="range"
            min="0"
            max="100"
            value={physiqueGoal}
            onChange={(e) => setPhysiqueGoal(Number(e.target.value))}
            className="w-full"
          />

          <div className="flex justify-between text-sm text-zinc-400">
            <span>Skinny</span>
            <span>Athletic</span>
            <span>Muscular</span>
          </div>
        </div>

        {/* 🔥 Inputs */}
        <section className="grid md:grid-cols-2 gap-4">

          <div className="bg-zinc-900 p-4 rounded-xl space-y-3">
            <h2 className="text-xl font-semibold">Your Stats</h2>

            <input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder="Enter your weight (kg)"
              className="w-full p-3 bg-zinc-800 rounded placeholder-gray-400"
            />

            <input
              type="number"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              placeholder="Enter body fat %"
              className="w-full p-3 bg-zinc-800 rounded placeholder-gray-400"
            />

            <input
              type="number"
              value={trainingDays}
              onChange={(e) => setTrainingDays(e.target.value)}
              placeholder="Training days per week"
              className="w-full p-3 bg-zinc-800 rounded placeholder-gray-400"
            />

            <select
              value={goalSpeed}
              onChange={(e) => setGoalSpeed(e.target.value)}
              className="w-full p-3 bg-zinc-800 rounded"
            >
              <option value="slow">Slow</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>

            <button
              onClick={calculate}
              className="w-full py-3 bg-green-500 rounded font-bold text-black"
            >
              Calculate
            </button>
          </div>

          {results && (
            <div className="bg-zinc-900 p-4 rounded-xl space-y-2">
              <h2 className="text-xl font-semibold">Your Plan</h2>

              <p>Calories: {results.suggestedCalories} kcal</p>
              <p>Protein: {results.proteinTarget}g/day</p>
              <p>Target Body Fat: {results.targetBF}%</p>
              <p>Time to Goal: {results.weeksToGoal} weeks</p>
            </div>
          )}
        </section>

        {/* 🔥 Graph */}
        {results && (
          <div className="bg-white text-black p-6 rounded-xl w-full">
            <div
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
            >
              <Line
                ref={chartRef}
                data={{
                  labels: results.trend.map((_, i) =>
                    dayjs().add(i, "week").format("MMM D")
                  ),
                  datasets: [
                    {
                      label: "Weight",
                      data: results.trend,
                      borderColor: "red",
                      tension: 0.4,
                    },
                  ],
                }}
              />
            </div>
          </div>
        )}

        {/* 🔥 SEO CONTENT */}
        <div className="text-zinc-400 text-sm space-y-6 max-w-3xl mx-auto">

          <div>
            <h2 className="text-white text-lg font-semibold">What is CutForecast?</h2>
            <p>
              CutForecast is a free fat loss calculator that helps you plan your weight loss journey.
              It estimates your calorie needs and predicts how your weight will change over time.
            </p>
          </div>

          <div>
            <h2 className="text-white text-lg font-semibold">How many calories should I eat?</h2>
            <p>
              Most people need a calorie deficit of 300–700 kcal per day to lose fat effectively.
            </p>
          </div>

          <div>
            <h2 className="text-white text-lg font-semibold">Why does weight fluctuate?</h2>
            <p>
              Daily changes are normal due to water, food intake, and glycogen levels.
            </p>
          </div>

        </div>

        {/* 🔥 Footer */}
        <div className="text-center text-xs text-zinc-500 mt-10">
          <a href="/privacy" className="mr-4">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>

      </div>
    </main>
  );
}