// @ts-check
// The LupiOS website: https://vukkz.github.io/lupios (built by .github/workflows/website.yml).
// Local preview: `npm install` once, then `npm run dev` and open the address it prints.
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

const repo = "https://github.com/vukkz/lupios";

export default defineConfig({
  site: "https://vukkz.github.io",
  base: "/lupios",
  integrations: [
    starlight({
      title: "LupiOS",
      description: "A hardened, rollback-safe everyday Linux desktop with an isolated hacking lab.",
      logo: { src: "./src/assets/lupios-logo.svg" },
      favicon: "/favicon.svg",
      social: [{ icon: "github", label: "GitHub", href: repo }],
      customCss: ["./src/styles/lupios.css"],
      editLink: { baseUrl: `${repo}/edit/main/website/` },
      sidebar: [
        { label: "Get LupiOS", items: ["download", "install"] },
        { label: "Use it", items: ["lupi"] },
        { label: "Learn more", items: ["security", "faq"] },
      ],
    }),
  ],
});
