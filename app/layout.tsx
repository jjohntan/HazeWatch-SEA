import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const viewport: Viewport = {
  themeColor: "#090d16",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "HazeWatch SEA — Live Southeast Asia Haze Intelligence Platform",
  description:
    "Real-time transboundary haze and air quality monitoring platform for Malaysia and Southeast Asia. Features satellite-detected NASA fire hotspots, live wind flow streamlines, and 48-hour predictive forecasts.",
  keywords: [
    "Haze",
    "Air Quality",
    "AQI",
    "PM2.5",
    "Malaysia",
    "Southeast Asia",
    "NASA FIRMS",
    "Hotspots",
    "Wind Particles",
    "ASMC",
    "Meteorology",
  ],
  authors: [{ name: "HazeWatch SEA Engineering" }],
  openGraph: {
    title: "HazeWatch SEA — Live Southeast Asia Haze Intelligence",
    description:
      "Interactive map platform with real-time air quality, satellite thermal fire anomalies, and 48-hour forecasting for Southeast Asia.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-background text-foreground min-h-screen flex flex-col antialiased selection:bg-cyan-500/30 selection:text-cyan-200`}>
        {children}
      </body>
    </html>
  );
}
