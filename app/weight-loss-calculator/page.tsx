import type { Metadata } from "next";
import Calculator from "../page";

export const metadata: Metadata = {
  title: "Weight Loss Calculator | CutForecast",
  description: "Get a calorie target, macro split, goal date, and realistic weight-loss forecast tailored to your cut.",
};

export default function WeightLossCalculatorPage() {
  return <Calculator />;
}
