import type { Metadata } from "next";
import { WeightLossTimelineCalculator } from "../tool-calculators";

export const metadata: Metadata = {
  title: "How Long Does It Take To Lose Weight? | CutForecast",
  description: "Build a personalised fat-loss plan and estimate how long your weight-loss goal could take.",
};

export default function HowLongToLoseWeightPage() {
  return <WeightLossTimelineCalculator />;
}
