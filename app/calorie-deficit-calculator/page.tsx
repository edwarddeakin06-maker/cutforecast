import type { Metadata } from "next";
import Calculator from "../page";

export const metadata: Metadata = {
  title: "Calorie Deficit Calculator | CutForecast",
  description: "Calculate a practical calorie deficit, macro targets, and a realistic fat-loss timeline for your cut.",
};

export default function CalorieDeficitCalculatorPage() {
  return <Calculator />;
}
