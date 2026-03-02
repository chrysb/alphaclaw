export const escapeHtml = (value) =>
  String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");

export const toLineObjects = (content, renderer) =>
  String(content || "")
    .split("\n")
    .map((line, index) => ({
      lineNumber: index + 1,
      html: renderer(line),
    }));
