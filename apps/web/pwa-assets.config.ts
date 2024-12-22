import {
  defineConfig,
  minimal2023Preset as preset,
} from "@vite-pwa/assets-generator/config";

// https://vite-pwa-org.netlify.app/assets-generator/
export default defineConfig({
  preset,
  images: ["public/logo.svg"],
});
