# 🛡️ Sentinel Client

The frontend web application for Project Sentinel, built with React 19 and Vite 7.

## Tech Stack

- **Framework**: React 19 (`react`, `react-dom`)
- **Build Tool**: Vite 7 (`vite`, `@vitejs/plugin-react`)
- **Real-Time Communication**: `socket.io-client`
- **Charts & Visualization**: `recharts`
- **HTTP Client**: `axios`
- **Linting**: ESLint flat config (`eslint-plugin-react-hooks`, `eslint-plugin-react-refresh`)

## Available Scripts

### `npm run dev`
Starts the local development server with Vite Fast Refresh.
Requests to `/api` and `/socket.io` are automatically proxied to the backend on `http://localhost:80`.

### `npm run build`
Bundles and minifies the production application directly into `../server/public/`, ready for Express to serve statically.

### `npm run lint`
Runs ESLint across all `.js` and `.jsx` files.

### `npm run preview`
Locally previews the production build.

## Key Components

- **`Dashboard.jsx`**: Primary dashboard view incorporating metric widgets, system history, and power controls.
- **`ServiceShortcuts.jsx`**: Dynamically renders configurable application cards fetched from `/api/shortcuts` with `{host}` interpolation and flexible icon resolution.
- **`ProcessTable.jsx`**: Interactive, collapsible table of running processes with sorting, filtering, and 3-second confirmation kill triggers.
- **`HistoryCharts.jsx`**: Dual-axis real-time charts plotting CPU % and RAM usage over time.
- **`CpuWidget.jsx`**, **`RamWidget.jsx`**, **`GpuWidget.jsx`**, **`NetworkWidget.jsx`**: Specialized real-time telemetry display cards.
