export default function ProbePage() {
  return (
    <main style={{ minHeight: "100vh", padding: "4rem 2rem" }}>
      <h1 className="font-display" style={{ fontSize: "2.5rem", fontWeight: 500 }}>
        James Anderson
      </h1>
      <p style={{ color: "var(--text-secondary)", marginTop: "0.5rem" }}>
        Tokens probe. Background warm-black. Display font Cormorant.
      </p>
      <p
        className="font-mono"
        style={{
          color: "var(--text-tertiary)",
          marginTop: "1rem",
          fontSize: "0.8125rem",
        }}
      >
        CX 839 - On Time - Car ETA 2:15 PM
      </p>
      <div
        style={{
          marginTop: "2rem",
          padding: "1rem",
          background: "var(--card)",
          border: "1px solid var(--border)",
          borderLeft: "2px solid var(--accent)",
          borderRadius: "0.375rem",
          maxWidth: 480,
        }}
      >
        <p>Card surface, hairline border, gold left accent.</p>
      </div>
    </main>
  );
}
