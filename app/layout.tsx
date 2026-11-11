import type { Metadata } from "next";
import "./globals.css";
import { GitHubPagesNavigation } from "./github-pages-navigation";
import type { CSSProperties } from "react";

const logoUrl = `${process.env.NEXT_PUBLIC_GITHUB_PAGES_BASE || ""}/either-or-logo.svg`;

export const metadata: Metadata = {
  title: "Either Or Sudoku",
  description: "Generate and solve Either Or Sudoku puzzles.",
  icons: {
    icon: { url: logoUrl, type: "image/svg+xml" },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased" style={{ "--brand-logo": `url("${logoUrl}")` } as CSSProperties}><GitHubPagesNavigation />{children}</body>
    </html>
  );
}
