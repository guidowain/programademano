export default function Home() {
  return (
    <main
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        background:
          "linear-gradient(135deg, #F504FF 0%, #FE8B97 28%, #FE796D 50%, #FCC028 75%, #FED791 100%)",
        color: "#000",
        fontFamily:
          "Archivo, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      }}
    >
      <section
        aria-label="Programa de Mano es un servicio de Drama"
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 18,
          textAlign: "center",
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: "clamp(18px, 3vw, 28px)",
            fontWeight: 800,
            letterSpacing: 0,
            textTransform: "uppercase",
          }}
        >
          Un servicio de
        </p>
        <a
          href="https://www.drama.com.ar"
          aria-label="Ir a Drama"
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            lineHeight: 0,
          }}
        >
          <img
            src="/logos/Logo ByN.png"
            alt="Drama"
            width={1609}
            height={625}
            style={{
              display: "block",
              width: "min(72vw, 420px)",
              height: "auto",
            }}
          />
        </a>
      </section>
    </main>
  );
}
