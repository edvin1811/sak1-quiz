import "../styles/globals.css";
import type { ReactNode } from "react";

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="sv">
      <body>
        <div className="container">
          <header className="header">
            <h1>SAK1 – Quiz</h1>
            <p>Välj ett alternativ per fråga. Inga rätta svar visas.</p>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}

