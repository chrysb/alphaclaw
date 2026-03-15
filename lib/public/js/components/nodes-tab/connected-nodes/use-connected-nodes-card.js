import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "https://esm.sh/preact/hooks";
import { copyTextToClipboard } from "../../../lib/clipboard.js";
import { fetchNodeBrowserStatusForNode, removeNode } from "../../../lib/api.js";
import { readUiSettings, updateUiSettings } from "../../../lib/ui-settings.js";
import { showToast } from "../../toast.js";

const kBrowserCheckTimeoutMs = 15000;
const kBrowserPollIntervalMs = 10000;
const kBrowserAttachStateByNodeKey = "nodesBrowserAttachStateByNode";

const withTimeout = async (promise, timeoutMs = kBrowserCheckTimeoutMs) => {
  let timeoutId = null;
  try {
    return await Promise.race([
      promise,
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error("Browser check timed out"));
        }, timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
};

const isBrowserCapableNode = (node) => {
  const caps = Array.isArray(node?.caps) ? node.caps : [];
  const commands = Array.isArray(node?.commands) ? node.commands : [];
  return caps.includes("browser") || commands.includes("browser.proxy");
};

const readBrowserAttachStateByNode = () => {
  const uiSettings = readUiSettings();
  const attachState = uiSettings?.[kBrowserAttachStateByNodeKey];
  if (
    !attachState ||
    typeof attachState !== "object" ||
    Array.isArray(attachState)
  ) {
    return {};
  }
  return attachState;
};

const writeBrowserAttachStateByNode = (nextState = {}) => {
  updateUiSettings((currentSettings) => {
    const nextSettings =
      currentSettings && typeof currentSettings === "object"
        ? currentSettings
        : {};
    return {
      ...nextSettings,
      [kBrowserAttachStateByNodeKey]:
        nextState && typeof nextState === "object" ? nextState : {},
    };
  });
};

export const useConnectedNodesCard = ({
  nodes = [],
  onRefreshNodes = async () => {},
} = {}) => {
  const [browserStatusByNodeId, setBrowserStatusByNodeId] = useState({});
  const [browserErrorByNodeId, setBrowserErrorByNodeId] = useState({});
  const [checkingBrowserNodeId, setCheckingBrowserNodeId] = useState("");
  const [browserAttachStateByNodeId, setBrowserAttachStateByNodeId] = useState(
    () => readBrowserAttachStateByNode(),
  );
  const [menuOpenNodeId, setMenuOpenNodeId] = useState("");
  const [removeDialogNode, setRemoveDialogNode] = useState(null);
  const [removingNodeId, setRemovingNodeId] = useState("");
  const browserPollCursorRef = useRef(0);
  const browserCheckInFlightNodeIdRef = useRef("");

  const handleCopyText = async (
    text,
    {
      successMessage = "Connection command copied",
      errorMessage = "Could not copy connection command",
    } = {},
  ) => {
    const copied = await copyTextToClipboard(text);
    if (copied) {
      showToast(successMessage, "success");
      return;
    }
    showToast(errorMessage, "error");
  };

  const handleCheckNodeBrowser = useCallback(
    async (nodeId, { silent = false } = {}) => {
      const normalizedNodeId = String(nodeId || "").trim();
      if (!normalizedNodeId || browserCheckInFlightNodeIdRef.current) return;
      browserCheckInFlightNodeIdRef.current = normalizedNodeId;
      if (!silent) {
        setCheckingBrowserNodeId(normalizedNodeId);
      }
      setBrowserErrorByNodeId((prev) => ({
        ...prev,
        [normalizedNodeId]: "",
      }));
      try {
        const result = await withTimeout(
          fetchNodeBrowserStatusForNode(normalizedNodeId, "user"),
        );
        const status =
          result?.status && typeof result.status === "object"
            ? result.status
            : null;
        setBrowserStatusByNodeId((prev) => ({
          ...prev,
          [normalizedNodeId]: status,
        }));
      } catch (error) {
        const message = error.message || "Could not check node browser status";
        setBrowserErrorByNodeId((prev) => ({
          ...prev,
          [normalizedNodeId]: message,
        }));
        if (!silent) {
          showToast(message, "error");
        }
      } finally {
        browserCheckInFlightNodeIdRef.current = "";
        if (!silent) {
          setCheckingBrowserNodeId("");
        }
      }
    },
    [],
  );

  const setBrowserAttachStateForNode = useCallback((nodeId, enabled) => {
    const normalizedNodeId = String(nodeId || "").trim();
    if (!normalizedNodeId) return;
    setBrowserAttachStateByNodeId((prevState) => {
      const nextState = {
        ...(prevState && typeof prevState === "object" ? prevState : {}),
        [normalizedNodeId]: enabled === true,
      };
      writeBrowserAttachStateByNode(nextState);
      return nextState;
    });
  }, []);

  const handleAttachNodeBrowser = useCallback(
    async (nodeId) => {
      const normalizedNodeId = String(nodeId || "").trim();
      if (!normalizedNodeId) return;
      setBrowserAttachStateForNode(normalizedNodeId, true);
      await handleCheckNodeBrowser(normalizedNodeId);
    },
    [handleCheckNodeBrowser, setBrowserAttachStateForNode],
  );

  const handleDetachNodeBrowser = useCallback(
    (nodeId) => {
      const normalizedNodeId = String(nodeId || "").trim();
      if (!normalizedNodeId) return;
      setBrowserAttachStateForNode(normalizedNodeId, false);
      setBrowserStatusByNodeId((prevState) => {
        const nextState = { ...(prevState || {}) };
        delete nextState[normalizedNodeId];
        return nextState;
      });
      setBrowserErrorByNodeId((prevState) => {
        const nextState = { ...(prevState || {}) };
        delete nextState[normalizedNodeId];
        return nextState;
      });
    },
    [setBrowserAttachStateForNode],
  );

  const handleOpenNodeMenu = useCallback((nodeId) => {
    const normalizedNodeId = String(nodeId || "").trim();
    if (!normalizedNodeId) return;
    setMenuOpenNodeId((currentNodeId) =>
      currentNodeId === normalizedNodeId ? "" : normalizedNodeId,
    );
  }, []);

  const handleRemoveNode = useCallback(async () => {
    const nodeId = String(removeDialogNode?.nodeId || "").trim();
    if (!nodeId || removingNodeId) return;
    setRemovingNodeId(nodeId);
    try {
      await removeNode(nodeId);
      // Removing a device should also clear local browser-attach state for that node.
      handleDetachNodeBrowser(nodeId);
      showToast("Device removed", "success");
      setRemoveDialogNode(null);
      setMenuOpenNodeId("");
      await onRefreshNodes();
    } catch (removeError) {
      showToast(removeError.message || "Could not remove node", "error");
    } finally {
      setRemovingNodeId("");
    }
  }, [
    handleDetachNodeBrowser,
    onRefreshNodes,
    removeDialogNode,
    removingNodeId,
  ]);

  useEffect(() => {
    if (checkingBrowserNodeId) return;
    const pollableNodeIds = nodes
      .map((node) => ({
        nodeId: String(node?.nodeId || "").trim(),
        connected: node?.connected === true,
        browserCapable: isBrowserCapableNode(node),
      }))
      .filter(
        (entry) =>
          entry.nodeId &&
          entry.connected &&
          entry.browserCapable &&
          browserAttachStateByNodeId?.[entry.nodeId] === true,
      )
      .map((entry) => entry.nodeId);
    if (!pollableNodeIds.length) return;

    let active = true;
    const poll = async () => {
      if (!active || browserCheckInFlightNodeIdRef.current) return;
      const pollIndex = browserPollCursorRef.current % pollableNodeIds.length;
      browserPollCursorRef.current += 1;
      const nextNodeId = pollableNodeIds[pollIndex];
      await handleCheckNodeBrowser(nextNodeId, { silent: true });
    };
    poll();
    const timer = setInterval(poll, kBrowserPollIntervalMs);
    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [browserAttachStateByNodeId, checkingBrowserNodeId, handleCheckNodeBrowser, nodes]);

  return {
    browserStatusByNodeId,
    browserErrorByNodeId,
    checkingBrowserNodeId,
    browserAttachStateByNodeId,
    menuOpenNodeId,
    removeDialogNode,
    removingNodeId,
    handleCopyText,
    handleCheckNodeBrowser,
    handleAttachNodeBrowser,
    handleDetachNodeBrowser,
    handleOpenNodeMenu,
    handleRemoveNode,
    setMenuOpenNodeId,
    setRemoveDialogNode,
  };
};
