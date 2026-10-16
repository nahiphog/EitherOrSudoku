import type { Metadata } from "next";
import "./globals.css";
import { GitHubPagesNavigation } from "./github-pages-navigation";

export const metadata: Metadata = {
  title: "Either Or Sudoku",
  description: "Generate and solve Either Or Sudoku puzzles.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased"><GitHubPagesNavigation />{children}</body>
    </html>
  );
}
