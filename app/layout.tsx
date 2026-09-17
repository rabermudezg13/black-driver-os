import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Black Driver OS",
  description: "Performance intelligence for premium drivers",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}