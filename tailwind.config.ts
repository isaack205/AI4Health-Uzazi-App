import type { Config } from "tailwindcss";
import animate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
    "./providers/**/*.{ts,tsx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "1rem",
      screens: {
        "2xl": "1280px",
      },
    },
    extend: {
      colors: {
        "uzazi-rose": "#8B2252",
        "uzazi-blush": "#F4A7B9",
        "uzazi-petal": "#FCE4EC",
        "uzazi-cream": "#FFF8F5",
        "uzazi-earth": "#5D3A1A",
        "uzazi-leaf": "#4CAF50",
        "uzazi-sky": "#81D4FA",
        "uzazi-midnight": "#1A0A2E",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
        mono: ["var(--font-mono)", "monospace"],
      },
      boxShadow: {
        bloom: "0 24px 80px -32px rgba(139, 34, 82, 0.35)",
        soft: "0 18px 40px -24px rgba(93, 58, 26, 0.2)",
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top left, rgba(244, 167, 185, 0.45), transparent 35%), radial-gradient(circle at top right, rgba(129, 212, 250, 0.35), transparent 30%), linear-gradient(135deg, rgba(255, 248, 245, 1) 0%, rgba(252, 228, 236, 0.75) 100%)",
      },
      keyframes: {
        breathing: {
          "0%, 100%": { transform: "scale(0.8)", opacity: "0.3" },
          "50%": { transform: "scale(1.2)", opacity: "0.6" },
        },
        "pulse-slow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        breathing: "breathing 4s ease-in-out infinite",
        "pulse-slow": "pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
      },
    },
  },
  plugins: [animate],
};

export default config;
