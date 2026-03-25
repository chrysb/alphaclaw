import { h } from "preact";
import htm from "htm";
import { Badge } from "../badge.js";
import { ScopePicker } from "../scope-picker.js";
import { GmailWatchToggle } from "./gmail-watch-toggle.js";

const html = htm.bind(h);

const scopeListsEqual = (a = [], b = []) =>
  a.length === b.length && a.every((scope) => b.includes(scope));

export const GoogleAccountRow = ({
  account,
  personal = false,
  expanded,
  onToggleExpanded,
  scopes = [],
  savedScopes = [],
  apiStatus = {},
  checkingApis = false,
  onToggleScope,
  onCheckApis,
  onUpdatePermissions,
  onEditCredentials,
  onDisconnect,
  gmailWatchStatus = null,
  gmailWatchBusy = false,
  onEnableGmailWatch,
  onDisableGmailWatch,
  onOpenGmailSetup,
  onOpenGmailWebhook,
}) => {
  const scopesChanged = !scopeListsEqual(scopes, savedScopes);
  return html`
    <div class="border border-border rounded-lg bg-field overflow-visible">
      <button
        type="button"
        onclick=${() => onToggleExpanded?.(account.id)}
        class="w-full text-left px-3 py-2.5 flex items-center justify-between hover:bg-field"
      >
        <div class="min-w-0">
          <div class="text-sm font-medium truncate">${account.email}</div>
        </div>
        <div class="flex items-center gap-2">
          ${personal ? html`<${Badge} tone="neutral">Personal</${Badge}>` : null}
          <${Badge} tone=${account.authenticated ? "success" : "warning"}>
            ${account.authenticated ? "Connected" : "Awaiting sign-in"}
          </${Badge}>
          <span class="text-xs text-fg-muted">${expanded ? "▾" : "▸"}</span>
        </div>
      </button>
      ${expanded
        ? html`
            <div class="px-3 pb-3 space-y-3 border-t border-border">
              <div class="flex justify-between items-center pt-3">
                <span class="text-sm text-fg-muted">Select permissions</span>
                ${account.authenticated
                  ? html`<button
                      type="button"
                      onclick=${() => onCheckApis?.(account.id)}
                      disabled=${checkingApis}
                      class="text-xs px-2 py-1 rounded-lg ac-btn-ghost disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      ${checkingApis ? "Checking APIs..." : "↻ Check APIs"}
                    </button>`
                  : null}
              </div>
              <${ScopePicker}
                scopes=${scopes}
                onToggle=${(scope) => onToggleScope?.(account.id, scope)}
                apiStatus=${account.authenticated ? apiStatus : {}}
                loading=${account.authenticated && checkingApis}
              />
              ${account.authenticated
                ? html`
                    <div class="-mx-3 mt-4 mb-2 border-y border-border">
                      <div class="px-3 py-3 space-y-2">
                        <div class="flex justify-between items-center gap-2">
                          <span class="text-sm text-fg-muted">Incoming events</span>
                          <button
                            type="button"
                            onclick=${() => onOpenGmailSetup?.(account.id)}
                            class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
                          >
                            Configure
                          </button>
                        </div>
                        <${GmailWatchToggle}
                          account=${account}
                          watchStatus=${gmailWatchStatus}
                          busy=${gmailWatchBusy}
                          onEnable=${() => onEnableGmailWatch?.(account.id)}
                          onDisable=${() => onDisableGmailWatch?.(account.id)}
                          onOpenWebhook=${() => onOpenGmailWebhook?.()}
                        />
                      </div>
                    </div>
                  `
                : null}
              <div class="pt-1 space-y-2 sm:space-y-0 sm:flex sm:justify-between sm:items-center">
                <div class="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
                  <button
                    type="button"
                    onclick=${() => onUpdatePermissions?.(account.id)}
                    disabled=${account.authenticated && !scopesChanged}
                    class="w-full sm:w-auto text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-cyan disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ${account.authenticated ? "Update Permissions" : "Sign in with Google"}
                  </button>
                  <button
                    type="button"
                    onclick=${() => onEditCredentials?.(account.id)}
                    class="w-full sm:w-auto text-xs font-medium px-3 py-1.5 rounded-lg ac-btn-secondary"
                  >
                    Edit Credentials
                  </button>
                </div>
                <button
                  type="button"
                  onclick=${() => onDisconnect?.(account.id)}
                  class="text-xs px-2 py-1 rounded-lg ac-btn-ghost w-full sm:w-auto"
                >
                  Disconnect
                </button>
              </div>
            </div>
          `
        : null}
    </div>
  `;
};
