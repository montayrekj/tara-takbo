# TaraTakbo

A web app for planning and visualizing running routes. Click on the map to build a path, see elevation along the way, and replay it in 3D. Share a link with friends so they can view or edit the same route.

## Features

- **Route builder** — Click anywhere on the map to add waypoints. Clicks snap to the nearest road or path using Mapbox Directions (walking profile), so your route follows real streets and trails.
- **Elevation profile** — Gain, loss, and a distance–elevation chart are computed from Mapbox terrain tiles so you know what you’re in for.
- **3D simulation** — Replay the route in 3D with terrain, a moving runner marker, and adjustable playback speed (1×–20×). Great for previewing a run or sharing a flythrough.
- **Share by link** — Copy a URL that encodes your waypoints. Anyone who opens it gets the same route and can continue editing or run the simulation. No account required.

## Quick start

### Prerequisites

- Node.js 18+
- A [Mapbox](https://www.mapbox.com) account (free tier is enough; no credit card needed)

### Run locally

1. Clone the repo and install dependencies:

   ```bash
   git clone https://github.com/your-username/tara-takbo.git
   cd tara-takbo
   npm install
   ```

2. Get a Mapbox **public** token from [mapbox.com](https://account.mapbox.com/access-tokens/) (default public token or create one with default scopes).

3. Either:
   - Run the dev server and enter your token in the app when prompted (it’s stored in the browser only), or
   - Create a `.env` file in the project root:
     ```bash
     VITE_MAPBOX_TOKEN=pk.your_mapbox_public_token_here
     ```
     Then start the dev server:

   ```bash
   npm run dev
   ```

4. Open the URL shown (e.g. `http://localhost:5173`). If you didn’t set `.env`, paste your Mapbox token on the first screen.

### Build for production

```bash
npm run build
npm run preview
```

Use the same `VITE_MAPBOX_TOKEN` in your build environment if you want the map to work without users entering a token.

## How to use

1. **Plan a route** — In “Route Builder” mode, click on the map to add points. Each click snaps to the nearest walkable path. Use _Undo_ to remove the last point and _Clear_ to start over. _Fit Route_ zooms the map to your full route.
2. **Check stats** — Distance, waypoint count, and elevation gain/loss update as you build. The elevation profile appears below the map when the route has elevation data.
3. **Simulate** — Click _Simulate Run_ to switch to 3D mode. The map tilts, terrain appears, and a runner moves along the route. Use the bottom bar to play/pause, scrub progress, and change speed. _Back to Builder_ returns to editing.
4. **Share** — Click _Share Route_ to copy a link that includes your route. Send it to others; when they open it, the same waypoints load so they can view or extend the route.

## Tech stack

- **React 18** + **TypeScript** + **Vite**
- **Mapbox GL JS** — base map, directions (snapping), terrain, geolocation
- **Turf.js** — geometry (e.g. point-along-route for simulation)
- **Recharts** — elevation profile chart
- **Tailwind CSS** — styling

## License

MIT
