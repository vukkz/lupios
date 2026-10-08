// @ts-check
// The LupiOS website: https://lupios.org (built by .github/workflows/website.yml, served by GitHub Pages).
// Local preview: `npm install` once, then `npm run dev` and open the address it prints.
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";

const repo = "https://github.com/vukkz/lupios";

export default defineConfig({
  site: "https://lupios.org",
  integrations: [
    starlight({
      title: "LupiOS",
      description: "A hardened, rollback-safe everyday Linux desktop, with Kali's hacking tools one command away.",
      logo: {
        dark: "./src/assets/lupios-lockup-dark.svg",
        light: "./src/assets/lupios-lockup-light.svg",
        alt: "LupiOS",
        replacesTitle: true,
      },
      favicon: "/favicon.svg",
      social: [{ icon: "github", label: "GitHub", href: repo }],
      customCss: ["./src/styles/lupios.css"],
      editLink: { baseUrl: `${repo}/edit/main/website/` },
      sidebar: [
        { label: "Get LupiOS", items: ["download", "install", "dual-boot"] },
        { label: "Use it", items: ["lupi"] },
        { label: "Learn more", items: ["security", "changes", "faq"] },
      ],
    }),
  ],
});
