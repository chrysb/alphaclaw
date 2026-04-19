import { useState, useEffect, useRef, useCallback } from "preact/hooks";
import { readUiSettings, writeUiSettings } from "../lib/ui-settings.js";

const kDefaultSidebarWidthPx = 220;
const kSidebarMinWidthPx = 180;
const kSidebarMaxWidthPx = 460;

const clampSidebarWidth = (value) =>
  Math.max(kSidebarMinWidthPx, Math.min(kSidebarMaxWidthPx, value));

export const useAppShellUi = () => {
  const appShellRef = useRef(null);
  const menuRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sidebarWidthPx, setSidebarWidthPx] = useState(() => {
    const settings = readUiSettings();
    if (!Number.isFinite(settings.sidebarWidthPx)) return kDefaultSidebarWidthPx;
    return clampSidebarWidth(settings.sidebarWidthPx);
  });
  const [isResizingSidebar, setIsResizingSidebar] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [mobileTopbarScrolled, setMobileTopbarScrolled] = useState(false);

  const closeMenu = useCallback((event) => {
    if (menuRef.current && !menuRef.current.contains(event.target)) {
      setMenuOpen(false);
    }
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.addEventListener("click", closeMenu, true);
      return () => document.removeEventListener("click", closeMenu, true);
    }
  }, [closeMenu, menuOpen]);

  useEffect(() => {
    if (!mobileSidebarOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [mobileSidebarOpen]);

  useEffect(() => {
    const settings = readUiSettings();
    settings.sidebarWidthPx = sidebarWidthPx;
    writeUiSettings(settings);
  }, [sidebarWidthPx]);

  const resizeSidebarWithClientX = useCallback((clientX) => {
    const shellElement = appShellRef.current;
    if (!shellElement) return;
    const shellBounds = shellElement.getBoundingClientRect();
    const nextWidth = clampSidebarWidth(Math.round(clientX - shellBounds.left));
    setSidebarWidthPx(nextWidth);
  }, []);

  const onSidebarResizerPointerDown = useCallback((event) => {
    event.preventDefault();
    setIsResizingSidebar(true);
    resizeSidebarWithClientX(event.clientX);
  }, [resizeSidebarWithClientX]);

  useEffect(() => {
    if (!isResizingSidebar) return () => {};
    const onPointerMove = (event) => resizeSidebarWithClientX(event.clientX);
    const onPointerUp = () => setIsResizingSidebar(false);
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    const previousUserSelect = document.body.style.userSelect;
    const previousCursor = document.body.style.cursor;
    document.body.style.userSelect = "none";
    document.body.style.cursor = "col-resize";
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      document.body.style.userSelect = previousUserSelect;
      document.body.style.cursor = previousCursor;
    };
  }, [isResizingSidebar, resizeSidebarWithClientX]);

  const handlePaneScroll = useCallback((event) => {
    const nextScrolled = event.currentTarget.scrollTop > 0;
    setMobileTopbarScrolled((currentScrolled) =>
      currentScrolled === nextScrolled ? currentScrolled : nextScrolled,
    );
  }, []);

  return {
    refs: {
      appShellRef,
      menuRef,
    },
    state: {
      isResizingSidebar,
      menuOpen,
      mobileSidebarOpen,
      mobileTopbarScrolled,
      sidebarWidthPx,
    },
    actions: {
      closeMobileSidebar: () => setMobileSidebarOpen(false),
      handlePaneScroll,
      onSidebarResizerPointerDown,
      onToggleMenu: () => setMenuOpen((open) => !open),
      setMenuOpen,
      setMobileSidebarOpen,
    },
  };
};
