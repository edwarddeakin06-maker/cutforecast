"use client";
import html2canvas from "html2canvas";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import dayjs from "dayjs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);
const hoverLine = {
  id: "hoverLine",
  afterDraw(chart: any) {
    if (chart.tooltip && chart.tooltip.dataPoints?.length) {
      const ctx = chart.ctx;
      const activePoint = chart.tooltip.dataPoints[0];
      const x = activePoint.element.x;
      const topY = chart.scales.y.top;
      const bottomY = chart.scales.y.bottom;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, bottomY);
      ctx.lineWidth = 1;
      ctx.strokeStyle = "rgba(255,255,255,0.3)";
      ctx.stroke();
      ctx.restore();
    }
  },
};

type ResultsType = {
  targetWeight: string;
  weeksToGoal: number;
  trend: number[];
  proteinTarget: number;
  fatTarget: number;
  carbTarget: number;
  suggestedCalories: number;
  targetBF: number;
  weeklyLossKg: number;
  pace: "Sustainable" | "Ambitious" | "Aggressive";
};

type CheckIn = {
  id: string;
  week_number: number;
  weight_kg: number;
  created_at: string;
};

type AnalyticsWindow = Window & {
  gtag?: (command: "event", eventName: string, parameters?: Record<string, string | number | boolean>) => void;
};

const generateTrend = (
  startWeight: number,
  targetWeight: number,
  weeks: number,
  bodyFatPercent: number,
  startingCut: boolean
) => {

  const arr: number[] = [];

  let weight = startWeight;
  let waterOffset = 0;

  for (let i = 0; i < weeks; i++) {

    const progress = i / weeks;
    // NEAT suppression (people unconsciously move less during a diet)
const neatSuppression = Math.min(progress * 180, 120);
    // metabolic adaptation (up to ~15%)
    const adaptation = 1 - progress * 0.15;

    // smaller body burns fewer calories
    const bodyWeightEffect = weight / startWeight;

    // estimated weekly fat loss
    // dynamic TDEE reduction as weight drops (~25 kcal per kg lost)
const weightLost = startWeight - weight;
const metabolicDrop = Math.min(
  (weightLost * 25 + neatSuppression * 7) / 7700,
  0.45
);
const leannessPenalty = bodyFatPercent < 18 ? 1 - (18 - bodyFatPercent) * 0.02 : 1;
let weeklyLoss =
  ((startWeight - targetWeight) / weeks) *
  adaptation *
  bodyWeightEffect *
  (1 - metabolicDrop) *
  leannessPenalty;

weeklyLoss = Math.max(weeklyLoss, 0.02);


    // realistic fluctuation
    const fluctuation = (Math.random() - 0.5) * 0.7; // ±0.4 kg random fluctuation

    weight -= weeklyLoss;

    if (startingCut) {

  const bf = bodyFatPercent;

  let waterDrop = 0;

  if (bf > 25) waterDrop = 1.2;
  else if (bf > 20) waterDrop = 0.9;
  else if (bf > 15) waterDrop = 0.6;
  else if (bf > 12) waterDrop = 0.3;

  if (i === 0) weight -= waterDrop;
  if (i === 1) weight -= waterDrop * 0.4;

}

    // persistent water fluctuation
const previousOffset = waterOffset;

waterOffset += fluctuation * 0.35;
waterOffset = Math.max(-1.2, Math.min(1.2, waterOffset));

weight += (waterOffset - previousOffset);

    arr.push(parseFloat(weight.toFixed(1)));
  }

  return arr;
};

