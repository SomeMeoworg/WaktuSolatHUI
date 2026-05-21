<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Waktu Solat Expressive

A modern, highly customizable, and extremely polished Islamic Prayer Times application built with React, Vite, and Material 3 Expressive (M3E) design standards.

## Deployment (Cloudflare Pages - Recommended)

This application is 100% optimized and ready for deployment on **Cloudflare Pages**. It utilizes Cloudflare Pages Functions (`functions/api/`) to handle backend proxy requests, bypassing CORS issues without requiring a dedicated Node.js server.

1. Push this repository to GitHub.
2. Log into the Cloudflare Dashboard and navigate to **Workers & Pages** -> **Create application** -> **Pages** -> **Connect to Git**.
3. Select your repository.
4. **Build settings:**
   - **Framework preset:** `Vite`
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
5. Click **Save and Deploy**. Cloudflare will automatically detect the `functions` folder and build your serverless APIs.

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   `npm install`
2. Run the local dev server (this uses a local Express server to proxy APIs during development):
   `npm run dev`

## Optimizations Included
- **Vite Chunk Splitting:** `vite.config.ts` heavily splits vendor files (React, Material Web, Leaflet, Framer Motion) to ensure small bundle sizes and parallel downloading.
- **Cloudflare Cache Headers:** `public/_headers` enforces strict, aggressive caching on all static assets and heavy GeoJSON maps.
- **Dynamic Polyfills & Tooling:** Esbuild minifies aggressively, stripping console logs and debugging statements.

