import type { Metadata } from "next";
import "./globals.css";
export const metadata: Metadata = {
  title: "Pickle Master | Court Booking",
  description: "Book your pickleball court at Pickle Master.",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}