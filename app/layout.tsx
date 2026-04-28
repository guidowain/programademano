export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html>
      <body style={{ margin: 0, background: "#2b2b2b" }}>{children}</body>
    </html>
  );
}
