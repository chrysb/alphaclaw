import { h } from 'preact';
import { useState, useEffect } from 'preact/hooks';
import { createPortal } from 'preact/compat';
import htm from 'htm';
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
  success: "bg-status-success-bg border border-status-success-border text-status-success",
  error: "bg-status-error-bg border border-status-error-border text-status-error",
  warning: "bg-status-warning-bg border border-status-warning-border text-status-warning",
  info: "bg-status-info-bg border border-status-info-border text-status-info",
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
