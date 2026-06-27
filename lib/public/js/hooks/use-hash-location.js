import { useState, useEffect, useCallback } from "preact/hooks";
import { kDefaultUiTab } from "../lib/app-navigation.js";

const kDirectAppRoutePattern =
  /^\/(?:general|doctor|telegram(?:\/.*)?|providers|watchdog|usage(?:\/.*)?|webhooks(?:\/.*)?|models|envars|nodes|cron|agents(?:\/.*)?|chat(?:\/.*)?|browse(?:\/.*)?)$/;

const getDirectPath = () => {
  const pathname = window.location.pathname || "";
  return kDirectAppRoutePattern.test(pathname) ? pathname : "";
};

const getHashPath = () => {
  const hash = window.location.hash.replace(/^#/, "");
  if (!hash) return getDirectPath() || `/${kDefaultUiTab}`;
  return hash.startsWith("/") ? hash : `/${hash}`;
};

export const useHashLocation = () => {
  const [location, setLocationState] = useState(getHashPath);

  useEffect(() => {
    const onHashChange = () => setLocationState(getHashPath());
    window.addEventListener("hashchange", onHashChange);
    window.addEventListener("popstate", onHashChange);
    return () => {
      window.removeEventListener("hashchange", onHashChange);
      window.removeEventListener("popstate", onHashChange);
    };
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
