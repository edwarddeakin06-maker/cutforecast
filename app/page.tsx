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

type ResultsType = {
  LBM: string;
  targetWeight: string;
  weeksToGoal: number;
  trend: number[];
  bfTrend: number[];
  proteinTarget: number;
  suggestedCalories: number;
  TDEE: number;
  weeklyLossKg: string;
};

const getMilestone = (bf: number): string => {
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
): number[] => {
  const arr: number[] = [];
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

    let LBM = manualLBM ? Number(manualLBM) : w * (1 - bf);
    let targetWeight = manualTargetWeight
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

    let updatedTrend = [...results.trend];
    updatedTrend[draggingIndex] = parseFloat(newValue.toFixed(1));

    const targetWeight = Number(results.targetWeight);
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

        {/* Rest of your JSX stays EXACTLY the same */}

      </div>
    </main>
  );
}




