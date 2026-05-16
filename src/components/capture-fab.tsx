import Link from "next/link";

export function CaptureFAB() {
  return (
    <Link
      href="/capture"
      aria-label="New observation"
      style={{
        position: "fixed",
        bottom: 32,
        right: 32,
        width: 56,
        height: 56,
        borderRadius: 9999,
        background: "var(--accent)",
        color: "#0a0909",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
        zIndex: 50,
        textDecoration: "none",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      >
        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2M12 19v4M8 23h8" />
      </svg>
    </Link>
  );
}
