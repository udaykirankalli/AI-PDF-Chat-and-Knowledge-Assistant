import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#161616",
        mist: "#eef2f6",
        jade: "#1f7a5b",
        coral: "#d46a4c"
      },
      boxShadow: {
        soft: "0 20px 60px rgba(22, 22, 22, 0.08)"
      }
    }
  },
  plugins: []
} satisfies Config;
