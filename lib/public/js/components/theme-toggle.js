import { h } from "preact";
import { useState } from "preact/hooks";
import htm from "htm";
import { MoonIcon, SunIcon } from "./icons.js";
import { kThemeStorageKey } from "../lib/storage-keys.js";

const html = htm.bind(h);

const getTheme = () => {
  try {
    const saved = localStorage.getItem(kThemeStorageKey);
    if (saved) return saved;
  } catch {}
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem(kThemeStorageKey, theme); } catch {}
};

export const ThemeToggle = () => {
  const [theme, setThemeState] = useState(getTheme);

  const toggle = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    setThemeState(next);
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
