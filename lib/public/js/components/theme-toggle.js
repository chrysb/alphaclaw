import { h } from "https://esm.sh/preact";
import { useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";

const html = htm.bind(h);

const SunIcon = ({ className = "" }) => html`
  <svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
`;

const MoonIcon = ({ className = "" }) => html`
  <svg class=${className} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
`;

const getTheme = () => {
  try { return localStorage.getItem("ac-theme") || "dark"; } catch { return "dark"; }
};

const setTheme = (theme) => {
  document.documentElement.dataset.theme = theme;
  try { localStorage.setItem("ac-theme", theme); } catch {}
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
