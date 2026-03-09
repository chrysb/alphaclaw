import { h } from "https://esm.sh/preact";
import { useState, useMemo, useRef, useEffect } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  getModelProvider,
  getAuthProviderFromModelProvider,
  kProviderLabels,
  kProviderOrder,
} from "../../lib/model-config.js";

const html = htm.bind(h);

const kProviderDisplayOrder = [
  "anthropic",
  "openai",
  "openai-codex",
  ...kProviderOrder.filter((provider) => !["anthropic", "openai"].includes(provider)),
];

export const getModelsTabAuthProvider = (modelKey) => {
  const provider = getModelProvider(modelKey);
  if (provider === "openai-codex") return "openai-codex";
  return getAuthProviderFromModelProvider(provider);
};

export const getModelCatalogProvider = (model) =>
  String(model?.provider || getModelProvider(model?.key)).trim();

export const getProviderSortIndex = (provider) => {
  const index = kProviderDisplayOrder.indexOf(provider);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
};

const formatProviderSectionLabel = (provider) =>
  String(kProviderLabels[provider] || provider).toUpperCase();

const normalizeSearch = (value) => String(value || "").trim().toLowerCase();

export const getModelDisplayLabel = (model) => model?.featuredLabel || model?.label || model?.key;

const buildModelSearchText = (model) =>
  [
    model?.featuredLabel || "",
    model?.label || "",
    model?.key || "",
    model?.provider || getModelProvider(model?.key),
  ]
    .join(" ")
    .toLowerCase();

export const buildProviderHasAuth = ({
  authProfiles = [],
  codexStatus = { connected: false },
} = {}) => {
  const result = {};
  for (const profile of authProfiles) {
    if (profile?.key || profile?.token || profile?.access) {
      result[profile.provider] = true;
    }
  }
  if (codexStatus?.connected) {
    result["openai-codex"] = true;
  }
  return result;
};

export const SearchableModelPicker = ({
  options = [],
  popularModels = [],
  placeholder = "Add model...",
  onSelect = () => {},
  disabled = false,
}) => {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const normalizedQuery = normalizeSearch(query);
  const filteredOptions = useMemo(
    () =>
      normalizedQuery
        ? options.filter((option) =>
            buildModelSearchText(option).includes(normalizedQuery),
          )
        : options,
    [options, normalizedQuery],
  );
  const groupedOptions = useMemo(() => {
    const groups = [];
    const showPopularGroup = !normalizedQuery;
    const visibleOptionKeys = new Set(filteredOptions.map((option) => option.key));
    const visiblePopularModels = popularModels.filter((model) =>
      visibleOptionKeys.has(model.key),
    );
    if (showPopularGroup && visiblePopularModels.length > 0) {
      groups.push({
        provider: "popular",
        label: "POPULAR",
        options: visiblePopularModels,
      });
    }
    for (const option of filteredOptions) {
      const provider = getModelCatalogProvider(option);
      const label = formatProviderSectionLabel(provider);
      const currentGroup = groups[groups.length - 1];
      if (!currentGroup || currentGroup.provider !== provider) {
        groups.push({ provider, label, options: [option] });
        continue;
      }
      currentGroup.options.push(option);
    }
    return groups;
  }, [filteredOptions, popularModels, normalizedQuery]);

  useEffect(() => {
    const handleOutsidePointer = (event) => {
      if (!rootRef.current?.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsidePointer);
    return () => document.removeEventListener("mousedown", handleOutsidePointer);
  }, []);

  const handleSelect = (modelKey) => {
    if (!modelKey || disabled) return;
    onSelect(modelKey);
    setQuery("");
    setOpen(false);
  };

  const handleKeyDown = (event) => {
    const firstVisibleOption = groupedOptions[0]?.options?.[0];
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "Enter" && firstVisibleOption?.key) {
      event.preventDefault();
      handleSelect(firstVisibleOption.key);
    }
  };

  return html`
    <div class="relative" ref=${rootRef}>
      <input
        type="text"
        value=${query}
        placeholder=${placeholder}
        disabled=${disabled}
        onFocus=${() => {
          if (disabled) return;
          setOpen(true);
        }}
        onInput=${(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown=${handleKeyDown}
        class="w-full bg-black/30 border border-border rounded-lg px-3 py-2 text-sm text-gray-200 outline-none focus:border-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
      />
      ${open && !disabled
        ? html`
            <div
              class="absolute left-0 right-0 top-full mt-2 z-20 bg-modal border border-border rounded-xl shadow-2xl overflow-hidden"
            >
              <div class="max-h-80 overflow-y-auto">
                ${filteredOptions.length > 0
                  ? groupedOptions.map(
                      (group, index) => html`
                        <div key=${group.provider}>
                          <div
                            class=${`sticky top-0 z-10 h-[22px] px-3 text-[12px] font-semibold tracking-wide text-gray-400 bg-[#151922] border-b border-border flex items-center ${
                              index > 0 ? "border-t border-border" : ""
                            }`}
                          >
                            ${group.label}
                          </div>
                          ${group.options.map(
                            (model) => html`
                              <button
                                key=${model.key}
                                type="button"
                                onMouseDown=${(event) => event.preventDefault()}
                                onClick=${() => handleSelect(model.key)}
                                class="w-full text-left px-3 py-2 hover:bg-white/5 border-b border-border last:border-b-0"
                              >
                                <div class="flex flex-col gap-1">
                                  <div class="text-sm text-gray-200">
                                    ${getModelDisplayLabel(model)}
                                  </div>
                                  <div class="text-xs text-gray-500 font-mono">
                                    ${model.key}
                                  </div>
                                </div>
                              </button>
                            `,
                          )}
                        </div>
                      `,
                    )
                  : html`
                      <div class="px-3 py-3 text-xs text-gray-500">
                        No models match that search.
                      </div>
                    `}
              </div>
            </div>
          `
        : null}
    </div>
  `;
};
