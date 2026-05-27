import { useState, useEffect, useCallback } from "preact/hooks";
import { kDefaultUiTab } from "../lib/app-navigation.js";

const getHashPath = () => {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return `/${kDefaultUiTab}`;
  return hash.startsWith("/") ? hash : `/${hash}`;
};

export const useHashLocation = () => {
  const [location, setLocationState] = useState(getHashPath);

  useEffect(() => {
    const onHashChange = () => setLocationState(getHashPath());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const setLocation = useCallback((to) => {
    const normalized = to.startsWith("/") ? to : `/${to}`;
    const nextHash = `#${normalized}`;
    if (window.location.hash !== nextHash) {
      window.location.hash = normalized;
      return;
    }
    setLocationState(normalized);
  }, []);

  return [location, setLocation];
};

export const getHashRouterPath = getHashPath;
