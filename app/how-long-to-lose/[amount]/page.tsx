import type { Metadata } from "next";
import Calculator from "../../page";

type PageProps = { params: Promise<{ amount: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { amount } = await params;
  return {
    title: `How Long To Lose ${amount}? | CutForecast`,
    description: `Estimate a realistic timeline and daily calorie target for losing ${amount}.`,
  };
}

export default function AmountPage() {
  return <Calculator />;
}
