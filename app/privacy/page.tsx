import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: "How CutForecast handles calculator data and optional account information.",
};

export default function Privacy() {
  return (
    <main className="min-h-screen bg-zinc-950 p-6 text-white">
      <div className="mx-auto max-w-3xl space-y-6 leading-7 text-zinc-300">
        <h1 className="text-3xl font-bold text-white">Privacy Policy</h1>
        <p>CutForecast provides calorie, macro, and weight-trend estimates for general fitness information. It is not medical advice.</p>
        <section><h2 className="text-xl font-semibold text-white">Information you provide</h2><p>Without an account, calculator entries are saved only in your browser on that device. If you create an account, we store your email address and the plan and check-in data you choose to save so you can access them across devices.</p></section>
        <section><h2 className="text-xl font-semibold text-white">How we use information</h2><p>We use saved plan data only to provide the CutForecast account and progress-tracking features. We do not sell personal information.</p></section>
        <section><h2 className="text-xl font-semibold text-white">Analytics and advertising</h2><p>We use analytics and may use advertising services such as Google AdSense. These services may use cookies or similar technologies under their own policies.</p></section>
        <section><h2 className="text-xl font-semibold text-white">Your choices</h2><p>You can clear local calculator data with “Start a new plan.” To request account-data deletion, contact CutForecast through the site owner.</p></section>
      </div>
    </main>
  );
}
