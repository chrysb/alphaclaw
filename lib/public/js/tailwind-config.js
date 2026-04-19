// Shared Tailwind config — remaps color palette to CSS variables
// so themes can override colors without touching component files.
tailwind.config = {
  theme: {
    extend: {
      colors: {
        surface: "var(--bg-sidebar)",
        border: "var(--border)",
        body: "var(--text)",
        bright: "var(--text-bright)",
        "fg-muted": "var(--text-muted)",
        "fg-dim": "var(--text-dim)",
        field: "var(--field-bg-contrast)",
        overlay: "var(--overlay)",
        status: {
          error: "var(--status-error)",
          "error-muted": "var(--status-error-muted)",
          "error-bg": "var(--status-error-bg)",
          "error-border": "var(--status-error-border)",
          warning: "var(--status-warning)",
          "warning-muted": "var(--status-warning-muted)",
          "warning-bg": "var(--status-warning-bg)",
          "warning-border": "var(--status-warning-border)",
          success: "var(--status-success)",
          "success-muted": "var(--status-success-muted)",
          "success-bg": "var(--status-success-bg)",
          "success-border": "var(--status-success-border)",
          info: "var(--status-info)",
          "info-muted": "var(--status-info-muted)",
          "info-bg": "var(--status-info-bg)",
          "info-border": "var(--status-info-border)",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
};
