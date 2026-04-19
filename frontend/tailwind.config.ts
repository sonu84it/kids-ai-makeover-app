import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#12243a",
        mist: "#f4f8fc",
        accent: "#ff935c",
        sky: "#b8e3ff",
        mint: "#d9f7ea"
      },
      boxShadow: {
        soft: "0 22px 60px rgba(18, 36, 58, 0.12)"
      }
    }
  },
  plugins: []
};

export default config;
