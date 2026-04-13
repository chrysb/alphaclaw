import { h } from "preact";
import htm from "htm";
import { fetchEnvVars } from "../lib/api.js";
import { useCachedFetch } from "../hooks/use-cached-fetch.js";
import { Badge } from "./badge.js";
import {
  kFeatureDefs,
  kProviderAuthFields,
  kProviderLabels,
} from "../lib/model-config.js";

const html = htm.bind(h);

const getKeyVal = (vars, key) => vars.find((v) => v.key === key)?.value || "";

const resolveFeatureStatus = (feature, envVars) => {
  for (const provider of feature.providers) {
    const fields = kProviderAuthFields[provider] || [];
    const hasKey = fields.some((f) => !!getKeyVal(envVars, f.key));
    if (hasKey) return { active: true, provider };
  }
  return { active: false, provider: null };
};

export const Features = ({ onSwitchTab }) => {
  const { data, loading } = useCachedFetch("/api/env", fetchEnvVars, {
    maxAgeMs: 30000,
  });
  const envVars = Array.isArray(data?.vars) ? data.vars : [];
  const loaded = !loading;

  if (!loaded) return null;

  return html`
    <div class="bg-surface border border-border rounded-xl p-4">
      <h2 class="card-label mb-3">Features</h2>
      <div class="space-y-2">
        ${kFeatureDefs.map((feature) => {
          const status = resolveFeatureStatus(feature, envVars);
          return html`
            <div class="flex justify-between items-center py-1.5">
              <span class="text-sm text-body">${feature.label}</span>
              ${status.active
                ? html`
                    <span class="flex items-center gap-2">
                      <span class="text-xs text-fg-muted">
                        ${kProviderLabels[status.provider] || status.provider}
                      </span>
                      <${Badge} tone="success">Enabled</${Badge}>
                    </span>
                  `
                : html`
                    <span class="flex items-center gap-2">
                      <a
                        href="#"
                        onclick=${(e) => {
                          e.preventDefault();
                          onSwitchTab?.("envars");
                        }}
                        class="text-xs px-2 py-1 rounded-lg ac-btn-ghost"
                      >Add provider</a>
                      <${Badge} tone=${feature.hasDefault ? "neutral" : "danger"}>Disabled</${Badge}>
                    </span>
                  `}
            </div>
          `;
        })}
      </div>
    </div>
  `;
};
