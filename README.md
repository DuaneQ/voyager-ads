# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    # TravalPass Ads — Self-serve Advertising Portal

    This repository contains the TravalPass Ads frontend — a self-serve portal where advertisers create and manage campaigns that run on the TravalPass consumer products (for example the React Native app located at /Users/icebergslim/projects/voyager-RN in your local environment).

    Overview

    - TravalPass is a travel planning platform that helps users discover, plan, and book trips. Core user-facing surfaces include itinerary generation, a discovery feed (cards & video), and personalized AI-generated itineraries.
    - The Ads portal (this repo) is a lightweight, self-serve UI where advertisers build campaigns, upload creatives, choose placements (Itinerary Feed, Video Feed, AI Itinerary Placements), set budgets, and review performance.

    How the Ads portal fits into the TravalPass ecosystem

    - Placement: advertisers create creatives and targeting in this portal. The consumer app (`voyager-RN`) consumes ad metadata and creatives via the ad delivery APIs and renders them inside itineraries, feeds, and AI-generated plans.
    - Measurement: the consumer app reports impressions, clicks, and conversions back to the ad backend. The Ads portal surfaces aggregated metrics and status (live, paused, draft).
    - Integration points: this repo assumes an ad backend and storage for creatives, plus endpoints that the consumer app hits to fetch ads for a specific user context (destination, dates, itinerary id).

    Key products supported by this portal

    - Itinerary Feed — Card-style ads shown in itinerary and discovery lists (image + headline + price/offer + CTA). Best for direct conversions and time-sensitive promotions.
    - Video Feed — Short-form or in-stream video inventory for awareness and inspiration. Measured by views and view-through conversions.
    - AI Itinerary Placement — Native recommendations inserted inside AI-generated itineraries. High-intent placement with premium pricing; these items must be clearly labeled as sponsored.

    Local development

    - Start the dev server:
    ```bash
    npm install
    npm run dev
    ```
    - Landing page: http://localhost:5173/
    - Products page: http://localhost:5173/products

    Testing

    - Run the unit tests:
    ```bash
    npm test
    ```

    Notes for integrators

    - This repo is the advertiser-facing UI only; production ad serving requires a backend (ad registry, bidding/auction logic, creative storage, reporting). Provide the backend endpoints and credentials via environment variables when wiring up to a real system.
    - For local end-to-end testing, point the consumer app (`voyager-RN`) at a development ad backend or mocked endpoints that return ad payloads matching the portal's creative schema.

    Contributing

    - Follow the repo's TypeScript and linting guidelines. Keep UI changes accessible (ARIA roles, keyboard focus, visible focus states) and test critical flows.

    If you want, I can add example API schemas and a small mock server to simulate ad delivery for local end-to-end testing.
