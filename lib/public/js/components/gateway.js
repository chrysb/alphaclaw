import { h } from "https://esm.sh/preact";
import { useEffect, useState } from "https://esm.sh/preact/hooks";
import htm from "https://esm.sh/htm";
import {
  fetchOpenclawVersion,
  restartGateway,
  updateOpenclaw,
} from "../lib/api.js";
import { showToast } from "./toast.js";
const html = htm.bind(h);

export function Gateway({ status, openclawVersion }) {
  const [restarting, setRestarting] = useState(false);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [currentVersion, setCurrentVersion] = useState(openclawVersion || null);
  const [latestVersion, setLatestVersion] = useState(null);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [updateError, setUpdateError] = useState("");
  const isRunning = status === "running" && !restarting;
  const dotClass = isRunning
    ? "w-2 h-2 rounded-full bg-green-500"
    : "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";

  useEffect(() => {
    setCurrentVersion(openclawVersion || null);
  }, [openclawVersion]);

  useEffect(() => {
    let active = true;
    const loadLatest = async () => {
      try {
        const data = await fetchOpenclawVersion(false);
        if (!active) return;
        setCurrentVersion(data.currentVersion || openclawVersion || null);
        setLatestVersion(data.latestVersion || null);
        setHasUpdate(!!data.hasUpdate);
        setUpdateError(data.ok ? "" : data.error || "");
      } catch (err) {
        if (!active) return;
        setUpdateError(err.message || "Could not check updates");
      }
    };
    loadLatest();
    return () => {
      active = false;
    };
  }, []);

  const handleRestart = async () => {
    if (restarting) return;
    setRestarting(true);
    try {
      await restartGateway();
      showToast("Gateway restarted", "success");
    } catch (err) {
      showToast("Restart failed: " + err.message, "error");
    }
    setRestarting(false);
  };

  const handleUpdate = async () => {
    if (checkingUpdate) return;
    setCheckingUpdate(true);
    setUpdateError("");
    try {
      const data = hasUpdate
        ? await updateOpenclaw()
        : await fetchOpenclawVersion(true);
      setCurrentVersion(data.currentVersion || currentVersion);
      setLatestVersion(data.latestVersion || null);
      setHasUpdate(!!data.hasUpdate);
      setUpdateError(data.ok ? "" : data.error || "");
      if (hasUpdate) {
        if (!data.ok) {
          showToast(data.error || "OpenClaw update failed", "error");
        } else if (data.updated) {
          showToast(
            data.restarted
              ? `Updated to ${data.currentVersion} and restarted gateway`
              : `Updated to ${data.currentVersion}`,
            "success",
          );
        } else {
          showToast("Already at latest OpenClaw version", "success");
        }
      } else if (data.hasUpdate && data.latestVersion) {
        showToast(`Update available: ${data.latestVersion}`, "warning");
      } else {
        showToast("OpenClaw is up to date", "success");
      }
    } catch (err) {
      setUpdateError(
        err.message ||
          (hasUpdate ? "Could not update OpenClaw" : "Could not check updates"),
      );
      showToast(
        hasUpdate ? "Could not update OpenClaw" : "Could not check updates",
        "error",
      );
    }
    setCheckingUpdate(false);
  };

  return html` <div class="bg-surface border border-border rounded-xl p-4">
    <div class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span class=${dotClass}></span>
          <span class="font-semibold">Gateway:</span>
          <span class="text-gray-400"
            >${restarting ? "restarting..." : status || "checking..."}</span
          >
        </div>
      </div>
      <button
        onclick=${handleRestart}
        disabled=${restarting || !status}
        class="text-xs px-2.5 py-1 rounded-lg border border-border text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors ${restarting ||
        !status
          ? "opacity-50 cursor-not-allowed"
          : ""}"
      >
        Restart
      </button>
    </div>
    <div class="mt-3 pt-3 border-t border-border">
      <div class="flex items-center justify-between gap-3">
        <div class="min-w-0">
          <p class="text-sm text-gray-300 truncate">
            v${currentVersion || openclawVersion || "unknown"}
          </p>
          ${updateError &&
          html`<p class="text-xs text-yellow-500 mt-1">${updateError}</p>`}
        </div>
        <div class="flex items-center gap-2 shrink-0">
          ${hasUpdate &&
          latestVersion &&
          html`<a
            href="https://github.com/openclaw/openclaw/tags"
            target="_blank"
            class="text-xs text-yellow-500 hover:text-yellow-300 transition-colors"
            >${latestVersion} available</a
          >`}
          <button
            onclick=${handleUpdate}
            disabled=${checkingUpdate}
            class="text-xs px-2.5 py-1 rounded-lg border border-border text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors ${checkingUpdate
              ? "opacity-50 cursor-not-allowed"
              : ""}"
          >
            ${checkingUpdate
              ? hasUpdate
                ? "Updating..."
                : "Checking..."
              : hasUpdate
                ? "Update"
                : "Check updates"}
          </button>
        </div>
      </div>
    </div>
  </div>`;
}
