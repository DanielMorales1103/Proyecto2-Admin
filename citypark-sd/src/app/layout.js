import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "CityPark Service Desk",
  description: "Fase 2 - Service Desk demo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'Inter, system-ui, Arial', background: '#0b1220', color: '#e6edf3' }}>
        <div style={{ maxWidth: 1050, margin: '32px auto', padding: '0 16px' }}>
          <header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h1 style={{ fontSize: 28, fontWeight: 700 }}>CityPark Service Desk</h1>
            <nav style={{ opacity: .8 }}>Fase 2 · Demo</nav>
          </header>
          <hr style={{ borderColor: '#1f2a44', margin: '16px 0' }} />
          {children}
        </div>
      </body>
    </html>
  );
}
