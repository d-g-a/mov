import "./globals.css";

// Shown for URLs outside the /fr, /en, /es pages (the locale layout isn't used there).
export default function NotFound() {
  return (
    <html lang="fr">
      <body style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
        <a href="/" style={{ color: "inherit", letterSpacing: "0.08em" }}>
          LAMOVIDA
        </a>
      </body>
    </html>
  );
}
