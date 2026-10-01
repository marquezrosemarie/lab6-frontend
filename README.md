# Lab 6 React Frontend

React/Vite frontend for the LavaLust product API. It is a separate project from the backend and only communicates with the API over HTTP.

## Run locally

Copy `.env.example` to `.env`, set `VITE_API_BASE_URL` to the LavaLust API origin, then run:

```sh
npm install
npm run dev
```

## Build and deploy

```sh
npm ci
npm run build
```

For a Render Static Site, use this repository root, `npm ci && npm run build` as the build command, and `dist` as the publish directory. Set `VITE_API_BASE_URL` to the deployed LavaLust API origin before building. Configure the API's CORS allowlist with this site's exact origin.