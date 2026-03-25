import { h } from "preact";
import { useMemo } from "preact/hooks";
import htm from "htm";
import { ActionButton } from "../action-button.js";
import { SecretInput } from "../secret-input.js";

const html = htm.bind(h);

const isResolvedValue = (value) => {
  const normalized = String(value || "").trim();
  return !!normalized && normalized !== "placeholder";
};

const PlaceholderRow = ({ item, value, onInput }) => {
  return html`
    <div class="border border-border rounded-lg p-3 space-y-2">
      <div class="flex items-start justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <code
              class="text-xs text-body bg-field px-1.5 py-0.5 rounded"
              >${item.key}</code
            >
          </div>
        </div>
      </div>
      <${SecretInput}
        value=${value}
        onInput=${(event) => onInput(event.target.value)}
        placeholder="Enter value"
        inputClass="w-full bg-field border border-border rounded-lg px-3 py-2 text-xs text-body outline-none focus:border-fg-muted font-mono"
      />
    </div>
  `;
};

export const WelcomePlaceholderReviewStep = ({
  placeholderReview,
  vals,
  setValue,
  onContinue,
}) => {
  const items = Array.isArray(placeholderReview?.vars)
    ? placeholderReview.vars
    : [];
  const unresolvedItems = useMemo(
    () =>
      items
        .filter((item) => !isResolvedValue(vals[item.key]))
        .map((item) => item.key),
    [items, vals],
  );
  const unresolvedCount = unresolvedItems.length;

  if (items.length === 0) return null;

  return html`
    <div class="space-y-3">
      <div>
        <h2 class="text-sm font-medium text-body">Add Missing Env Vars</h2>
      </div>

      <div class="space-y-2 max-h-80 overflow-y-auto">
        ${items.map(
          (item) => html`
            <${PlaceholderRow}
              key=${item.key}
              item=${item}
              value=${String(vals[item.key] || "") === "placeholder"
                ? ""
                : vals[item.key] || ""}
              onInput=${(nextValue) => setValue(item.key, nextValue)}
            />
          `,
        )}
      </div>

      <div
        class="bg-status-warning-bg border border-status-warning-border rounded-lg p-3 text-xs text-status-warning"
      >
        ${unresolvedCount > 0
          ? `${unresolvedCount} detected env var${unresolvedCount === 1 ? "" : "s"} need values. You can continue without them, but the gateway might fail to start.`
          : "All imported placeholder env vars have values now."}
      </div>

      <div class="pt-1">
        <${ActionButton}
          onClick=${onContinue}
          tone="primary"
          size="md"
          idleLabel=${unresolvedCount > 0
            ? `Continue with ${unresolvedCount} Unresolved`
            : "Continue"}
          className="w-full"
        />
      </div>
    </div>
  `;
};
