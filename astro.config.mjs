import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "astro/config";
import icon from "astro-icon";

export default defineConfig({
	output: "server",
	integrations: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		icon(),
	],
	image: {
		domains: ["pub-9027dac2ceac415eb2ad8d9818635281.r2.dev"],
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
		imageService: "cloudflare",
		platformProxy: {
			enabled: true,
		},
	}),
});
