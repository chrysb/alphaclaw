/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./lib/public/setup.html",
    "./lib/public/login.html",
    "./lib/public/js/**/*.js",
  ],
  theme: {
    extend: {
      colors: {
        surface: "var(--bg-sidebar)",
        border: "var(--border)",
      },
      fontFamily: {
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
};
