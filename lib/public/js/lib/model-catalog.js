import { fetchModels } from "./api.js";
import { cachedFetch } from "./api-cache.js";
import { getFeaturedModels } from "./model-config.js";

export const kModelCatalogCacheKey = "/api/models";
export const kModelCatalogPollIntervalMs = 3000;

export const getModelCatalogModels = (payload) =>
  Array.isArray(payload?.models) ? payload.models : [];

export const isModelCatalogRefreshing = (payload) =>
  Boolean(payload?.refreshing);

export const preloadModelCatalog = ({
  force = true,
  maxAgeMs = 30000,
} = {}) =>
  cachedFetch(kModelCatalogCacheKey, fetchModels, {
    force,
    maxAgeMs,
  });

export const getInitialOnboardingModelKey = ({
  catalog = [],
  currentModelKey = "",
} = {}) => {
  const normalizedCurrent = String(currentModelKey || "").trim();
  if (normalizedCurrent) return normalizedCurrent;
  const featuredModels = getFeaturedModels(catalog);
  return String(featuredModels[0]?.key || catalog[0]?.key || "");
};
