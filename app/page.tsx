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
  const muscleOpacity = 0.3 + t * 0.7;

  return (
    <div className="flex justify-center">
      <svg width="220" height="320" viewBox="0 0 200 300">

        {/* Head */}
        <ellipse cx="100" cy="25" rx="12" ry="16" fill="#d1d5db" />

        {/* Neck */}
        <path d="M92 40 L108 40 L105 55 L95 55 Z" fill="#d1d5db" />

        {/* BODY BASE */}
        <path
          d="
          M70 65
          Q100 50 130 65
          Q135 90 130 120
          L125 160
          Q100 180 75 160
          L70 120
          Q65 90 70 65
          Z
          "
          fill="#e5e7eb"
        />

        {/* ARMS */}
        <path d="M70 70 Q55 110 70 150" stroke="#e5e7eb" strokeWidth="14" />
        <path d="M130 70 Q145 110 130 150" stroke="#e5e7eb" strokeWidth="14" />

        {/* FOREARMS */}
        <path d="M70 150 Q75 200 80 250" stroke="#e5e7eb" strokeWidth="10" />
        <path d="M130 150 Q125 200 120 250" stroke="#e5e7eb" strokeWidth="10" />

        {/* LEGS */}
        <path d="M85 170 Q80 210 85 260" stroke="#e5e7eb" strokeWidth="14" />
        <path d="M115 170 Q120 210 115 260" stroke="#e5e7eb" strokeWidth="14" />

        {/* 🔥 MUSCLE ANATOMY (ACTUAL STRUCTURE) */}
        <g opacity={muscleOpacity} stroke="#9ca3af" strokeWidth="1.2" fill="none">

          {/* Trapezius */}
          <path d="M85 65 L100 50 L115 65" />

          {/* Clavicle */}
          <path d="M75 75 Q100 70 125 75" />

          {/* Pectorals */}
          <path d="M75 90 Q100 80 125 90" />
          <line x1="100" y1="85" x2="100" y2="110" />

          {/* Serratus */}
          <path d="M78 110 L88 120" />
          <path d="M78 120 L88 130" />
          <path d="M122 110 L112 120" />
          <path d="M122 120 L112 130" />

          {/* Abs */}
          <line x1="90" y1="110" x2="110" y2="110" />
          <line x1="90" y1="125" x2="110" y2="125" />
          <line x1="90" y1="140" x2="110" y2="140" />
          <line x1="100" y1="105" x2="100" y2="155" />

          {/* Obliques */}
          <path d="M80 115 L90 155" />
          <path d="M120 115 L110 155" />

          {/* Deltoids */}
          <path d="M65 80 Q75 95 80 90" />
          <path d="M135 80 Q125 95 120 90" />

          {/* Biceps */}
          <path d="M60 105 Q70 120 70 135" />
          <path d="M140 105 Q130 120 130 135" />

          {/* Triceps */}
          <path d="M60 115 Q65 130 70 145" />
          <path d="M140 115 Q135 130 130 145" />

          {/* Forearms */}
          <path d="M70 150 Q75 180 78 210" />
          <path d="M130 150 Q125 180 122 210" />

          {/* Groin */}
          <path d="M90 165 Q100 175 110 165" />

          {/* Quads */}
          <path d="M85 180 Q80 220 85 250" />
          <path d="M115 180 Q120 220 115 250" />

          {/* Calves */}
          <path d="M85 230 Q90 250 95 265" />
          <path d="M115 230 Q110 250 105 265" />

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