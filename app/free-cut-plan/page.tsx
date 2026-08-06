import type { Metadata } from "next";
import Calculator from "../page";

export const metadata: Metadata = {
  title: "Build Your Free Cut Plan | CutForecast",
  description: "Create a realistic calorie, protein, step, and timeline forecast for your next cut. Free to use, with no card required.",
  alternates: { canonical: "/free-cut-plan" },
  openGraph: {
    title: "Build Your Free Cut Plan | CutForecast",
    description: "Create a realistic calorie, protein, step, and timeline forecast for your next cut.",
  },
};

export default function FreeCutPlanPage() {
  return (
    <>
      <section className="bg-zinc-950 px-4 pb-10 pt-12 text-white sm:px-8 sm:pb-14 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <p className="inline-flex rounded-full border border-emerald-400/30 bg-emerald-400/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-emerald-300">Free personalised cutting plan</p>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl font-black tracking-tight sm:text-6xl">Turn your goal into a plan you can follow.</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-300">Get a practical calorie target, protein goal, daily steps, and an estimated timeline based on your starting point and preferred pace.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3 text-sm font-semibold">
            <a href="#calculator" className="rounded-xl bg-emerald-400 px-5 py-3 text-zinc-950 transition hover:bg-emerald-300">Build my free plan</a>
            <span className="rounded-xl border border-zinc-700 px-5 py-3 text-zinc-300">No card required · Saves on this device</span>
          </div>
          <div className="mx-auto mt-10 grid max-w-3xl gap-3 text-left sm:grid-cols-3">
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5"><p className="text-sm font-bold text-emerald-300">1. Set a goal</p><p className="mt-2 text-sm leading-6 text-zinc-400">Add your current stats and choose a pace that feels realistic.</p></div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5"><p className="text-sm font-bold text-emerald-300">2. Get clear targets</p><p className="mt-2 text-sm leading-6 text-zinc-400">See daily calories, macros, steps, and an estimated goal date.</p></div>
            <div className="rounded-2xl border border-white/10 bg-zinc-900 p-5"><p className="text-sm font-bold text-emerald-300">3. Track the trend</p><p className="mt-2 text-sm leading-6 text-zinc-400">Use weekly check-ins to keep the forecast in line with real progress.</p></div>
          </div>
          <p className="mx-auto mt-6 max-w-2xl text-xs leading-5 text-zinc-500">CutForecast provides an estimate for planning purposes, not medical advice. Results vary with adherence, recovery, activity, and normal changes in body weight.</p>
        </div>
      </section>
      <section id="calculator">
        <Calculator embedded />
      </section>
    </>
  );
}
