"use client";

import { useEffect } from "react";

const basePath = process.env.NEXT_PUBLIC_GITHUB_PAGES_BASE?.replace(/\/$/, "") ?? "";

export function GitHubPagesNavigation() {
  useEffect(() => {
    if (!basePath) return;
    const navigate = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const link = target.closest<HTMLAnchorElement>('a[href^="/"]');
      const href = link?.getAttribute("href");
      if (!link || !href || href.startsWith(`${basePath}/`) || link.target) return;
      event.preventDefault();
      window.location.assign(`${basePath}${href}`);
    };
    document.addEventListener("click", navigate);
    return () => document.removeEventListener("click", navigate);
  }, []);
  return null;
}
