import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

export default defineConfig({
	site: "https://www.sfti-radio.net",
	output: "server",
	integrations: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		icon(),
		sitemap(),
	],
	image: {
		domains: ["media.sfti-radio.net"],
		remotePatterns: [{ protocol: "https" }],
		layout: "constrained",
		objectFit: "cover",
		objectPosition: "center",
		responsiveStyles: true,
	},
	vite: {
		plugins: [tailwindcss()],
	},
	adapter: cloudflare({
		imageService: "compile",
		platformProxy: {
			enabled: true,
		},
	}),
});
