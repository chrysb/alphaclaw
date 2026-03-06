export const normalizeBrowsePath = (value) => String(value || "").replace(/^\/+|\/+$/g, "");

export const buildBrowseRoute = (relativePath, options = {}) => {
  const view = String(options?.view || "edit");
  const encodedPath = String(relativePath || "")
    .split("/")
    .filter(Boolean)
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  const baseRoute = encodedPath ? `/browse/${encodedPath}` : "/browse";
  const params = new URLSearchParams();
  if (view === "diff" && encodedPath) params.set("view", "diff");
  if (options.line) params.set("line", String(options.line));
  if (options.lineEnd) params.set("lineEnd", String(options.lineEnd));
  const query = params.toString();
  return query ? `${baseRoute}?${query}` : baseRoute;
};

export const parseBrowseRoute = ({ location = "", browsePreviewPath = "" } = {}) => {
  const isBrowseRoute = location.startsWith("/browse");
  const browseRoutePath = isBrowseRoute ? String(location || "").split("?")[0] : "";
  const browseRouteQuery =
    isBrowseRoute && String(location || "").includes("?")
      ? String(location || "").split("?").slice(1).join("?")
      : "";
  const selectedBrowsePath = isBrowseRoute
    ? browseRoutePath
        .replace(/^\/browse\/?/, "")
        .split("/")
        .filter(Boolean)
        .map((segment) => {
          try {
            return decodeURIComponent(segment);
          } catch {
            return segment;
          }
        })
        .join("/")
    : "";
  const activeBrowsePath = browsePreviewPath || selectedBrowsePath;
  const browseQueryParams = isBrowseRoute ? new URLSearchParams(browseRouteQuery) : null;
  const browseViewerMode =
    !browsePreviewPath && browseQueryParams?.get("view") === "diff"
      ? "diff"
      : "edit";
  const browseLineTarget = Number.parseInt(browseQueryParams?.get("line") || "", 10) || 0;
  const browseLineEndTarget = Number.parseInt(browseQueryParams?.get("lineEnd") || "", 10) || 0;

  return {
    activeBrowsePath,
    browseLineEndTarget,
    browseLineTarget,
    browseViewerMode,
    isBrowseRoute,
    selectedBrowsePath,
  };
};
