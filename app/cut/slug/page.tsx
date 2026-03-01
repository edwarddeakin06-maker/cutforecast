type Props = {
  params?: { slug?: string };
};

export default function CutPage({ params }: Props) {
  const slug = params?.slug || "";

  const match = slug.match(/(\d+)kg-to-(\d+)kg/);

  if (!match) {
    return <div>Invalid page</div>;
  }

  const start = parseInt(match[1]);
  const end = parseInt(match[2]);
  const diff = start - end;

  return (
    <div style={{ padding: "20px" }}>
      <h1>
        How long to go from {start}kg to {end}kg
      </h1>

      <p>Losing {diff}kg typically takes:</p>

      <ul>
        <li>At 0.5kg/week → {Math.round(diff / 0.5)} weeks</li>
        <li>At 1kg/week → {Math.round(diff / 1)} weeks</li>
      </ul>

      <p>
        Progress usually slows down as you get leaner, so expect the later stages to take longer.
      </p>

      <p>
        Use the calculator below to get a more accurate timeline:
      </p>
    </div>
  );
}