import { h } from 'https://esm.sh/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import { createPortal } from 'https://esm.sh/preact/compat';
import htm from 'https://esm.sh/htm';
const html = htm.bind(h);

let toastId = 0;
let addToastFn = null;

const kToastTypeByAlias = {
  success: "success",
  error: "error",
  warning: "warning",
  info: "info",
  green: "success",
  red: "error",
  yellow: "warning",
  blue: "info",
};

const kToastClassByType = {
  success: "bg-green-950/95 border border-green-700/80 text-green-200",
  error: "bg-red-950/95 border border-red-700/80 text-red-200",
  warning: "bg-yellow-950/95 border border-yellow-700/80 text-yellow-100",
  info: "bg-cyan-950/95 border border-cyan-700/80 text-cyan-100",
};

const normalizeToastType = (type) => {
  const normalized = String(type || "")
    .trim()
    .toLowerCase();
  return kToastTypeByAlias[normalized] || "info";
};

export function showToast(text, type = "info") {
  if (addToastFn) addToastFn({ id: ++toastId, text, type: normalizeToastType(type) });
}

export function ToastContainer({
  className = "fixed bottom-4 right-4 z-50 space-y-2",
}) {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  if (toasts.length === 0) return null;

  return createPortal(
    html`<div class=${className} style=${{ zIndex: 70 }}>
      ${toasts.map(t => html`
        <div key=${t.id} class="${kToastClassByType[normalizeToastType(t.type)]} px-4 py-2 rounded-lg text-sm">
          ${t.text}
        </div>
      `)}
    </div>`,
    document.body,
  );
}
