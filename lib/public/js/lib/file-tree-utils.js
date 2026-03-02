export const collectAncestorFolderPaths = (targetPath) => {
  const normalizedPath = String(targetPath || "")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);
  if (normalizedPath.length <= 1) return [];
  const ancestors = [];
  for (let index = 0; index < normalizedPath.length - 1; index += 1) {
    ancestors.push(normalizedPath.slice(0, index + 1).join("/"));
  }
  return ancestors;
};
