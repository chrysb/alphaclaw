import { h } from 'https://esm.sh/preact';
import { useState, useEffect } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
const html = htm.bind(h);

let toastId = 0;
let addToastFn = null;

export function showToast(text, color) {
  if (addToastFn) addToastFn({ id: ++toastId, text, color });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    addToastFn = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), 4000);
    };
    return () => { addToastFn = null; };
  }, []);

  return html`<div class="fixed top-4 right-4 z-50 space-y-2">
    ${toasts.map(t => html`
      <div key=${t.id} class="bg-${t.color}-500/20 border border-${t.color}-500/30 text-${t.color}-400 px-4 py-2 rounded-lg text-sm">
        ${t.text}
      </div>
    `)}
  </div>`;
}
