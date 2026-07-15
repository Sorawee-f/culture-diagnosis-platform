import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Culture Diagnosis Platform",
  description: "Scenario-based culture assessment platform",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
