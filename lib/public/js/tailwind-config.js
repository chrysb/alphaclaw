// Shared Tailwind config — remaps color palette to CSS variables
// so themes can override colors without touching component files.
tailwind.config = {
  theme: {
    extend: {
      colors: {
        surface: "var(--bg-sidebar)",
        border: "var(--border)",
        gray: {
          100: "var(--tw-gray-100)",
          200: "var(--tw-gray-200)",
          300: "var(--tw-gray-300)",
          400: "var(--tw-gray-400)",
          500: "var(--tw-gray-500)",
          600: "var(--tw-gray-600)",
        },
        red: {
          200: "var(--tw-red-200)",
          300: "var(--tw-red-300)",
          400: "var(--tw-red-400)",
          500: "var(--tw-red-500)",
          700: "var(--tw-red-700)",
          800: "var(--tw-red-800)",
          900: "var(--tw-red-900)",
          950: "var(--tw-red-950)",
        },
        yellow: {
          100: "var(--tw-yellow-100)",
          200: "var(--tw-yellow-200)",
          300: "var(--tw-yellow-300)",
          400: "var(--tw-yellow-400)",
          500: "var(--tw-yellow-500)",
          700: "var(--tw-yellow-700)",
          800: "var(--tw-yellow-800)",
          900: "var(--tw-yellow-900)",
          950: "var(--tw-yellow-950)",
        },
        green: {
          200: "var(--tw-green-200)",
          300: "var(--tw-green-300)",
          400: "var(--tw-green-400)",
          500: "var(--tw-green-500)",
          700: "var(--tw-green-700)",
          900: "var(--tw-green-900)",
          950: "var(--tw-green-950)",
        },
        cyan: {
          100: "var(--tw-cyan-100)",
          200: "var(--tw-cyan-200)",
          300: "var(--tw-cyan-300)",
          400: "var(--tw-cyan-400)",
          500: "var(--tw-cyan-500)",
          700: "var(--tw-cyan-700)",
          800: "var(--tw-cyan-800)",
          900: "var(--tw-cyan-900)",
          950: "var(--tw-cyan-950)",
        },
        blue: {
          300: "var(--tw-blue-300)",
          400: "var(--tw-blue-400)",
          500: "var(--tw-blue-500)",
        },
        purple: {
          300: "var(--tw-purple-300)",
          400: "var(--tw-purple-400)",
          500: "var(--tw-purple-500)",
        },
        indigo: {
          300: "var(--tw-indigo-300)",
          500: "var(--tw-indigo-500)",
        },
        amber: {
          300: "var(--tw-amber-300)",
        },
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
};
