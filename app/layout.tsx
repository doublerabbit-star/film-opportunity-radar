import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Film Opportunity Radar — Morning Briefing",
  description: "A daily editorial briefing of ranked film-industry opportunities for creators.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