export default function Home() {
  const chartRef = useRef<any>(null);
  const pathname = usePathname();
  const pageCopy = {
    "/body-fat-calculator": {
      title: "Body Fat Calculator",
      description: "Estimate the target weight, calorie target, macros, and timeline that fit your goal body-fat percentage.",
    },
    "/calorie-deficit-calculator": {
      title: "Calorie Deficit Calculator",
      description: "Build a practical calorie deficit, see your macro targets, and forecast a realistic fat-loss timeline.",
    },
    "/how-long-to-lose-weight": {
      title: "How Long To Lose Weight?",
      description: "Estimate how long your goal could take using your current body composition, activity, and preferred pace.",
    },
    "/weight-loss-calculator": {
      title: "Weight Loss Calculator",
      description: "Get a calorie target, macro split, goal date, and realistic weight-loss forecast tailored to your cut.",
    },
  }[pathname] ?? {
    title: "Weight Loss Calculator",
    description: "Predict how long it will take to reach your goal body fat using calorie deficits, training frequency and realistic fat-loss modelling. Drag the graph to simulate cheat days and watch your timeline adjust.",
  };

  const [weight, setWeight] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [trainingDays, setTrainingDays] = useState("");
  const [goalSpeed, setGoalSpeed] = useState("moderate");
  const [stepTarget, setStepTarget] = useState<number | null>(null);
  const [results, setResults] = useState<ResultsType | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [targetBodyFat, setTargetBodyFat] = useState("");
  const [sex, setSex] = useState("");
  const [height, setHeight] = useState("");
  const [age, setAge] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [weightSt, setWeightSt] = useState("");
  const [weightLb, setWeightLb] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [goalDate, setGoalDate] = useState<string | null>(null);
  const [milestones, setMilestones] = useState<number[]>([]);
  const [cheatImpact, setCheatImpact] = useState<number | null>(null);
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [customCalories, setCustomCalories] = useState("");
  const [customProtein, setCustomProtein] = useState("");
  const [maintenanceCalories, setMaintenanceCalories] = useState<number | null>(null);
  const [sliderColor, setSliderColor] = useState("green");
  const [dailyDeficitValue, setDailyDeficitValue] = useState<number | null>(null);
  const [weeklyLossValue, setWeeklyLossValue] = useState<number | null>(null);
  const [customSteps, setCustomSteps] = useState<number | null>(null);
  const [extraExerciseCalories, setExtraExerciseCalories] = useState(0);
  const [scenarioInput, setScenarioInput] = useState("");
  const [scenarioMessage, setScenarioMessage] = useState("");
  const [startingCut, setStartingCut] = useState(true);
  const [validationError, setValidationError] = useState("");
  const [checkInWeek, setCheckInWeek] = useState(1);
  const [checkInWeight, setCheckInWeight] = useState("");
  const [checkInMessage, setCheckInMessage] = useState("");
  const [checkins, setCheckins] = useState<CheckIn[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [authUser, setAuthUser] = useState<User | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authMessage, setAuthMessage] = useState("");
  const [cloudReady, setCloudReady] = useState(false);
  const [shareMessage, setShareMessage] = useState("");
  // 🔥 Default empty graph
  const emptyTrend = Array.from({ length: 8 }, (_, i) => 0);
  const latestCheckin = checkins[checkins.length - 1];
  const expectedAtLatestCheckin = latestCheckin && results
    ? results.trend[Math.min(latestCheckin.week_number, results.trend.length) - 1]
    : null;
  const checkinDifference = latestCheckin && expectedAtLatestCheckin !== null
    ? latestCheckin.weight_kg - expectedAtLatestCheckin
    : null;
  const progressStatus = checkinDifference === null
    ? null
    : checkinDifference > 0.25
    ? "Behind forecast"
    : checkinDifference < -0.25
    ? "Ahead of forecast"
    : "On track";

  const restorePlan = (data: Record<string, any>) => {
    setWeight(data.weight ?? "");
    setBodyFat(data.bodyFat ?? "");
    setTrainingDays(data.trainingDays ?? "");
    setSex(data.sex ?? "");
    setHeight(data.height ?? "");
    setAge(data.age ?? "");
    setGoalSpeed(data.goalSpeed ?? "moderate");
    setTargetBodyFat(data.targetBodyFat ?? "");
    setWeightUnit(data.weightUnit ?? "kg");
    setHeightUnit(data.heightUnit ?? "cm");
    setWeightSt(data.weightSt ?? "");
    setWeightLb(data.weightLb ?? "");
    setHeightFt(data.heightFt ?? "");
    setHeightIn(data.heightIn ?? "");
    setCustomCalories(data.customCalories ?? "");
    setCustomProtein(data.customProtein ?? "");
    setStepTarget(data.stepTarget ?? null);
    setCustomSteps(data.customSteps ?? null);
    setMaintenanceCalories(data.maintenanceCalories ?? null);
    setExtraExerciseCalories(data.extraExerciseCalories ?? 0);
    setStartingCut(data.startingCut ?? true);
    setResults(data.results ?? null);
    setGoalDate(data.goalDate ?? null);
    setMilestones(data.milestones ?? []);
    setDailyDeficitValue(data.dailyDeficitValue ?? null);
    setWeeklyLossValue(data.weeklyLossValue ?? null);
    setCheckins(data.checkins ?? []);
  };

  const trackEvent = (eventName: string, parameters?: Record<string, string | number | boolean>) => {
    (window as AnalyticsWindow).gtag?.("event", eventName, parameters);
  };

  const calculate = () => {

  let w = Number(weight);
  let h = Number(height);

  // weight conversion
if (weightUnit === "st") {

  const st = Number(weightSt) || 0;
  const lb = Number(weightLb) || 0;

  w = (st * 14 + lb) * 0.453592;

}

// height conversion
if (heightUnit === "ft") {

  const ft = Number(heightFt) || 0;
  const inch = Number(heightIn) || 0;

  h = (ft * 12 + inch) * 2.54;

}

  const currentBodyFat = Number(bodyFat);
  const targetBodyFatNumber = Number(targetBodyFat) || 12;
  const days = Number(trainingDays);
  const a = Number(age);

  if (!w || !h || !a || !sex || !currentBodyFat || Number.isNaN(days)) {
    setValidationError("Add your weight, height, body fat, age, sex, and training days to build your plan.");
    return;
  }

  if (w < 35 || w > 350 || h < 120 || h > 240 || a < 16 || a > 100 || days < 0 || days > 7 || currentBodyFat < 3 || currentBodyFat > 70) {
    setValidationError("Check the values entered. This calculator supports ages 16–100, 0–7 training days, and realistic weight, height, and body-fat ranges.");
    return;
  }

  if (targetBodyFatNumber < 4 || targetBodyFatNumber >= currentBodyFat) {
    setValidationError("Choose a target body-fat percentage below your current estimate (and at least 4%).");
    return;
  }

  setValidationError("");

  const bf = Number(bodyFat) / 100;
  let BMR = 10 * w + 6.25 * h - 5 * a;

if (sex === "male") BMR += 5;
else BMR -= 161;

let activityMultiplier = 1.2;

if (Number(trainingDays) <= 3) activityMultiplier = 1.375;
else if (Number(trainingDays) <= 5) activityMultiplier = 1.55;
else activityMultiplier = 1.725;

let TDEE = BMR * activityMultiplier;

// step calorie burn adjustment
const stepBurn = ((customSteps || stepTarget || 8000) - 8000) * 0.04;
TDEE += stepBurn + extraExerciseCalories;

setMaintenanceCalories(Math.round(TDEE));

let dailyDeficit = 500;

if (goalSpeed === "slow") dailyDeficit = 300;
if (goalSpeed === "aggressive") dailyDeficit = 700;

let steps = 8000;

if (goalSpeed === "slow") steps = 7000;
if (goalSpeed === "moderate") steps = 9000;
if (goalSpeed === "aggressive") steps = 11000;

setStepTarget(steps);
setCustomSteps(steps);
const LBM = w * (1 - bf);

const targetBF = targetBodyFatNumber;
const tbf = targetBF / 100;

const targetWeight = LBM / (1 - tbf);

const weeklyLossKg = (dailyDeficit * 7) / 7700;

const weeksToGoal = Math.max(
  1,
  Math.ceil((w - targetWeight) / weeklyLossKg)
);

const trend = generateTrend(w, targetWeight, weeksToGoal, Number(bodyFat), startingCut);

const proteinTarget = Math.round(LBM * 2.2);

const suggestedCalories = Math.round(TDEE - dailyDeficit);
const fatTarget = Math.max(40, Math.round(w * 0.6));
const carbTarget = Math.max(0, Math.round((suggestedCalories - proteinTarget * 4 - fatTarget * 9) / 4));
const pace = weeklyLossKg / w < 0.0075 ? "Sustainable" : weeklyLossKg / w <= 0.01 ? "Ambitious" : "Aggressive";

setResults({
  targetWeight: targetWeight.toFixed(1),
  weeksToGoal,
  trend,
  proteinTarget,
  fatTarget,
  carbTarget,
  suggestedCalories,
  targetBF,
  weeklyLossKg: Number(weeklyLossKg.toFixed(2)),
  pace,
});

setCustomCalories(String(suggestedCalories));
setDailyDeficitValue(dailyDeficit);
setWeeklyLossValue(Number(weeklyLossKg.toFixed(2)));

const goal = dayjs().add(weeksToGoal, "week").format("MMM D YYYY");

setGoalDate(goal);

const milestoneCount = 3;

const milestoneWeeks = Array.from(
  { length: milestoneCount },
  (_, i) => Math.round(((i + 1) / milestoneCount) * weeksToGoal)
);

const milestoneWeights = milestoneWeeks.map((w) => trend[w - 1]);

setMilestones(milestoneWeights);

setCheatImpact(null);
setCheckInMessage("");
trackEvent("plan_calculated", { goal_speed: goalSpeed, pace });
};
  useEffect(() => {
  if (navigator.language === "en-GB") {
    setWeightUnit("st");
    setHeightUnit("ft");
  }
}, []);
useEffect(() => {
  try {
    const saved = localStorage.getItem("cutforecast-data");
    if (!saved) return;
    const data = JSON.parse(saved);
    restorePlan(data);
  } catch {
    localStorage.removeItem("cutforecast-data");
  } finally {
    setHydrated(true);
  }
}, []);

useEffect(() => {
  if (!hydrated) return;
  localStorage.setItem("cutforecast-data", JSON.stringify({
    weight, bodyFat, trainingDays, goalSpeed, stepTarget, results, targetBodyFat, sex, height, age,
    weightUnit, heightUnit, weightSt, weightLb, heightFt, heightIn, goalDate, milestones,
    customCalories, customProtein, maintenanceCalories, dailyDeficitValue, weeklyLossValue,
    customSteps, extraExerciseCalories, startingCut, checkins,
  }));
}, [hydrated, weight, bodyFat, trainingDays, goalSpeed, stepTarget, results, targetBodyFat, sex, height, age, weightUnit, heightUnit, weightSt, weightLb, heightFt, heightIn, goalDate, milestones, customCalories, customProtein, maintenanceCalories, dailyDeficitValue, weeklyLossValue, customSteps, extraExerciseCalories, startingCut, checkins]);

useEffect(() => {
  const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
    setAuthUser(session?.user ?? null);
  });
  supabase.auth.getUser().then(({ data }) => setAuthUser(data.user));
  return () => listener.subscription.unsubscribe();
}, []);

