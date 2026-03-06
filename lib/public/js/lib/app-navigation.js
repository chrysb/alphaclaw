export const kDefaultUiTab = "general";

export const kNavSections = [
  {
    label: "Setup",
    items: [
      { id: "general", label: "General" },
    ],
  },
  {
    label: "Monitoring",
    items: [
      { id: "watchdog", label: "Watchdog" },
      { id: "usage", label: "Usage" },
      { id: "doctor", label: "Doctor" },
    ],
  },
  {
    label: "Config",
    items: [
      { id: "providers", label: "Providers" },
      { id: "envars", label: "Envars" },
      { id: "webhooks", label: "Webhooks" },
    ],
  },
];

export const getSelectedNavId = ({ isBrowseRoute = false, location = "" } = {}) => {
  if (isBrowseRoute) return "browse";
  if (location === "/telegram") return "";
  if (location.startsWith("/providers")) return "providers";
  if (location.startsWith("/watchdog")) return "watchdog";
  if (location.startsWith("/usage")) return "usage";
  if (location.startsWith("/doctor")) return "doctor";
  if (location.startsWith("/envars")) return "envars";
  if (location.startsWith("/webhooks")) return "webhooks";
  return kDefaultUiTab;
};
