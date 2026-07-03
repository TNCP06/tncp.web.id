import Link from "next/link";

export default function NotFound() {
  return (
    <main
      className="wrap"
      style={{
        paddingBlock: "8rem 10rem",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div className="panel error-container">
        {/* Left Side: Status Code */}
        <div className="error-code">404</div>

        {/* Vertical Divider Line */}
        <div className="error-divider" />

        {/* Right Side: details and link */}
        <div className="error-details">
          <h1
            className="name"
            style={{
              fontSize: "clamp(1.8rem, 4vw, 2.25rem)",
              margin: 0,
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          >
            Page not found
          </h1>
          <p
            style={{
              fontSize: "0.95rem",
              color: "var(--ink-muted)",
              margin: 0,
              lineHeight: "1.6",
              maxWidth: "38ch",
            }}
          >
            The page you requested doesn't exist, has been removed, or the coordinate was shifted.
          </p>
          <div style={{ marginTop: "0.5rem" }}>
            <Link href="/" className="btn btn-primary" style={{ padding: "0.75rem 1.5rem" }}>
              Back to Homepage
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
