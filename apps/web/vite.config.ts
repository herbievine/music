import {
	TanStackRouterCodeSplitterVite,
	TanStackRouterGeneratorVite,
} from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config
export default defineConfig({
	plugins: [
		TanStackRouterCodeSplitterVite(),
		TanStackRouterGeneratorVite(),
		react(),
		VitePWA({
			workbox: {
				runtimeCaching: [
					{
						urlPattern: ({ request, url }) =>
							request.destination === "audio" || url.pathname.endsWith(".mp3"),
						handler: "NetworkOnly",
					},
				],
				// Optional: make sure SPA fallback doesn't swallow audio
				navigateFallbackDenylist: [/\.mp3$/],
			},
			manifest: {
				id: "/",
				scope: "/",
				start_url: "/",
				lang: "en-us",
				name: "Music",
				short_name: "Music",
				description: "Music player",
				icons: [
					{
						src: "pwa-64x64.png",
						sizes: "64x64",
						type: "image/png",
					},
					{
						src: "pwa-192x192.png",
						sizes: "192x192",
						type: "image/png",
					},
					{
						src: "pwa-512x512.png",
						sizes: "512x512",
						type: "image/png",
					},
					{
						src: "maskable-icon-512x512.png",
						sizes: "512x512",
						type: "image/png",
						purpose: "maskable",
					},
				],
				theme_color: "#18181b",
				background_color: "#18181b",
				display: "standalone",
				orientation: "portrait",
			},
			devOptions: {
				enabled: true,
			},
		}),
	],
});
