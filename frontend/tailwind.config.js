/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: "rgb(var(--c-obsidian) / <alpha-value>)",
          soft: "rgb(var(--c-obsidian-soft) / <alpha-value>)",
          card: "rgb(var(--c-obsidian-card) / <alpha-value>)",
        },
        gold: {
          DEFAULT: "rgb(var(--c-gold) / <alpha-value>)",
          bright: "rgb(var(--c-gold-bright) / <alpha-value>)",
          soft: "rgb(var(--c-gold-soft) / <alpha-value>)",
        },
        lapis: {
          DEFAULT: "rgb(var(--c-lapis) / <alpha-value>)",
          soft: "rgb(var(--c-lapis-soft) / <alpha-value>)",
        },
        sand: "rgb(var(--c-sand) / <alpha-value>)",
      },
      fontFamily: {
        display: ["'Cinzel'", "serif"],
        body: ["'Manrope'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
    },
  },
  plugins: [],
};
