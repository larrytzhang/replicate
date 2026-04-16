"use client";

import { Github, Linkedin, Mail } from "lucide-react";

const LINKS = [
  {
    label: "GitHub",
    href: "https://github.com/larrytzhang",
    icon: Github,
  },
  {
    label: "LinkedIn",
    href: "https://www.linkedin.com/in/larry-zhang-697636370",
    icon: Linkedin,
  },
  {
    label: "Email",
    href: "mailto:larry_zhang@college.harvard.edu",
    icon: Mail,
  },
] as const;

export function Footer() {
  return (
    <footer className="mt-12 border-t border-zinc-200 pt-6 pb-4 dark:border-zinc-800">
      <div className="flex flex-col items-center gap-3 text-sm text-zinc-500 sm:flex-row sm:justify-between dark:text-zinc-400">
        <p>Built by Larry Zhang</p>
        <nav aria-label="Contact links" className="flex items-center gap-5">
          {LINKS.map(({ label, href, icon: Icon }) => {
            const external = href.startsWith("http");
            return (
              <a
                key={label}
                href={href}
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
                className="flex items-center gap-1.5 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
              >
                <Icon size={14} aria-hidden="true" />
                {label}
              </a>
            );
          })}
        </nav>
      </div>
    </footer>
  );
}
