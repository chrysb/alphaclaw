import { useState, useEffect, useRef, useCallback } from "https://esm.sh/preact/hooks";
import { readUiSettings, writeUiSettings } from "../lib/ui-settings.js";
import { kDefaultUiTab, getSelectedNavId, kNavSections } from "../lib/app-navigation.js";
import { buildBrowseRoute, normalizeBrowsePath, parseBrowseRoute } from "../lib/browse-route.js";

const kBrowseLastPathUiSettingKey = "browseLastPath";
const kLastMenuRouteUiSettingKey = "lastMenuRoute";

export const useBrowseNavigation = ({
  location = "",
  setLocation = () => {},
  onCloseMobileSidebar = () => {},
} = {}) => {
  const [sidebarTab, setSidebarTab] = useState(() => {
    if (location.startsWith("/browse")) return "browse";
    return "menu";
  });
  const [lastBrowsePath, setLastBrowsePath] = useState(() => {
    const settings = readUiSettings();
    return typeof settings[kBrowseLastPathUiSettingKey] === "string"
      ? settings[kBrowseLastPathUiSettingKey]
      : "";
  });
  const [lastMenuRoute, setLastMenuRoute] = useState(() => {
    const settings = readUiSettings();
    const storedRoute = settings[kLastMenuRouteUiSettingKey];
    if (
      typeof storedRoute === "string" &&
      storedRoute.startsWith("/") &&
      !storedRoute.startsWith("/browse") &&
      !storedRoute.startsWith("/agents")
    ) {
      return storedRoute;
    }
    return `/${kDefaultUiTab}`;
  });
  const [browsePreviewPath, setBrowsePreviewPath] = useState("");
  const routeHistoryRef = useRef([]);

  const {
    activeBrowsePath,
    browseLineEndTarget,
    browseLineTarget,
    browseViewerMode,
    isBrowseRoute,
    selectedBrowsePath,
  } = parseBrowseRoute({
    location,
    browsePreviewPath,
  });

  const selectedNavId = getSelectedNavId({
    isBrowseRoute,
    location,
  });

  useEffect(() => {
    setSidebarTab((currentTab) => {
      if (location.startsWith("/browse")) return "browse";
      if (currentTab === "browse") return "menu";
      return currentTab;
    });
  }, [location]);

  useEffect(() => {
    if (location.startsWith("/browse")) return;
    setBrowsePreviewPath("");
  }, [location]);

  useEffect(() => {
    const historyStack = routeHistoryRef.current;
    const lastEntry = historyStack[historyStack.length - 1];
    if (lastEntry === location) return;
    historyStack.push(location);
    if (historyStack.length > 100) {
      historyStack.shift();
    }
  }, [location]);

  useEffect(() => {
    if (location.startsWith("/browse")) return;
    if (location.startsWith("/telegram")) return;
    setLastMenuRoute((currentRoute) =>
      currentRoute === location ? currentRoute : location,
    );
  }, [location]);

  useEffect(() => {
    if (!isBrowseRoute) return;
    if (!selectedBrowsePath) return;
    setLastBrowsePath((currentPath) =>
      currentPath === selectedBrowsePath ? currentPath : selectedBrowsePath,
    );
  }, [isBrowseRoute, selectedBrowsePath]);

  useEffect(() => {
    const handleBrowseGitSynced = () => {
      if (!isBrowseRoute || browseViewerMode !== "diff") return;
      const activePath = String(selectedBrowsePath || "").trim();
      if (!activePath) return;
      setLocation(buildBrowseRoute(activePath, { view: "edit" }));
    };
    window.addEventListener("alphaclaw:browse-git-synced", handleBrowseGitSynced);
    return () => {
      window.removeEventListener("alphaclaw:browse-git-synced", handleBrowseGitSynced);
    };
  }, [browseViewerMode, isBrowseRoute, selectedBrowsePath, setLocation]);

  useEffect(() => {
    const settings = readUiSettings();
    settings[kBrowseLastPathUiSettingKey] = lastBrowsePath;
    settings[kLastMenuRouteUiSettingKey] = lastMenuRoute;
    writeUiSettings(settings);
  }, [lastBrowsePath, lastMenuRoute]);

  const navigateToSubScreen = useCallback((screen) => {
    setLocation(`/${screen}`);
    onCloseMobileSidebar();
  }, [onCloseMobileSidebar, setLocation]);

  const handleBrowsePreviewFile = useCallback((nextPreviewPath) => {
    const normalizedPreviewPath = normalizeBrowsePath(nextPreviewPath);
    setBrowsePreviewPath(normalizedPreviewPath);
  }, []);

  const navigateToBrowseFile = useCallback((relativePath, options = {}) => {
    const normalizedTargetPath = normalizeBrowsePath(relativePath);
    const selectingDirectory =
      !!options.directory || String(relativePath || "").trim().endsWith("/");
    const shouldPreservePreview = selectingDirectory && !!options.preservePreview;
    const activePath = normalizeBrowsePath(
      browsePreviewPath || selectedBrowsePath || "",
    );
    const nextPreviewPath =
      shouldPreservePreview && activePath && activePath !== normalizedTargetPath
        ? activePath
        : "";
    setBrowsePreviewPath(nextPreviewPath);
    const routeOptions = selectingDirectory
      ? { ...options, view: "edit" }
      : options;
    setLocation(buildBrowseRoute(normalizedTargetPath, routeOptions));
    onCloseMobileSidebar();
  }, [browsePreviewPath, onCloseMobileSidebar, selectedBrowsePath, setLocation]);

  const handleSelectSidebarTab = useCallback((nextTab) => {
    setSidebarTab(nextTab);
    if (nextTab === "menu" && location.startsWith("/browse")) {
      setBrowsePreviewPath("");
      setLocation(lastMenuRoute || `/${kDefaultUiTab}`);
      return;
    }
    if (nextTab === "browse" && !location.startsWith("/browse")) {
      setLocation(buildBrowseRoute(lastBrowsePath));
      return;
    }
  }, [lastBrowsePath, lastMenuRoute, location, setLocation]);

  const handleSelectNavItem = useCallback((itemId) => {
    setLocation(`/${itemId}`);
    onCloseMobileSidebar();
  }, [onCloseMobileSidebar, setLocation]);

  const exitSubScreen = useCallback(() => {
    setLocation(`/${kDefaultUiTab}`);
    onCloseMobileSidebar();
  }, [onCloseMobileSidebar, setLocation]);

  return {
    state: {
      activeBrowsePath,
      browseLineEndTarget,
      browseLineTarget,
      browsePreviewPath,
      browseViewerMode,
      isBrowseRoute,
      routeHistoryRef,
      selectedBrowsePath,
      selectedNavId,
      sidebarTab,
    },
    actions: {
      buildBrowseRoute,
      clearBrowsePreview: () => setBrowsePreviewPath(""),
      exitSubScreen,
      handleBrowsePreviewFile,
      handleSelectNavItem,
      handleSelectSidebarTab,
      navigateToBrowseFile,
      navigateToSubScreen,
    },
    constants: {
      kNavSections,
    },
  };
};
