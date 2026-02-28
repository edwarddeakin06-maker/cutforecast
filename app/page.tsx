"use client";

import { useState, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import dayjs from "dayjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type ResultsType = {
  LBM: string;
  targetWeight: string;
  weeksToGoal: number;
  trend: number[];
  proteinTarget: number;
  suggestedCalories: number;
  TDEE: number;
  weeklyLossKg: string;
};

const generateTrend = (
  current: number,
  target: number,
  weeks: number
): number[] => {
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

export default function Home() {
  const chartRef = useRef<any>(null);

  const [weight, setWeight] = useState<number>(83.5);
  const [bodyFat, setBodyFat] = useState<number>(17);
  const [targetBodyFat, setTargetBodyFat] = useState<number>(12);
  const [trainingDays, setTrainingDays] = useState<number>(3);
  const [goalSpeed, setGoalSpeed] = useState<string>("moderate");

  const [manualLBM, setManualLBM] = useState<string>("");
  const [manualTargetWeight, setManualTargetWeight] = useState<string>("");

  const [results, setResults] = useState<ResultsType | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);

  const calculate = () => {
    const w = Number(weight);
    const bf = Number(bodyFat) / 100;
    const tbf = Number(targetBodyFat) / 100;

    if (!w || !bf || !tbf) return alert("Fill all fields");

    const LBM = manualLBM ? Number(manualLBM) : w * (1 - bf);
    const targetWeight = manualTargetWeight
      ? Number(manualTargetWeight)
      : LBM / (1 - tbf);

    const BMR = 370 + 21.6 * LBM;

    let activityMultiplier = 1.2;
    if (trainingDays <= 1) activityMultiplier = 1.2;
    else if (trainingDays <= 3) activityMultiplier = 1.375;
    else if (trainingDays <= 5) activityMultiplier = 1.55;
    else activityMultiplier = 1.725;

    const TDEE = BMR * activityMultiplier;

    let dailyDeficit = 500;
    if (goalSpeed === "slow") dailyDeficit = 300;
    if (goalSpeed === "aggressive") dailyDeficit = 700;

    const weeklyLossKg = (dailyDeficit * 7) / 7700;

    const fatToLose = w - targetWeight;
    const weeksToGoal = Math.ceil(fatToLose / weeklyLossKg);

    const trend = generateTrend(w, targetWeight, weeksToGoal);

    const proteinTarget = Math.round(LBM * 2.2);
    const suggestedCalories = Math.round(TDEE - dailyDeficit);

    setResults({
      LBM: LBM.toFixed(1),
      targetWeight: targetWeight.toFixed(1),
      weeksToGoal,
      trend,
      proteinTarget,
      suggestedCalories,
      TDEE: Math.round(TDEE),
      weeklyLossKg: weeklyLossKg.toFixed(2),
    });
  };

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

    const updated = [...results.trend];
    updated[draggingIndex] = parseFloat(newValue.toFixed(1));

    setResults({ ...results, trend: updated });
  };

  const handleMouseUp = () => setDraggingIndex(null);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        <h1 className="text-5xl font-bold text-center">CutForecast</h1>
        <p className="text-center text-zinc-400 max-w-2xl mx-auto">
        Plan your fat loss visually. Calculate your calories, track your progress, and see how your weight will change over time.
        </p>

        <section className="grid md:grid-cols-2 gap-4">

          <div className="bg-zinc-900 p-4 rounded-xl space-y-3">
            <h2 className="text-xl font-semibold">Your Stats</h2>

            <input type="number" value={weight} onChange={(e) => setWeight(Number(e.target.value))} placeholder="Weight (kg)" className="w-full p-3 bg-zinc-800 rounded" />
            <input type="number" value={bodyFat} onChange={(e) => setBodyFat(Number(e.target.value))} placeholder="Body Fat %" className="w-full p-3 bg-zinc-800 rounded" />
            <input type="number" value={targetBodyFat} onChange={(e) => setTargetBodyFat(Number(e.target.value))} placeholder="Target Body Fat %" className="w-full p-3 bg-zinc-800 rounded" />

            <input type="number" value={trainingDays} onChange={(e) => setTrainingDays(Number(e.target.value))} placeholder="Training days/week" className="w-full p-3 bg-zinc-800 rounded" />

            <select value={goalSpeed} onChange={(e) => setGoalSpeed(e.target.value)} className="w-full p-3 bg-zinc-800 rounded">
              <option value="slow">Slow</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>

            <input type="number" value={manualLBM} onChange={(e) => setManualLBM(e.target.value)} placeholder="Override LBM" className="w-full p-3 bg-zinc-800 rounded" />
            <input type="number" value={manualTargetWeight} onChange={(e) => setManualTargetWeight(e.target.value)} placeholder="Override Target Weight" className="w-full p-3 bg-zinc-800 rounded" />

            <button onClick={calculate} className="w-full py-3 bg-green-500 rounded font-bold text-black">
              Calculate
            </button>
          </div>

          {results && (
            <div className="bg-zinc-900 p-4 rounded-xl space-y-2">
              <h2 className="text-xl font-semibold">Your Plan</h2>

              <p>Calories: {results.suggestedCalories} kcal</p>
              <p>Protein: {results.proteinTarget}g/day</p>
              <p>TDEE: {results.TDEE} kcal</p>

              <p>Weekly Loss: {results.weeklyLossKg} kg/week</p>
              <p>Time to Goal: {results.weeksToGoal} weeks</p>

              <p>Target Weight: {results.targetWeight} kg</p>
            </div>
          )}
        </section>

        {results && (
          <div className="bg-white text-black p-6 rounded-xl">
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
                      pointRadius: 6,
                    },
                  ],
                }}
              />
            </div>
          </div>
        )}

        <div className="text-zinc-400 text-sm space-y-6 max-w-3xl mx-auto">

  <div>
    <h2 className="text-white text-lg font-semibold">
      What is CutForecast?
    </h2>
    <p>
      CutForecast is a free fat loss calculator that helps you plan your weight loss journey.
      It estimates your calorie needs based on your body fat, weight, and activity level,
      then predicts how your weight will change over time.
    </p>
  </div>

  <div>
    <h2 className="text-white text-lg font-semibold">
      How many calories should I eat to lose fat?
    </h2>
    <p>
      Most people need a calorie deficit of 300–700 kcal per day to lose fat.
      A smaller deficit leads to slower, more sustainable fat loss,
      while a larger deficit leads to faster results but can be harder to maintain.
      CutForecast automatically calculates your ideal calorie target.
    </p>
  </div>

  <div>
    <h2 className="text-white text-lg font-semibold">
      How accurate is this calculator?
    </h2>
    <p>
      This calculator is based on established formulas using lean body mass and energy balance.
      While it provides a strong estimate, real-world results may vary depending on diet,
      training consistency, sleep, and lifestyle factors.
    </p>
  </div>

  <div>
    <h2 className="text-white text-lg font-semibold">
      Why does my weight fluctuate?
    </h2>
    <p>
      Daily weight changes are normal and often caused by water retention, food intake,
      and glycogen levels. This tool helps you focus on long-term trends rather than
      short-term fluctuations.
    </p>
  </div>

</div>
          <h2 className="text-white text-lg font-semibold">How this works</h2>
          <p>
            CutForecast estimates your calorie needs based on lean body mass and activity levels.
            It predicts your fat loss and lets you adjust your journey visually.
          </p>
        </div>

      </div>
    </main>
  );
}




