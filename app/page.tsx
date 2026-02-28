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
import { saveAs } from "file-saver";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const getMilestone = (bf: number) => {
  if (bf <= 10) return "Visible abs";
  if (bf <= 14) return "Lean physique";
  if (bf <= 18) return "Athletic";
  return "Cutting...";
};

const generateTrend = (
  current: number,
  target: number,
  weeks: number,
  simulate: boolean
) => {
  const arr = [];
  let w = current;
  const loss = (current - target) / weeks;

  for (let i = 0; i < weeks; i++) {
    let fluct = simulate ? (Math.random() - 0.5) * 0.6 : 0;
    w -= loss;
    w += fluct;
    arr.push(parseFloat(w.toFixed(1)));
  }
  return arr;
};

export default function Home() {
  const chartRef = useRef(null);

  const [weight, setWeight] = useState(83.5);
  const [bodyFat, setBodyFat] = useState(17);
  const [targetBodyFat, setTargetBodyFat] = useState(12);
  const [trainingDays, setTrainingDays] = useState(3);
  const [goalSpeed, setGoalSpeed] = useState("moderate");

  const [manualLBM, setManualLBM] = useState("");
  const [manualTargetWeight, setManualTargetWeight] = useState("");

  const [results, setResults] = useState(null);
  const [draggingIndex, setDraggingIndex] = useState(null);

  const calculate = () => {
    const w = parseFloat(weight);
    const bf = parseFloat(bodyFat) / 100;
    const tbf = parseFloat(targetBodyFat) / 100;

    if (!w || !bf || !tbf) return alert("Fill all fields");

    let LBM = manualLBM ? parseFloat(manualLBM) : w * (1 - bf);
    let targetWeight = manualTargetWeight
      ? parseFloat(manualTargetWeight)
      : LBM / (1 - tbf);

    // 🔥 BMR + TDEE
    const BMR = 370 + 21.6 * LBM;

    let activityMultiplier = 1.2;
    if (trainingDays <= 1) activityMultiplier = 1.2;
    else if (trainingDays <= 3) activityMultiplier = 1.375;
    else if (trainingDays <= 5) activityMultiplier = 1.55;
    else activityMultiplier = 1.725;

    const TDEE = BMR * activityMultiplier;

    // 🔥 Goal speed → deficit
    let dailyDeficit = 500;
    if (goalSpeed === "slow") dailyDeficit = 300;
    if (goalSpeed === "moderate") dailyDeficit = 500;
    if (goalSpeed === "aggressive") dailyDeficit = 700;

    const weeklyLossKg = (dailyDeficit * 7) / 7700;

    const fatToLose = w - targetWeight;
    const weeksToGoal = Math.ceil(fatToLose / weeklyLossKg);

    const trend = generateTrend(w, targetWeight, weeksToGoal, true);

    const bfTrend = trend.map((val) =>
      parseFloat((100 - (LBM / val) * 100).toFixed(1))
    );

    const proteinTarget = Math.round(LBM * 2.2);
    const suggestedCalories = Math.round(TDEE - dailyDeficit);

    setResults({
      LBM: LBM.toFixed(1),
      targetWeight: targetWeight.toFixed(1),
      weeksToGoal,
      trend,
      bfTrend,
      proteinTarget,
      suggestedCalories,
      TDEE: Math.round(TDEE),
      weeklyLossKg: weeklyLossKg.toFixed(2),
    });
  };

  // 🔥 Drag system (same as before)
  const handleMouseDown = (e) => {
    const chart = chartRef.current;
    const points = chart.getElementsAtEventForMode(
      e.nativeEvent,
      "nearest",
      { intersect: true },
      false
    );
    if (points.length > 0) setDraggingIndex(points[0].index);
  };

  const handleMouseMove = (e) => {
    if (draggingIndex === null || !results) return;

    const chart = chartRef.current;
    const yAxis = chart.scales.y;

    let newValue = yAxis.getValueForPixel(e.nativeEvent.offsetY);
    newValue = Math.max(60, Math.min(120, newValue));

    let updatedTrend = [...results.trend];
    updatedTrend[draggingIndex] = parseFloat(newValue.toFixed(1));

    const targetWeight = parseFloat(results.targetWeight);
    const remaining = updatedTrend.length - draggingIndex - 1;

    if (remaining > 0) {
      let current = updatedTrend[draggingIndex];

      for (let i = draggingIndex + 1; i < updatedTrend.length; i++) {
        const progress = (i - draggingIndex) / remaining;
        const step =
          (current - targetWeight) /
          (remaining - (i - draggingIndex - 1));

        const slowdown = 1 - progress * 0.4;
        const fluct = (Math.random() - 0.5) * 0.4;

        const next = current - step * slowdown + fluct;

        updatedTrend[i] = parseFloat(next.toFixed(1));
        current = next;
      }
    }

    setResults({
      ...results,
      trend: updatedTrend,
    });
  };

  const handleMouseUp = () => setDraggingIndex(null);

  return (
    <main className="min-h-screen bg-zinc-950 text-white p-6">
      <div className="max-w-5xl mx-auto space-y-6">

        <h1 className="text-5xl font-bold text-center">CutForecast</h1>

        <section className="grid md:grid-cols-2 gap-4">

          <div className="bg-zinc-900 p-4 rounded-xl space-y-3">
            <h2 className="text-xl font-semibold">Your Stats</h2>

            <input type="number" value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="Weight (kg)" className="w-full p-3 bg-zinc-800 rounded" />
            <input type="number" value={bodyFat} onChange={(e) => setBodyFat(e.target.value)} placeholder="Body Fat %" className="w-full p-3 bg-zinc-800 rounded" />
            <input type="number" value={targetBodyFat} onChange={(e) => setTargetBodyFat(e.target.value)} placeholder="Target Body Fat %" className="w-full p-3 bg-zinc-800 rounded" />

            <input type="number" value={trainingDays} onChange={(e) => setTrainingDays(e.target.value)} placeholder="Training days/week" className="w-full p-3 bg-zinc-800 rounded" />

            {/* 🔥 Goal Speed */}
            <select value={goalSpeed} onChange={(e) => setGoalSpeed(e.target.value)} className="w-full p-3 bg-zinc-800 rounded">
              <option value="slow">Slow (easy)</option>
              <option value="moderate">Moderate</option>
              <option value="aggressive">Aggressive</option>
            </select>

            <input type="number" value={manualLBM} onChange={(e) => setManualLBM(e.target.value)} placeholder="Override LBM (optional)" className="w-full p-3 bg-zinc-800 rounded" />
            <input type="number" value={manualTargetWeight} onChange={(e) => setManualTargetWeight(e.target.value)} placeholder="Override Target Weight (optional)" className="w-full p-3 bg-zinc-800 rounded" />

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

        {/* 🔥 SEO / Explanation */}
        <div className="text-zinc-400 text-sm space-y-2">
          <h2 className="text-white text-lg font-semibold">
            How this works
          </h2>
          <p>
            CutForecast estimates your calorie needs based on lean body mass
            and activity levels. It predicts how your weight will change over
            time and allows you to adjust your plan visually.
          </p>
        </div>

      </div>
    </main>
  );
}