useEffect(() => {
  if (!authUser) {
    setCloudReady(false);
    return;
  }

  let active = true;
  setCloudReady(false);
  Promise.all([
    supabase.from("user_plans").select("plan").eq("user_id", authUser.id).maybeSingle(),
    supabase.from("user_checkins").select("id, week_number, weight_kg, created_at").eq("user_id", authUser.id).order("week_number"),
  ]).then(([planResult, checkinResult]) => {
    if (active && planResult.data?.plan) restorePlan(planResult.data.plan as Record<string, any>);
    if (active && checkinResult.data) setCheckins(checkinResult.data as CheckIn[]);
    if (active) setCloudReady(true);
  });
  return () => { active = false; };
}, [authUser]);

useEffect(() => {
  if (!hydrated || !authUser || !cloudReady) return;
  const plan = {
    weight, bodyFat, trainingDays, goalSpeed, stepTarget, results, targetBodyFat, sex, height, age,
    weightUnit, heightUnit, weightSt, weightLb, heightFt, heightIn, goalDate, milestones,
    customCalories, customProtein, maintenanceCalories, dailyDeficitValue, weeklyLossValue,
    customSteps, extraExerciseCalories, startingCut,
  };
  supabase.from("user_plans").upsert({ user_id: authUser.id, plan, updated_at: new Date().toISOString() });
}, [hydrated, authUser, cloudReady, weight, bodyFat, trainingDays, goalSpeed, stepTarget, results, targetBodyFat, sex, height, age, weightUnit, heightUnit, weightSt, weightLb, heightFt, heightIn, goalDate, milestones, customCalories, customProtein, maintenanceCalories, dailyDeficitValue, weeklyLossValue, customSteps, extraExerciseCalories, startingCut]);

const handleAuth = async (mode: "sign-in" | "sign-up") => {
  if (!authEmail || authPassword.length < 8) {
    setAuthMessage("Enter an email and a password with at least 8 characters.");
    return;
  }
  const result = mode === "sign-up"
    ? await supabase.auth.signUp({ email: authEmail, password: authPassword, options: { emailRedirectTo: window.location.origin } })
    : await supabase.auth.signInWithPassword({ email: authEmail, password: authPassword });
  setAuthMessage(result.error ? result.error.message : mode === "sign-up" ? "Check your email to confirm your account, then sign in here." : "Signed in — your plan will now sync across devices.");
  if (!result.error) trackEvent(mode === "sign-up" ? "account_created" : "account_signed_in");
  if (!result.error && mode === "sign-in") setAuthOpen(false);
};

