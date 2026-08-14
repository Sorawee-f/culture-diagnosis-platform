import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Thairath Group Culture Diagnosis",
  description: "Culture Diagnosis Survey for Thairath Group",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
