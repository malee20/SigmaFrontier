export const metadata = {
  title: "SigmaFrontier — Portfolio Sharpe Ratio Calculator",
  description:
    "Free portfolio analytics for amateur investors.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        fontFamily: "DM Sans, sans-serif",
        background: "linear-gradient(170deg, #0a0e1a 0%, #0f1729 40%, #111827 100%)",
        color: "#e2e8f0",
        minHeight: "100vh",
      }}>
        {children}
      </body>
    </html>
  );
}
