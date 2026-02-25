import { h } from 'https://esm.sh/preact';
import { useState } from 'https://esm.sh/preact/hooks';
import htm from 'https://esm.sh/htm';
const html = htm.bind(h);

export const SERVICES = [
  { key: 'gmail', icon: '📧', label: 'Gmail', defaultRead: true, defaultWrite: false },
  { key: 'calendar', icon: '📅', label: 'Calendar', defaultRead: true, defaultWrite: true },
  { key: 'drive', icon: '📁', label: 'Drive', defaultRead: true, defaultWrite: false },
  { key: 'sheets', icon: '📊', label: 'Sheets', defaultRead: true, defaultWrite: false },
  { key: 'docs', icon: '📝', label: 'Docs', defaultRead: true, defaultWrite: false },
  { key: 'tasks', icon: '✅', label: 'Tasks', defaultRead: false, defaultWrite: false },
  { key: 'contacts', icon: '👤', label: 'Contacts', defaultRead: false, defaultWrite: false },
  { key: 'meet', icon: '🎥', label: 'Meet', defaultRead: false, defaultWrite: false },
];

const API_ENABLE_URLS = {
  gmail: 'gmail.googleapis.com',
  calendar: 'calendar-json.googleapis.com',
  tasks: 'tasks.googleapis.com',
  drive: 'drive.googleapis.com',
  contacts: 'people.googleapis.com',
  sheets: 'sheets.googleapis.com',
  docs: 'docs.googleapis.com',
  meet: 'meet.googleapis.com',
};

function getApiEnableUrl(svc) {
  return `https://console.developers.google.com/apis/api/${API_ENABLE_URLS[svc] || ''}/overview`;
}

export function ScopePicker({ scopes, onToggle, apiStatus, loading }) {
  const [showAll, setShowAll] = useState(false);
  const status = apiStatus || {};
  const kVisibleCount = 5;
  const hasMore = SERVICES.length > kVisibleCount;
  const visibleServices = showAll ? SERVICES : SERVICES.slice(0, kVisibleCount);

  return html`<div class="space-y-2">
    ${visibleServices.map(s => {
      const readOn = scopes.includes(`${s.key}:read`);
      const writeOn = scopes.includes(`${s.key}:write`);
      const api = status[s.key];
      let apiIndicator = null;
      if (loading && !api && (readOn || writeOn)) {
        apiIndicator = html`<span class="text-gray-500 text-xs flex items-center gap-1"><span class="inline-block w-3 h-3 border-2 border-gray-500 border-t-transparent rounded-full animate-spin"></span></span>`;
      } else if (api) {
        if (api.status === 'ok') {
          apiIndicator = html`<a href=${api.enableUrl || getApiEnableUrl(s.key)} target="_blank" class="text-green-500 hover:text-green-300 text-xs">✓ API</a>`;
        } else if (api.status === 'not_enabled') {
          apiIndicator = html`<a href=${api.enableUrl} target="_blank" class="text-red-400 hover:text-red-300 text-xs underline">Enable API</a>`;
        } else if (api.status === 'error') {
          apiIndicator = html`<a href=${api.enableUrl || getApiEnableUrl(s.key)} target="_blank" class="text-yellow-500 hover:text-yellow-300 text-xs underline">Enable API</a>`;
        }
      }

      return html`
        <div class="flex items-center justify-between bg-black/30 rounded-lg px-3 py-2">
          <span class="text-sm">${s.icon} ${s.label}</span>
          <div class="flex items-center gap-2">
            ${apiIndicator}
            <button onclick=${() => onToggle(`${s.key}:read`)} class="scope-btn ${readOn ? 'active' : ''} text-xs px-2 py-0.5 rounded">Read</button>
            <button onclick=${() => onToggle(`${s.key}:write`)} class="scope-btn ${writeOn ? 'active' : ''} text-xs px-2 py-0.5 rounded">Write</button>
          </div>
        </div>`;
    })}
    ${hasMore ? html`
      <button
        type="button"
        onclick=${() => setShowAll((prev) => !prev)}
        class="text-xs text-gray-500 hover:text-gray-300"
      >
        ${showAll ? 'Show fewer services' : `Show more services (${SERVICES.length - kVisibleCount})`}
      </button>
    ` : null}
  </div>`;
}

// Returns new scopes array after toggling, with read/write dependency logic
export function toggleScopeLogic(scopes, scope) {
  const isActive = scopes.includes(scope);
  let next = isActive ? scopes.filter(s => s !== scope) : [...scopes, scope];

  if (scope.endsWith(':write') && !isActive) {
    // enabling write → also enable read
    const readScope = scope.replace(':write', ':read');
    if (!next.includes(readScope)) next.push(readScope);
  }
  if (scope.endsWith(':read') && isActive) {
    // disabling read → also disable write
    const writeScope = scope.replace(':read', ':write');
    next = next.filter(s => s !== writeScope);
  }

  return next;
}

// Get default scopes from SERVICES
export function getDefaultScopes() {
  const scopes = [];
  for (const s of SERVICES) {
    if (s.defaultRead) scopes.push(`${s.key}:read`);
    if (s.defaultWrite) scopes.push(`${s.key}:write`);
  }
  return scopes;
}