const resetPlan = () => {
  localStorage.removeItem("cutforecast-data");
  setWeight(""); setBodyFat(""); setTrainingDays(""); setTargetBodyFat(""); setSex(""); setHeight(""); setAge("");
  setWeightSt(""); setWeightLb(""); setHeightFt(""); setHeightIn(""); setCustomCalories(""); setCustomProtein("");
  setStepTarget(null); setCustomSteps(null); setMaintenanceCalories(null); setResults(null); setGoalDate(null); setMilestones([]);
  setDailyDeficitValue(null); setWeeklyLossValue(null); setExtraExerciseCalories(0); setCheckInWeight(""); setCheckInMessage("");
};
const recalculateFromCustom = () => {
  if (!results || !customCalories) return;

  let w = Number(weight);
let h = Number(height);

if (weightUnit === "st") {
  const st = Number(weightSt) || 0;
  const lb = Number(weightLb) || 0;
  w = (st * 14 + lb) * 0.453592;
}

if (heightUnit === "ft") {
  const ft = Number(heightFt) || 0;
  const inch = Number(heightIn) || 0;
  h = (ft * 12 + inch) * 2.54;
}

const bf = Number(bodyFat) / 100;
  const a = Number(age);

  const LBM = w * (1 - bf);

  let BMR = 10 * w + 6.25 * h - 5 * a;
  if (sex === "male") BMR += 5;
  else BMR -= 161;

  let activityMultiplier = 1.2;
  if (Number(trainingDays) <= 3) activityMultiplier = 1.375;
  else if (Number(trainingDays) <= 5) activityMultiplier = 1.55;
  else activityMultiplier = 1.725;

  let TDEE = BMR * activityMultiplier;

const steps = customSteps || stepTarget || 8000;
const stepBurn = (steps - 8000) * 0.04;

TDEE += stepBurn + extraExerciseCalories;

  const calories = Number(customCalories);

  if (calories >= TDEE) {
    alert("Calories must be below maintenance to lose weight.");
    return;
  }

  const dailyDeficit = TDEE - calories;
  setDailyDeficitValue(Math.round(dailyDeficit));

  const deficitLevel =
    dailyDeficit < 400 ? "green" :
    dailyDeficit < 700 ? "orange" :
    "red";

  setSliderColor(deficitLevel);

  const weeklyLossKg = (dailyDeficit * 7) / 7700;
  setWeeklyLossValue(Number(weeklyLossKg.toFixed(2)));

  const targetBF = Number(targetBodyFat) || 12;
  const tbf = targetBF / 100;

  const targetWeight = LBM / (1 - tbf);

  const weeksToGoal = Math.max(
    1,
    Math.ceil((w - targetWeight) / weeklyLossKg)
  );

  const trend = generateTrend(w, targetWeight, weeksToGoal, Number(bodyFat), startingCut);

  setResults({
    ...results,
    weeksToGoal,
    trend,
    suggestedCalories: calories,
    proteinTarget: customProtein
      ? Number(customProtein)
      : results.proteinTarget,
    fatTarget: results.fatTarget,
    carbTarget: Math.max(0, Math.round((calories - (customProtein ? Number(customProtein) : results.proteinTarget) * 4 - results.fatTarget * 9) / 4)),
    weeklyLossKg: Number(weeklyLossKg.toFixed(2)),
    pace: weeklyLossKg / w < 0.0075 ? "Sustainable" : weeklyLossKg / w <= 0.01 ? "Ambitious" : "Aggressive",
  });

  const goal = dayjs().add(weeksToGoal, "week").format("MMM D YYYY");
  setGoalDate(goal);

  const milestoneCount = 3;

  const milestoneWeeks = Array.from(
    { length: milestoneCount },
    (_, i) => Math.round(((i + 1) / milestoneCount) * weeksToGoal)
  );

  const milestoneWeights = milestoneWeeks.map((w) => trend[w - 1]);

  setMilestones(milestoneWeights);
};
const applyCheckIn = async () => {
  if (!results || !checkInWeight) return;

  const enteredWeight = Number(checkInWeight);
  const loggedWeight = weightUnit === "kg" ? enteredWeight : enteredWeight * 0.453592;
  const week = Math.max(1, Math.min(checkInWeek, results.weeksToGoal));
  const expectedWeight = results.trend[week - 1];

  if (!enteredWeight || loggedWeight < 35 || loggedWeight > 350) {
    setCheckInMessage("Enter a realistic 7-day average weight to update the forecast.");
    return;
  }

  const expectedWeeklyLoss = Math.max(0.05, results.weeklyLossKg);
  const remainingWeeks = Math.max(1, Math.ceil((loggedWeight - Number(results.targetWeight)) / expectedWeeklyLoss));
  const adjustedTrend = [
    ...results.trend.slice(0, week - 1),
    loggedWeight,
    ...generateTrend(loggedWeight, Number(results.targetWeight), remainingWeeks, Number(bodyFat), false),
  ];
  const updatedWeeks = week + remainingWeeks;
  const difference = loggedWeight - expectedWeight;
  const localCheckin: CheckIn = {
    id: `${week}-${Date.now()}`,
    week_number: week,
    weight_kg: Number(loggedWeight.toFixed(2)),
    created_at: new Date().toISOString(),
  };

  setCheckins((current) => [...current.filter((entry) => entry.week_number !== week), localCheckin].sort((a, b) => a.week_number - b.week_number));

  if (authUser) {
    await supabase.from("user_checkins").delete().eq("week_number", week);
    const { data } = await supabase.from("user_checkins").insert({
      user_id: authUser.id,
      week_number: week,
      weight_kg: loggedWeight,
    }).select("id, week_number, weight_kg, created_at").single();
    if (data) setCheckins((current) => [...current.filter((entry) => entry.week_number !== week), data as CheckIn].sort((a, b) => a.week_number - b.week_number));
  }

  setResults({ ...results, trend: adjustedTrend, weeksToGoal: updatedWeeks });
  setGoalDate(dayjs().add(updatedWeeks, "week").format("MMM D YYYY"));
  setCheckInMessage(
    difference > 0.25
      ? `Your average is ${difference.toFixed(1)} kg above forecast. Your timeline has been refreshed.`
      : difference < -0.25
      ? `You are ${(Math.abs(difference)).toFixed(1)} kg ahead of forecast. Your timeline has been refreshed.`
      : "You are tracking close to forecast. Your timeline has been refreshed."
  );
  trackEvent("weekly_checkin_added", { week_number: week, signed_in: Boolean(authUser) });
};
useEffect(() => {
  if (results && customCalories) {
    recalculateFromCustom();
  }
}, [customCalories, customSteps, extraExerciseCalories]);

  // 🔥 Dragging logic
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
    const originalGoalWeeks = results.weeksToGoal;
    const newEndWeight = updated[updated.length - 1];

    if (newEndWeight > Number(results.targetWeight)) {
    const diff = newEndWeight - Number(results.targetWeight);
    const delay = Math.ceil(diff / 0.2);
    setCheatImpact(delay);
    }
    setResults({ ...results, trend: updated });
  };

  const handleMouseUp = () => setDraggingIndex(null);
