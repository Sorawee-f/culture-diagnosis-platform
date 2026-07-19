import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Culture Survey Pilot Platform",
  description: "Compare scenario-based and simplified culture surveys",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
