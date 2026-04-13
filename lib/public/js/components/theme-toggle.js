import { h } from "preact";
import { useEffect, useRef, useState } from "preact/hooks";
import htm from "htm";
import { ComputerLineIcon, MoonIcon, SunIcon } from "./icons.js";
import { kThemeStorageKey } from "../lib/storage-keys.js";

const html = htm.bind(h);

const kOptions = [
  { id: "dark", label: "Dark", Icon: MoonIcon },
  { id: "light", label: "Light", Icon: SunIcon },
  { id: "system", label: "System", Icon: ComputerLineIcon },
];

/** Map a preference to the icon component shown on the trigger button. */
const kPrefIcon = { dark: MoonIcon, light: SunIcon, system: ComputerLineIcon };

/** Resolve a preference string to an effective "dark" | "light" value. */
const resolveEffective = (pref) => {
  if (pref === "dark" || pref === "light") return pref;
  try {
    return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
  } catch {
    return "dark";
  }
};

/** Read the stored preference. Falls back to "dark" (not OS). */
const readPreference = () => {
  try {
    const saved = localStorage.getItem(kThemeStorageKey);
    if (saved === "dark" || saved === "light" || saved === "system") return saved;
  } catch {}
  return "dark";
};

const applyEffective = (effective) => {
  document.documentElement.dataset.theme = effective;
};

const savePreference = (pref) => {
  try { localStorage.setItem(kThemeStorageKey, pref); } catch {}
};

export const ThemeToggle = () => {
  const [pref, setPref] = useState(readPreference);
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Apply effective theme whenever preference changes (and listen for OS changes when "system").
  useEffect(() => {
    applyEffective(resolveEffective(pref));

    if (pref !== "system") return;

    const mql = window.matchMedia("(prefers-color-scheme: light)");
    const onChange = () => applyEffective(resolveEffective("system"));
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, [pref]);

  // Close dropdown on outside click.
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    };
    window.addEventListener("click", handler, true);
    return () => window.removeEventListener("click", handler, true);
  }, [open]);

  const select = (id) => {
    setPref(id);
    savePreference(id);
    applyEffective(resolveEffective(id));
    setOpen(false);
  };

  const TriggerIcon = kPrefIcon[pref] || MoonIcon;

  return html`
    <div
      ref=${menuRef}
      class="theme-toggle-menu"
    >
      <button
        type="button"
        onclick=${() => setOpen((o) => !o)}
        title="Theme"
        aria-label="Toggle theme"
        aria-expanded=${open}
        class="theme-toggle-trigger"
      >
        <${TriggerIcon} className="w-3.5 h-3.5" />
      </button>
      ${open && html`
        <div class="theme-toggle-dropdown">
          ${kOptions.map(({ id, label, Icon }) => html`
            <button
              key=${id}
              type="button"
              class="theme-toggle-option ${pref === id ? "active" : ""}"
              onclick=${() => select(id)}
            >
              <${Icon} className="w-3.5 h-3.5" />
              <span>${label}</span>
            </button>
          `)}
        </div>
      `}
    </div>
  `;
};
