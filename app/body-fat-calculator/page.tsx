import type { Metadata } from "next";
import Calculator from "../page";

export const metadata: Metadata = {
  title: "Body Fat Calculator | CutForecast",
  description: "Estimate your target weight, calorie target, macros, and timeline for reaching your goal body-fat percentage.",
};

export default function BodyFatCalculatorPage() {
  return <Calculator />;
}
