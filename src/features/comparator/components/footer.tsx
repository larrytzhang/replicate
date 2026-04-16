"use client";

import { Github, Linkedin, Mail, Check } from "lucide-react";
import { useState } from "react";

const EMAIL = "larry_zhang@college.harvard.edu";

const EXTERNAL_LINKS = [
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
] as const;

export function Footer() {
  const [copied, setCopied] = useState(false);

  // Copy email on click so users without a mail client still get the address.
  // Keeps the mailto href so users who have one still get their composer opened.
  const onEmailClick = () => {
    navigator.clipboard?.writeText(EMAIL).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <footer className="mt-12 border-t border-zinc-200 pt-6 pb-4 dark:border-zinc-800">
      <div className="flex flex-col items-center gap-3 text-sm text-zinc-500 sm:flex-row sm:justify-between dark:text-zinc-400">
        <p>Built by Larry Zhang</p>
        <nav aria-label="Contact links" className="flex items-center gap-5">
          {EXTERNAL_LINKS.map(({ label, href, icon: Icon }) => (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
            >
              <Icon size={14} aria-hidden="true" />
              {label}
            </a>
          ))}
          <a
            href={`mailto:${EMAIL}`}
            onClick={onEmailClick}
            title={copied ? "Copied to clipboard" : `Copy ${EMAIL}`}
            className="flex items-center gap-1.5 transition-colors hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            {copied ? (
              <Check size={14} aria-hidden="true" />
            ) : (
              <Mail size={14} aria-hidden="true" />
            )}
            {copied ? "Copied!" : "Email"}
          </a>
        </nav>
      </div>
    </footer>
  );
}
