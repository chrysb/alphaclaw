import { h } from "preact";
import htm from "htm";

const html = htm.bind(h);

export const MediaPreview = ({
  isImageFile,
  imageDataUrl,
  pathSegments,
  isAudioFile,
  audioDataUrl,
}) => {
  if (isImageFile) {
    return html`
      <div class="file-viewer-image-shell">
        ${imageDataUrl
          ? html`
              <img
                src=${imageDataUrl}
                alt=${pathSegments[pathSegments.length - 1] || "Selected image"}
                class="file-viewer-image"
              />
            `
          : html`<div class="file-viewer-state">Could not render image preview.</div>`}
      </div>
    `;
  }

  if (isAudioFile) {
    return html`
      <div class="file-viewer-audio-shell">
        ${audioDataUrl
          ? html`
              <audio class="file-viewer-audio-player" controls preload="metadata" src=${audioDataUrl}>
                Your browser does not support audio playback.
              </audio>
            `
          : html`<div class="file-viewer-state">Could not render audio preview.</div>`}
      </div>
    `;
  }

  return null;
};
