export const dynamic = "force-dynamic";

export default function Page({ params }: any) {
  const slug = params?.slug;

  if (!slug) {
    return <div style={{ padding: "20px" }}>No slug</div>;
  }

  const parts = slug.split("-to-");

  if (parts.length !== 2) {
    return <div style={{ padding: "20px" }}>Invalid page</div>;
  }

  const start = parseInt(parts[0].replace("kg", ""));
  const end = parseInt(parts[1].replace("kg", ""));

  if (isNaN(start) || isNaN(end) || start <= end) {
    return <div style={{ padding: "20px" }}>Invalid page</div>;
  }

  const diff = start - end;

  return (
    <div style={{ padding: "20px", maxWidth: "700px", margin: "0 auto" }}>
      <h1>How long to go from {start}kg to {end}kg</h1>

      <p>Losing {diff}kg typically takes:</p>

      <ul>
        <li>At 0.5kg/week → ~{Math.round(diff / 0.5)} weeks</li>
        <li>At 1kg/week → ~{Math.round(diff / 1)} weeks</li>
      </ul>
    </div>
  );
}