const downloadShareImage = () => {
  const chart = chartRef.current;

  if (!chart) {
    console.error("Chart not found");
    return;
  }

  // get chart image
  const chartImage = chart.toBase64Image();

  // create canvas for final export
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");

  canvas.width = 900;
  canvas.height = 700;

  if (!ctx) return;

  // background
  const background = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
  background.addColorStop(0, "#08131a");
  background.addColorStop(1, "#12352b");
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const img = new Image();
  img.src = chartImage;

  img.onload = () => {
    // draw graph
    ctx.drawImage(img, 50, 80, 800, 350);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px sans-serif";
    ctx.fillText("CutForecast", 50, 50);

    ctx.font = "22px sans-serif";

    const startWeightText =
  weightUnit === "kg"
    ? `${weight} kg`
    : `${weightSt} st ${weightLb} lb`;

ctx.fillText(`Start Weight: ${startWeightText}`, 50, 470);

    if (results) {
      ctx.fillText(`Goal Body Fat: ${results.targetBF}%`, 50, 510);
      ctx.fillText(`Calories: ${results.suggestedCalories} kcal`, 50, 550);
      ctx.fillText(`Protein: ${results.proteinTarget} g/day`, 450, 510);
      ctx.fillText(`Steps: ${stepTarget}`, 450, 550);
    }

    if (goalDate) {
      ctx.fillText(`Goal Date: ${goalDate}`, 50, 590);
    }

    ctx.font = "16px sans-serif";
    ctx.fillStyle = "#9ca3af";
    ctx.fillText("Generated with CutForecast.com", 50, 640);

    const link = document.createElement("a");
    link.download = "cutforecast-forecast.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };
};
const sharePlan = async () => {
  if (!results) return;
  const text = `My CutForecast plan: ${results.suggestedCalories} kcal/day, ${results.proteinTarget}g protein, and a ${results.weeksToGoal}-week timeline to ${results.targetBF}% body fat.`;

  try {
    if (navigator.share) {
      await navigator.share({ title: "My CutForecast plan", text, url: "https://cutforecast.com" });
      setShareMessage("Thanks for sharing your plan.");
      trackEvent("plan_shared", { method: "native" });
    } else {
      await navigator.clipboard.writeText(`${text} https://cutforecast.com`);
      trackEvent("plan_shared", { method: "clipboard" });
      setShareMessage("Plan summary copied — paste it into your post or message.");
    }
  } catch {
    setShareMessage("");
  }
};
const applyScenario = () => {

  if (!results) return;

  const text = scenarioInput.toLowerCase();

  let extraCalories = 0;

  if (text.includes("cycle") || text.includes("cycling") || text.includes("bike")) {
    extraCalories += 500;
  }

  if (text.includes("run") || text.includes("running")) {
    extraCalories += 700;
  }

  if (text.includes("walk") || text.includes("walking")) {
    extraCalories += 250;
  }

  if (text.includes("hockey")) {
    extraCalories += 600;
  }

  const hoursMatch = text.match(/(\d+)\s*hour/);

  if (hoursMatch) {
    const hours = Number(hoursMatch[1]);
    extraCalories *= hours;
  }

  if (extraCalories > 0) {

  const dailyBurn = Math.round(extraCalories / 7);

  setExtraExerciseCalories(dailyBurn);

  setScenarioMessage(
    `Detected activity change. Estimated extra burn: ${extraCalories} kcal/week (+${dailyBurn} kcal/day).`
  );

} else {

    setScenarioMessage("Couldn't detect a fitness change.");

  }

};
  return (
    <main className="min-h-screen bg-zinc-950 text-white px-4 py-8 sm:p-8">
      <div className="max-w-5xl mx-auto space-y-8">

        <header className="text-center space-y-4 pt-4 sm:pt-8">
          <p className="inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">
            CutForecast <span className="h-1 w-1 rounded-full bg-emerald-300" /> Personal cutting plan
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">{pageCopy.title}</h1>
          <p className="text-center text-zinc-400 max-w-2xl mx-auto text-base leading-7 sm:text-lg">
            {pageCopy.description}
          </p>
          <nav aria-label="CutForecast tools" className="flex flex-wrap items-center justify-center gap-x-4 gap-y-2 text-sm font-semibold text-zinc-300">
            <Link href="/" className="transition hover:text-emerald-300">Cut calculator</Link>
            <Link href="/body-fat-calculator" className="transition hover:text-emerald-300">Body fat calculator</Link>
            <Link href="/calorie-deficit-calculator" className="transition hover:text-emerald-300">Calorie deficit</Link>
            <Link href="/how-long-to-lose-weight" className="transition hover:text-emerald-300">Weight-loss timeline</Link>
          </nav>
          <div className="flex flex-wrap items-center justify-center gap-3 text-xs">
            <span className="rounded-full bg-zinc-900/80 px-3 py-1.5 text-zinc-400">{authUser ? "Plan syncing securely across your devices" : "Your plan saves automatically on this device"}</span>
            {authUser ? (
              <button onClick={() => supabase.auth.signOut()} className="rounded-full border border-sky-400/40 px-3 py-1.5 font-semibold text-sky-200">Signed in as {authUser.email} · Sign out</button>
            ) : (
              <button onClick={() => { setAuthOpen(!authOpen); setAuthMessage(""); }} className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1.5 font-semibold text-emerald-200">Create account to sync</button>
            )}
            {(results || weight || weightSt) && <button onClick={resetPlan} className="rounded-full border border-zinc-700 px-3 py-1.5 font-semibold text-zinc-300 hover:border-rose-400 hover:text-rose-200">Start a new plan</button>}
          </div>
          {authOpen && !authUser && (
            <div className="mx-auto max-w-md rounded-2xl border border-emerald-400/20 bg-zinc-900 p-4 text-left shadow-xl">
              <h2 className="text-lg font-bold">Save your plan everywhere</h2>
              <p className="mt-1 text-sm text-zinc-400">Create a free account to keep your plan and weekly check-ins when you switch device.</p>
              <div className="mt-3 space-y-2">
                <input type="email" value={authEmail} onChange={(e) => setAuthEmail(e.target.value)} placeholder="Email address" className="w-full rounded-lg bg-zinc-800 p-3 text-sm" />
                <input type="password" value={authPassword} onChange={(e) => setAuthPassword(e.target.value)} placeholder="Password (8+ characters)" className="w-full rounded-lg bg-zinc-800 p-3 text-sm" />
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleAuth("sign-up")} className="rounded-lg bg-emerald-400 px-3 py-2 font-bold text-zinc-950">Create free account</button>
                  <button onClick={() => handleAuth("sign-in")} className="rounded-lg bg-zinc-700 px-3 py-2 font-bold">Sign in</button>
                </div>
                {authMessage && <p role="status" className="text-xs text-emerald-200">{authMessage}</p>}
              </div>
            </div>
          )}
        </header>
        <section className="grid md:grid-cols-2 gap-5">

          {/* 🔥 INPUTS */}
          <div className="bg-zinc-900 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-400 font-bold text-zinc-950">1</span>
              <h2 className="text-xl font-semibold">Your Stats</h2>
            </div>
            


          <div className="flex justify-between items-center">
<p className="text-sm text-zinc-500">Weight</p>

<select
value={weightUnit}
onChange={(e) => setWeightUnit(e.target.value)}
className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
>
<option value="kg">kg</option>
<option value="st">st / lb</option>
</select>
</div>

            {weightUnit === "kg" ? (

<input
type="number"
min="35"
max="350"
value={weight}
onChange={(e) => setWeight(e.target.value)}
placeholder="Enter your weight (kg)"
className="w-full p-3 bg-zinc-800 rounded placeholder-gray-400"
/>

) : (

<div className="flex gap-2">

<select
value={weightSt}
onChange={(e) => setWeightSt(e.target.value)}
className="w-full p-3 bg-zinc-800 rounded"
>
<option value="">st</option>
{Array.from({ length: 30 }, (_, i) => (
<option key={i+5} value={i+5}>{i+5} st</option>
))}
</select>

<select
value={weightLb}
onChange={(e) => setWeightLb(e.target.value)}
className="w-full p-3 bg-zinc-800 rounded"
>
<option value="">lb</option>
{Array.from({ length: 14 }, (_, i) => (
<option key={i} value={i}>{i} lb</option>
))}
</select>

</div>

)}
            <p className="text-sm text-zinc-500">Body Fat %</p>
            <input
              type="number"
              min="3"
              max="70"
              value={bodyFat}
              onChange={(e) => setBodyFat(e.target.value)}
              placeholder="Enter body fat %"
              className="w-full p-3 bg-zinc-800 rounded placeholder-gray-400"
            />
            <p className="text-sm text-zinc-500">Training Days</p>
            <input
              type="number"
              min="0"
              max="7"
              value={trainingDays}
              onChange={(e) => setTrainingDays(e.target.value)}
              placeholder="Training days per week"
              className="w-full p-3 bg-zinc-800 rounded placeholder-gray-400"


            />
            <p className="text-sm text-zinc-500">Sex</p>
            <select
            value={sex}
            onChange={(e) => setSex(e.target.value)}
            className="w-full p-3 bg-zinc-800 rounded text-gray-400"
            >
            <option value="">Select sex</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            </select>
            <p className="text-sm text-zinc-500">Age</p>
            <input
              type="number"
              min="16"
              max="100"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Enter your age"
              className="w-full p-3 bg-zinc-800 rounded placeholder-gray-400"
            />

            <div className="flex justify-between items-center mt-2">
<p className="text-sm text-zinc-500">Height</p>

<select
value={heightUnit}
onChange={(e) => setHeightUnit(e.target.value)}
className="bg-zinc-800 border border-zinc-700 rounded px-2 py-1 text-xs"
>
<option value="cm">cm</option>
<option value="ft">ft / in</option>
</select>
</div>

            {heightUnit === "cm" ? (

<input
type="number"
min="120"
max="240"
value={height}
onChange={(e) => setHeight(e.target.value)}
placeholder="Enter your height (cm)"
className="w-full p-3 bg-zinc-800 rounded placeholder-gray-400"
/>

) : (

<div className="flex gap-2">

<select
value={heightFt}
onChange={(e) => setHeightFt(e.target.value)}
className="w-full p-3 bg-zinc-800 rounded"
>
<option value="">ft</option>
{Array.from({ length: 8 }, (_, i) => (
<option key={i+3} value={i+3}>{i+3} ft</option>
))}
</select>

<select
value={heightIn}
onChange={(e) => setHeightIn(e.target.value)}
className="w-full p-3 bg-zinc-800 rounded"
>
<option value="">in</option>
{Array.from({ length: 12 }, (_, i) => (
<option key={i} value={i}>{i} in</option>
))}
</select>

</div>

)}

            <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={targetBodyFat}
            onChange={(e) => setTargetBodyFat(e.target.value)}
            placeholder="Target body fat % (e.g. 12)"
            className="w-full p-3 bg-zinc-800 rounded placeholder-gray-400"
            />

            <fieldset>
              <legend className="mb-2 text-sm font-semibold text-zinc-200">Choose your preferred pace</legend>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { value: "slow", label: "Steady", detail: "300 kcal/day" },
                  { value: "moderate", label: "Balanced", detail: "500 kcal/day" },
                  { value: "aggressive", label: "Fast", detail: "700 kcal/day" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    aria-pressed={goalSpeed === option.value}
                    onClick={() => setGoalSpeed(option.value)}
                    className={`rounded-xl border p-3 text-left transition ${goalSpeed === option.value ? "border-emerald-400 bg-emerald-400/10 text-white shadow-[0_0_0_1px_rgba(52,211,153,0.2)]" : "border-zinc-700 bg-zinc-800 text-zinc-300 hover:border-zinc-500"}`}
                  >
                    <span className="block text-sm font-bold">{option.label}</span>
                    <span className="mt-1 block text-[11px] text-zinc-400">{option.detail}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs leading-5 text-zinc-500">Your forecast uses this starting deficit and gives you full control to adjust calories and steps afterwards.</p>
            </fieldset>

<div className="flex items-center justify-between bg-zinc-800 p-3 rounded mt-2">
  <span className="text-sm text-zinc-400">
    Recently started dieting (water weight drop)
  </span>

  <button
    onClick={() => setStartingCut(!startingCut)}
    className={`px-3 py-1 rounded text-xs font-semibold ${
      startingCut ? "bg-green-500 text-black" : "bg-zinc-700 text-white"
    }`}
  >
    {startingCut ? "ON" : "OFF"}
  </button>
</div>

            {validationError && (
              <p role="alert" className="rounded-lg border border-rose-400/30 bg-rose-400/10 px-3 py-2 text-sm text-rose-200">
                {validationError}
              </p>
            )}
            <button
              onClick={calculate}
              className="w-full py-3 bg-green-500 rounded font-bold text-black"
            >
              Calculate
            </button>
          </div>

          {/* 🔥 PLAN (always visible) */}
          <div className="bg-zinc-900 p-5 rounded-2xl space-y-3">
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sky-400 font-bold text-zinc-950">2</span>
              <h2 className="text-xl font-semibold">Your Plan</h2>
            </div>
            <p className="text-sm text-zinc-500">Your personalised targets will appear here.</p>

            {results && (
              <>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-xl bg-zinc-800 p-3"><p className="text-zinc-500">Daily calories</p><p className="text-xl font-bold">{results.suggestedCalories}</p><p className="text-zinc-500">kcal/day</p></div>
                  <div className="rounded-xl bg-zinc-800 p-3"><p className="text-zinc-500">Goal date</p><p className="text-lg font-bold">{goalDate || "--"}</p><p className="text-zinc-500">~{results.weeksToGoal} weeks</p></div>
                </div>
                <div className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 p-3 text-center">
                  <p className="text-xs font-bold uppercase tracking-wider text-emerald-300">{results.pace} pace</p>
                  <p className="mt-1 text-lg font-semibold">{results.weeklyLossKg} kg/week expected</p>
                  <p className="mt-1 text-xs text-zinc-400">A realistic result can vary by around 1–2 weeks due to water weight, adherence, and daily activity.</p>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-sm">
                  <div className="rounded-lg bg-zinc-800 p-2"><p className="font-semibold">{results.proteinTarget}g</p><p className="text-xs text-zinc-500">protein</p></div>
                  <div className="rounded-lg bg-zinc-800 p-2"><p className="font-semibold">{results.fatTarget}g</p><p className="text-xs text-zinc-500">fat</p></div>
                  <div className="rounded-lg bg-zinc-800 p-2"><p className="font-semibold">{results.carbTarget}g</p><p className="text-xs text-zinc-500">carbs</p></div>
                </div>
                <p className="text-center text-xs text-zinc-500">Goal: {results.targetBF}% body fat · {stepTarget} daily steps · maintenance after goal ~{Math.round(results.suggestedCalories + 500)} kcal</p>
              </>
            )}
            {results && !authUser && (
              <div className="rounded-xl border border-sky-400/25 bg-sky-400/10 p-4">
                <p className="font-semibold text-sky-100">Keep this plan when you switch device.</p>
                <p className="mt-1 text-xs leading-5 text-zinc-300">Create a free account to sync your plan, weekly weigh-ins, and forecast across phone and desktop.</p>
                <button onClick={() => { setAuthOpen(true); setAuthMessage(""); trackEvent("account_prompt_opened", { source: "results" }); }} className="mt-3 rounded-lg bg-sky-400 px-3 py-2 text-sm font-bold text-zinc-950">Save my plan for free</button>
              </div>
            )}
            {results && (
          <div className="bg-zinc-900 p-4 rounded-xl mt-4 space-y-3">

          <h3 className="text-lg font-semibold text-center">
          Adjust your diet
          </h3>
          <div className="space-y-3 mt-4">

  <div className="flex justify-between text-sm text-zinc-500">
    <span>Daily steps</span>
    <span className="font-semibold text-white">
      {customSteps || stepTarget} steps
    </span>
  </div>

  <input
    type="range"
    min="3000"
    max="20000"
    step="500"
    value={customSteps || stepTarget || 8000}
    onChange={(e) => setCustomSteps(Number(e.target.value))}
    className="w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
  />

  <div className="flex justify-between text-xs text-zinc-500">
    <span>3k</span>
    <span>20k</span>
  </div>

</div>    
          <div className="space-y-3">

  <div className="flex justify-between text-sm text-zinc-500">
    <span>Calories per day</span>
    <span className="font-semibold text-white">
      {customCalories || results?.suggestedCalories} kcal
    </span>
  </div>

  <input
  type="range"
  min={maintenanceCalories ? maintenanceCalories - 900 : 1500}
  max={maintenanceCalories ? maintenanceCalories - 100 : 2600}
  step="50"
  value={Number(customCalories)}
  onChange={(e) => setCustomCalories(e.target.value)}
  className={`w-full h-2 bg-zinc-700 rounded-lg appearance-none cursor-pointer ${
  sliderColor === "green"
    ? "accent-green-500"
    : sliderColor === "orange"
    ? "accent-orange-500"
    : "accent-red-500"
}`}
/>
{dailyDeficitValue && weeklyLossValue && (
  <div className="text-xs text-zinc-400 mt-2 text-center">
    <p>Daily deficit: {dailyDeficitValue} kcal</p>
    <p>Expected loss: {weeklyLossValue} kg/week</p>
  </div>
)}

  <div className="flex justify-between text-xs text-zinc-500">
    <span>{maintenanceCalories ? maintenanceCalories - 900 : 1500}</span>
    <span>{maintenanceCalories ? maintenanceCalories - 100 : 2600}</span>
  </div>

</div>

          <input
          type="number"
          value={customProtein}
          onChange={(e) => setCustomProtein(e.target.value)}
          placeholder="Protein per day (optional)"
          className="w-full p-3 bg-zinc-800 rounded"
          />
          <div className="bg-zinc-800 p-3 rounded mt-4">

<p className="text-sm text-zinc-400 mb-2">
Describe a change to your routine
</p>

<input
  type="text"
  value={scenarioInput}
  onChange={(e) => setScenarioInput(e.target.value)}
  placeholder="Example: I'll start cycling 4 hours a week"
  className="w-full p-3 bg-zinc-900 rounded"
/>

<button
  onClick={applyScenario}
  className="mt-2 bg-purple-500 px-4 py-2 rounded font-bold"
>
Apply scenario
</button>

{scenarioMessage && (
  <p className="text-xs text-zinc-400 mt-2">{scenarioMessage}</p>
)}

</div>

          

          </div>
          )}
          {results && (
            <div className="mt-4 rounded-xl border border-sky-400/20 bg-sky-400/10 p-4 space-y-3">
              <div>
                <h3 className="font-semibold text-sky-200">Weekly check-in</h3>
                <p className="text-xs text-zinc-400">Enter your 7-day average weight to refresh the remaining forecast.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <label className="text-xs text-zinc-400">Week into plan
                  <input type="number" min="1" max={results.weeksToGoal} value={checkInWeek} onChange={(e) => setCheckInWeek(Number(e.target.value))} className="mt-1 w-full rounded bg-zinc-900 p-2 text-white" />
                </label>
                <label className="text-xs text-zinc-400">7-day average ({weightUnit === "kg" ? "kg" : "lb"})
                  <input type="number" min="35" value={checkInWeight} onChange={(e) => setCheckInWeight(e.target.value)} placeholder={weightUnit === "kg" ? "e.g. 78.4" : "e.g. 173"} className="mt-1 w-full rounded bg-zinc-900 p-2 text-white" />
                </label>
              </div>
              <button onClick={applyCheckIn} className="w-full rounded bg-sky-400 px-4 py-2 text-sm font-bold text-zinc-950">Refresh forecast</button>
              {checkInMessage && <p className="text-xs text-sky-100">{checkInMessage}</p>}
              {progressStatus && (
                <div className={`rounded-lg border p-3 text-center ${progressStatus === "On track" ? "border-emerald-400/30 bg-emerald-400/10" : progressStatus === "Ahead of forecast" ? "border-sky-400/30 bg-sky-400/10" : "border-amber-400/30 bg-amber-400/10"}`}>
                  <p className="text-xs font-bold uppercase tracking-wider">{progressStatus}</p>
                  <p className="mt-1 text-xs text-zinc-300">Latest check-in: {weightUnit === "kg" ? `${latestCheckin?.weight_kg} kg` : `${Math.round((latestCheckin?.weight_kg || 0) * 2.20462)} lb`} at week {latestCheckin?.week_number}</p>
                </div>
              )}
              {checkins.length > 0 && (
                <div className="border-t border-white/10 pt-3">
                  <p className="text-xs font-semibold text-zinc-300">Check-in history {authUser ? "· synced to your account" : "· saved on this device"}</p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    {checkins.slice(-4).map((entry) => (
                      <div key={entry.id} className="rounded bg-zinc-900 p-2 text-zinc-300">Week {entry.week_number}: <span className="font-semibold text-white">{weightUnit === "kg" ? `${entry.weight_kg} kg` : `${Math.round(entry.weight_kg * 2.20462)} lb`}</span></div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </section>
        {milestones.length > 0 && (
        <div className="mt-3 text-sm text-zinc-500">
        <p className="font-semibold text-white">Projected milestones</p>
        {milestones.map((w, i) => {
  const week = Math.round(((i + 1) / milestones.length) * (results?.weeksToGoal || 1));

  let displayWeight = "";

  if (weightUnit === "kg") {
    displayWeight = `${w} kg`;
  } else {
    const totalLb = w * 2.20462;
    const st = Math.floor(totalLb / 14);
    const lb = Math.round(totalLb % 14);

    displayWeight = `${st} st ${lb} lb`;
  }

  return <p key={i}>Week {week}: {displayWeight}</p>;
})}
        </div>
        )}

        {/* 🔥 GRAPH (always visible) */}
        <div className="bg-white text-black p-5 sm:p-7 rounded-2xl w-full shadow-2xl shadow-black/30">
          <p className="text-center text-xs text-gray-500 mb-2">
  Generated with CutForecast.com
</p>
          <div
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
           
            <Line
ref={chartRef}
plugins={[hoverLine]}
options={{
responsive: true,
interaction: {
mode: "index",
intersect: false
},
plugins: {
legend: {
display: true,
position: "top"
},
tooltip: {
callbacks: {
title: (context) => {
const week = context[0].dataIndex + 1;
return `Week ${week}`;
},
label: (context) => {
const weight = Number(context.raw);
const date = context.label;

return [
  `Date: ${date}`,
  `Weight: ${weight} ${weightUnit === "kg" ? "kg" : "lb"}`
];
}
}
}
},
scales: {
y: {
title: {
display: true,
text: weightUnit === "kg" ? "Weight (kg)" : "Weight (lb)"
}
},
x: {
title: {
display: true,
text: "Timeline"
}
}
}
}}
data={{
labels: (results?.trend || emptyTrend).map((_, i) =>
dayjs().add(i, "week").format("MMM D")
),
datasets: [
{
label: "Predicted Weight",
data: (results?.trend || emptyTrend).map((w) =>
  weightUnit === "kg" ? w : parseFloat((w * 2.20462).toFixed(1))
),
borderColor: "red",
tension: 0.4,
pointRadius: 5,
pointHoverRadius: 8,
pointHitRadius: 12,
},

{
label: "Your check-ins",
data: (results?.trend || emptyTrend).map((_, i) => {
  const entry = checkins.find((checkin) => checkin.week_number === i + 1);
  if (!entry) return null;
  return weightUnit === "kg" ? entry.weight_kg : parseFloat((entry.weight_kg * 2.20462).toFixed(1));
}),
borderColor: "#0ea5e9",
backgroundColor: "#0ea5e9",
showLine: false,
pointRadius: 6,
pointHoverRadius: 8,
},

{
label: "Goal Weight",
data: (results?.trend || emptyTrend).map(() =>
  results
    ? weightUnit === "kg"
      ? Number(results.targetWeight)
      : parseFloat((Number(results.targetWeight) * 2.20462).toFixed(1))
    : 0
),
borderColor: "green",
borderDash: [5,5],
pointRadius: 0
},
{
label: "If calorie deficit is increased later",
data: (results?.trend || emptyTrend).map((w, i) => {

  if (!results) return w;

  const plateauWeek = Math.round(results.weeksToGoal * 0.6);

  let value = w;

  if (i >= plateauWeek) {

    const extraDeficit = dailyDeficitValue
      ? dailyDeficitValue * 0.00013
      : 0.05;

    const extraLoss = (i - plateauWeek) * extraDeficit;

    value = w - extraLoss;
  }

  // convert to lb if needed
  return weightUnit === "kg"
    ? parseFloat(value.toFixed(1))
    : parseFloat((value * 2.20462).toFixed(1));

}),
borderColor: "blue",
borderDash: [6,6],
tension: 0.4,
pointRadius: 0
}
]

}}

/>            <p className="text-sm text-gray-600 mt-3 text-center">
            Try dragging the points to simulate cheat days — the rest of the plan will adjust.
            </p>
            <p className="text-xs text-gray-500 text-center mt-2">
            Weight loss often slows due to metabolic adaptation. 
            The blue line shows what may happen if you increase your deficit later in the cut.
            </p>
            {cheatImpact && (
            <p className="text-red-400 text-center mt-2">
            This change may delay your goal by about {cheatImpact} days.
            </p>
            )}
        
        
        </div>
        </div>
        {results && (
  <div className="mt-6 text-center space-y-4">

    <div
  ref={shareCardRef}
  className="relative overflow-hidden border border-emerald-400/20 bg-gradient-to-br from-emerald-950 via-zinc-900 to-sky-950 text-white p-6 rounded-2xl max-w-sm mx-auto shadow-xl"
>
  <p className="text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">My CutForecast plan</p>
  <h3 className="mt-2 text-2xl font-black">Built for the long run.</h3>

  <p className="mt-4 text-sm text-zinc-300">
Start Weight: {weightUnit === "kg"
  ? `${weight} kg`
  : `${weightSt} st ${weightLb} lb`}
</p>

  {results && (
    <>
      <div className="mt-4 grid grid-cols-2 gap-2 text-left text-sm">
        <div className="rounded-lg bg-white/10 p-3"><p className="text-zinc-400">Calories</p><p className="text-lg font-bold">{results.suggestedCalories}</p></div>
        <div className="rounded-lg bg-white/10 p-3"><p className="text-zinc-400">Timeline</p><p className="text-lg font-bold">{results.weeksToGoal} weeks</p></div>
        <div className="rounded-lg bg-white/10 p-3"><p className="text-zinc-400">Protein</p><p className="text-lg font-bold">{results.proteinTarget}g</p></div>
        <div className="rounded-lg bg-white/10 p-3"><p className="text-zinc-400">Goal date</p><p className="text-sm font-bold">{goalDate}</p></div>
      </div>
    </>
  )}

  <p className="text-xs text-zinc-400 mt-2">
    Generated with CutForecast.com
  </p>
</div>

    <div className="flex flex-wrap justify-center gap-2">
      <button onClick={sharePlan} className="rounded-lg bg-emerald-400 px-5 py-2.5 font-bold text-zinc-950">Share my plan</button>
      <button onClick={downloadShareImage} className="rounded-lg bg-sky-500 px-5 py-2.5 font-bold">Download image</button>
    </div>
    <p className="text-xs text-zinc-400">Share a goal, invite a training partner, and start your cut together.</p>
    {shareMessage && <p role="status" className="text-xs text-emerald-300">{shareMessage}</p>}

  </div>
)}
        
        {/* 🔥 SEO */}
        {/* 🔥 SEO */}
<div className="text-zinc-400 text-sm space-y-6 max-w-3xl mx-auto">

  <div>
    <h2 className="text-white text-lg font-semibold">Weight Loss Calculator</h2>
    <p>
      This weight loss calculator estimates how long it will take to reach your
      target body fat based on your calorie deficit, body weight, and training
      frequency. Enter your current stats above to generate a personalised
      fat-loss forecast and timeline.
    </p>
  </div>

  <div>
    <h2 className="text-white text-lg font-semibold">How does the calculator work?</h2>
    <p>
      Fat loss occurs when you consistently maintain a calorie deficit.
      Roughly 7700 calories correspond to one kilogram of body fat. This
      calculator estimates your maintenance calories, predicts your weekly
      weight loss, and generates a realistic timeline to reach your goal.
    </p>
  </div>

  <div>
    <h2 className="text-white text-lg font-semibold">How fast can you lose weight safely?</h2>
    <p>
      Most people can safely lose around 0.5–1% of their body weight per week.
      Faster weight loss can increase the risk of muscle loss and metabolic
      slowdown. A moderate calorie deficit combined with resistance training
      usually produces the best long-term results.
    </p>
  </div>

  <div>
    <h2 className="text-white text-lg font-semibold">Is this weight loss calculator accurate?</h2>
    <p>
      This calculator provides an estimate based on metabolic formulas and
      typical fat-loss patterns. Real results may vary depending on diet
      adherence, sleep, stress, and training intensity.
    </p>
  </div>

</div>
<div className="mt-6 text-center space-y-2">
  <h3 className="text-white font-semibold">Popular fat loss timelines</h3>

  <a href="/how-long-to-lose/5kg" className="block text-green-400">
    How long to lose 5kg
  </a>

  <a href="/how-long-to-lose/10kg" className="block text-green-400">
    How long to lose 10kg
  </a>

  <a href="/how-long-to-lose/15kg" className="block text-green-400">
    How long to lose 15kg
  </a>

  <a href="/how-long-to-lose/20kg" className="block text-green-400">
    How long to lose 20kg
  </a>
</div>

        {/* 🔥 FOOTER */}
        <div className="text-center text-xs text-zinc-500 mt-10">
          <a href="/privacy" className="mr-4">Privacy Policy</a>
          <a href="/terms">Terms of Service</a>
        </div>

      </div>
    </main>
  );
}
