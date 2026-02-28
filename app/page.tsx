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

// 🔥 ANATOMY FIGURE (curved + muscle lines)
const PhysiqueFigure = ({ level }: { level: number }) => {
  const t = level;

  const shoulder = 40 + t * 40;
  const waist = 28 - t * 10;
  const chest = 20 + t * 12;
  const arm = 4 + t * 6;
  const leg = 10 + t * 6;

  const muscleOpacity = t;

  return (
    <svg width="160" height="240" viewBox="0 0 160 240" className="mx-auto transition-all duration-500">

      {/* Head */}
      <circle cx="80" cy="25" r="12" fill="#d4d4d4" />

      {/* Torso */}
      <path
        d={`
          M ${80 - shoulder / 2} 60
          Q 80 ${60 + chest}, ${80 + shoulder / 2} 60
          L ${80 + waist / 2} 130
          Q 80 ${130 + chest / 2}, ${80 - waist / 2} 130
          Z
        `}
        fill="#e5e5e5"
      />

      {/* Arms */}
      <line x1={80 - shoulder / 2 - 5} y1="75" x2={80 - shoulder / 2 - 25} y2="130" stroke="#e5e5e5" strokeWidth={arm} />
      <line x1={80 + shoulder / 2 + 5} y1="75" x2={80 + shoulder / 2 + 25} y2="130" stroke="#e5e5e5" strokeWidth={arm} />

      {/* Legs */}
      <line x1={80 - leg} y1="130" x2={65 - leg} y2="220" stroke="#e5e5e5" strokeWidth="6" />
      <line x1={80 + leg} y1="130" x2={95 + leg} y2="220" stroke="#e5e5e5" strokeWidth="6" />

      {/* 🔥 Muscle definition */}
      <g opacity={muscleOpacity} stroke="#a3a3a3" strokeWidth="1.5">

        {/* Chest line */}
        <line x1="50" y1="80" x2="110" y2="80" />

        {/* Abs */}
        <line x1="70" y1="95" x2="90" y2="95" />
        <line x1="70" y1="105" x2="90" y2="105" />
        <line x1="70" y1="115" x2="90" y2="115" />

        {/* Obliques */}
        <line x1="60" y1="95" x2="70" y2="110" />
        <line x1="100" y1="95" x2="90" y2="110" />

      </g>

    </svg>
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

    if (!w || !bf) return alert("Fill in your stats");

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
    const weeksToGoal = Math.max(1, Math.ceil((w - targetWeight) / weeklyLossKg));

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

  const handleMouseDown = (e: any) => {
    const chart = chartRef.current;
    if (!chart) return;

    const points = chart.getElementsAtEventForMode(e.nativeEvent, "nearest", { intersect: true }, false);
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

        {/* Physique */}
        <div className="bg-zinc-900 p-6 rounded-xl text-center space-y-4">
          <h2 className="text-xl font-semibold">Your Goal Physique</h2>

          <PhysiqueFigure level={physiqueGoal / 100} />

          <input type="range" min="0" max="100" value={physiqueGoal} onChange={(e) => setPhysiqueGoal(Number(e.target.value))} className="w-full" />

          <div className="flex justify-between text-sm text-zinc-400">
            <span>Skinny</span>
            <span>Athletic</span>
            <span>Muscular</span>
          </div>
        </div>

        {/* Inputs */}
        <section className="grid md:grid-cols-2 gap-4">

          <div className="bg-zinc-900 p-4 rounded-xl space-y-3">
            <h2 className="text-xl font-semibold">Your Stats</h2>

            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Enter your weight (kg)" className="w-full p-3 bg-zinc-800 rounded placeholder-gray-400" />

            <input type="number" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="Enter body fat %" className="w-full p-3 bg-zinc-800 rounded placeholder-gray-400" />

            <input type="number" value={trainingDays} onChange={(e) => setTrainingDays(e.target.value)} placeholder="Training days per week" className="w-full p-3 bg-zinc-800 rounded placeholder-gray-400" />

            <select value={goalSpeed} onChange={(e) => setGoalSpeed(e.target.value)} className="w-full p-3 bg-zinc-800 rounded">
              <option value="slow">Slow</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>

            <button onClick={calculate} className="w-full py-3 bg-green-500 rounded font-bold text-black">
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

        {/* Graph */}
        {results && (
          <div className="bg-white text-black p-6 rounded-xl w-full">
            <div onMouseDown={handleMouseDown} onMouseMove={handleMouseMove} onMouseUp={handleMouseUp}>
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

        {/* SEO CONTENT */}
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

        {/* Footer */}
        <div className="text-center text-xs text-zinc-500 mt-10">
          <a href="/privacy" className="mr-4">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>

      </div>
    </main>
  );
}