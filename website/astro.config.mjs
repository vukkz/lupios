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
      // The picture a shared link shows (Reddit, Discord, X...): made by scripts/og-image.mjs
      head: [
        ["og:image", "https://lupios.org/og.png"],
        ["og:image:width", "1200"],
        ["og:image:height", "630"],
        ["og:image:alt", "The LupiOS logo above night mountains"],
      ].map(([property, content]) => ({ tag: "meta", attrs: { property, content } }))
        .concat({ tag: "meta", attrs: { name: "twitter:image", content: "https://lupios.org/og.png" } }),
      social: [{ icon: "github", label: "GitHub", href: repo }],
      // Arimo: the Helvetica letter shapes of the logo, the same font as the home and download pages
      customCss: [
        "@fontsource/arimo/latin-400.css",
        "@fontsource/arimo/latin-700.css",
        "@fontsource/arimo/latin-400-italic.css",
        "./src/styles/lupios.css",
      ],
      editLink: { baseUrl: `${repo}/edit/main/website/` },
      sidebar: [
        // the download page is its own Astro page (src/pages/download.astro), not a docs page
        { label: "Get LupiOS", items: [{ label: "Download", link: "/download/" }, "install", "dual-boot"] },
        { label: "Use it", items: ["lupi"] },
        { label: "Learn more", items: ["security", "changes", "faq"] },
      ],
    }),
  ],
});
