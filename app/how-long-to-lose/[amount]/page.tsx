import type { Metadata } from "next";
import Calculator from "../../page";

type PageProps = { params: Promise<{ amount: string }> };

export function generateStaticParams() {
  return ["5kg", "10kg", "15kg", "20kg"].map((amount) => ({ amount }));
}

const faqs = [
  {
    question: "How quickly can I safely lose weight?",
    answer: "A sustainable pace is often around 0.5% to 1% of body weight per week. The right pace depends on your current body fat, training, recovery, and how well you can maintain the plan.",
  },
  {
    question: "How accurate is a weight-loss timeline?",
    answer: "A calculator provides an estimate, not a guarantee. Water retention, daily activity, food tracking accuracy, and adherence can all move the scale. Use weekly average weights to judge real progress.",
  },
  {
    question: "What should I do if progress slows?",
    answer: "Check your weekly average, calorie tracking, step count, sleep, and training consistency before making changes. Small, measured adjustments are usually more sustainable than a large calorie cut.",
  },
];

function formatAmount(amount: string) {
  return amount.replace(/-/g, " ").replace(/(\d+)(kg|lb)/i, "$1 $2");
}

function amountInKg(amount: string) {
  const match = amount.match(/^(\d+(?:\.\d+)?)(kg|lb)$/i);
  if (!match) return undefined;
  const value = Number(match[1]);
  return match[2].toLowerCase() === "lb" ? Number((value * 0.453592).toFixed(1)) : value;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { amount } = await params;
  const formattedAmount = formatAmount(amount);
  return {
    title: `How Long Does It Take To Lose ${formattedAmount}?`,
    description: `Estimate a realistic timeline, calories, and macros for losing ${formattedAmount} with CutForecast.`,
    alternates: { canonical: `/how-long-to-lose/${amount}` },
    openGraph: {
      title: `How Long Does It Take To Lose ${formattedAmount}?`,
      description: `Build a personalised plan for losing ${formattedAmount}.`,
    },
  };
}

export default async function AmountPage({ params }: PageProps) {
  const { amount } = await params;
  const formattedAmount = formatAmount(amount);
  const goalAmountKg = amountInKg(amount);
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: { "@type": "Answer", text: faq.answer },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <section className="bg-zinc-950 px-4 pt-10 text-white sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-3xl text-center">
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-300">Fat-loss timeline guide</p>
          <h1 className="mt-3 text-4xl font-black tracking-tight sm:text-5xl">How long does it take to lose {formattedAmount}?</h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-zinc-300">Use the calculator below to turn your goal into a realistic calorie target, macro plan, expected weekly rate, and estimated goal date.</p>
          <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-4"><p className="text-sm font-semibold text-emerald-300">1. Enter your starting point</p><p className="mt-1 text-sm text-zinc-400">Weight, height, age, training, and body-fat estimate.</p></div>
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-4"><p className="text-sm font-semibold text-emerald-300">2. Choose a pace</p><p className="mt-1 text-sm text-zinc-400">Select a rate you can realistically sustain.</p></div>
            <div className="rounded-xl border border-white/10 bg-zinc-900 p-4"><p className="text-sm font-semibold text-emerald-300">3. Track the trend</p><p className="mt-1 text-sm text-zinc-400">Use weekly averages to keep the forecast honest.</p></div>
          </div>
        </div>
      </section>
      <Calculator embedded goalAmountKg={goalAmountKg} />
      <section className="bg-zinc-950 px-4 pb-16 text-white sm:px-8">
        <div className="mx-auto max-w-3xl rounded-2xl border border-white/10 bg-zinc-900 p-6">
          <h2 className="text-2xl font-bold">Common questions about losing {formattedAmount}</h2>
          <div className="mt-5 space-y-5">
            {faqs.map((faq) => <div key={faq.question}><h3 className="font-semibold">{faq.question}</h3><p className="mt-1 leading-7 text-zinc-400">{faq.answer}</p></div>)}
          </div>
        </div>
      </section>
    </>
  );
}
