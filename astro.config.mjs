import cloudflare from "@astrojs/cloudflare";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
	site: "https://www.sfti-radio.net",
	output: "server",
	prefetch: {
		prefetchAll: true,
	},
	integrations: [
		react({
			babel: {
				plugins: [["babel-plugin-react-compiler"]],
			},
		}),
		sitemap(),
	],
	experimental: {
		rustCompiler: true,
		queuedRendering: {
			enabled: true,
		},
		clientPrerender: true,
	},
	fonts: [
		{
			provider: fontProviders.local(),
			name: "Encode Sans",
			cssVariable: "--default-font-family",
			fallbacks: ["system-ui", "-apple-system", "sans-serif"],
			options: {
				variants: [
					{
						src: ["./public/fonts/EncodeSans_variable.woff2"],
						weight: "100 900",
						style: "normal",
					},
				],
			},
		},
		{
			provider: fontProviders.local(),
			name: "Cinzel",
			cssVariable: "--font-cinzel",
			fallbacks: ["serif"],
			options: {
				variants: [
					{
						src: ["./public/fonts/Cinzel-VariableFont_wght.woff2"],
						weight: "400 900",
						style: "normal",
					},
				],
			},
		},
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
			build: "compile", 
			runtime: "cloudflare-binding"
		}),
});
