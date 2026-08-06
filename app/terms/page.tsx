import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Use",
  description: "Terms for using CutForecast's fitness-planning tools.",
};

export default function Terms() {
  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-3xl space-y-6 leading-7 text-zinc-300">
        <h1 className="text-3xl font-bold text-white">Terms of Use</h1>
        <p>CutForecast provides general fitness-planning tools for informational purposes. It does not provide medical, nutritional, or professional healthcare advice.</p>
        <p>Calculator outputs are estimates and may differ from real outcomes. Before making material changes to diet, training, or health treatment, consider advice from a qualified professional.</p>
        <p>You are responsible for the information you enter and for how you use the results. Do not use CutForecast where an estimate could replace professional medical care.</p>
        <p>We may update the site and these terms as the product develops.</p>
      </div>
    </main>
  );
}
