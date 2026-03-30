import { h } from "preact";
import { useState } from "preact/hooks";
import htm from "htm";
import { MoonIcon, SunIcon } from "./icons.js";
import { kThemeStorageKey } from "../lib/storage-keys.js";

const html = htm.bind(h);

/** Resolve the current effective theme. If no preference saved, follow OS. */
const getEffectiveTheme = () => {
  try {
    const saved = localStorage.getItem(kThemeStorageKey);
    if (saved === "dark" || saved === "light") return saved;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

const applyTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(kThemeStorageKey, theme); } catch {}
};

export const ThemeToggle = () => {
  const [theme, setTheme] = useState(getEffectiveTheme);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  };

  return html`
    <button
      type="button"
      onclick=${toggle}
      title=${theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
      aria-label="Toggle theme"
      class="inline-flex items-center justify-center w-6 h-6 rounded-md transition-colors"
      style=${{
        background: "transparent",
        border: "none",
        color: "var(--text-dim)",
        cursor: "pointer",
      }}
      onmouseenter=${(e) => { e.currentTarget.style.color = "var(--text-muted)"; e.currentTarget.style.background = "var(--bg-hover)"; }}
      onmouseleave=${(e) => { e.currentTarget.style.color = "var(--text-dim)"; e.currentTarget.style.background = "transparent"; }}
    >
      ${theme === "dark"
        ? html`<${SunIcon} className="w-3.5 h-3.5" />`
        : html`<${MoonIcon} className="w-3.5 h-3.5" />`}
    </button>
  `;
};
