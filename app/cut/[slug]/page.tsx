import type { Metadata } from "next";
import Calculator from "../../page";

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const title = slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
  return {
    title: `${title} Cut Calculator | CutForecast`,
    description: `Build a personalised ${title.toLowerCase()} cutting plan with calories, macros, and a realistic timeline.`,
  };
}

export default function CutPage() {
  return <Calculator />;
}
