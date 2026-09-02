# 🛡️ Sentinel

> **Real-time Host Resource Monitoring & System Management Dashboard**

Sentinel is a lightweight, real-time hardware telemetry and host management dashboard designed for personal workstations, home servers, and homelab environments. It provides deep visibility into CPU, Memory, GPU, Storage, and Network utilization, alongside interactive process inspection and remote power controls—all packaged in a sleek, responsive dark-themed web interface.

---

## ✨ Features

- **⚡ Real-Time System Telemetry**: Live metrics streamed continuously via WebSockets (`socket.io`):
  - **CPU**: Overall utilization %, clock speed, core count, brand, and temperature.
  - **Memory**: Real-time active, used, and free RAM gauges.
  - **GPU**: Graphics controller model, VRAM capacity, temperature, and live utilization percentage.
  - **Storage**: Multi-drive capacity bars, volume labels, used/free disk space.
  - **Network**: Real-time upload and download throughput across network interfaces.
- **🚀 Zero-Overhead Polling Architecture**: Engineered specifically for Windows 10/11 using native `typeperf` performance counter queries and Node.js `os` bindings instead of slow WMI/CIM bridges, completely eliminating WMI Provider Host CPU spikes.
- **🔗 Customizable Application Shortcuts**:
  - Define custom home server/application links (Plex, Jellyfin, Netdata, Home Assistant, etc.) via a local `shortcuts.json`.
  - Supports dynamic host substitution (`{host}`) so links automatically adapt whether accessing via `localhost`, machine hostname, or local IP address.
  - Configurable accent colors and flexible icon support (built-in presets, custom image URLs, or SVG paths).
  - Works like `.env`: `shortcuts.json` is excluded from git, while a tracked `template.shortcuts.json` provides out-of-the-box defaults.
- **📊 Historical Performance Trends**: Dual-axis historical telemetry chart powered by Recharts, graphing real-time CPU % and RAM (GB) with sliding time windows.
- **📋 Collapsible Task & Process Manager**:
  - Live inspection of top active processes.
  - Multi-column sorting (PID, Name, CPU %, Memory %, GPU %, Disk I/O).
  - Search/filter capability.
  - Safe process termination with a 3-second two-step confirmation dialog.
  - Collapsible card design with process count badge and persistent state memory across sessions (`localStorage`).
- **⚡ System Power Controls**: Two-step confirmation triggers for **Sleep**, **Hibernate**, **Restart**, and **Shutdown**.
- **📱 Fully Responsive Dark UI**: Mobile-first design built with React 19, CSS custom properties, and smooth animations.

---

## 🏗️ Project Architecture

```
Sentinel/
├── client/                     # React 19 + Vite 7 Frontend
│   ├── src/
│   │   ├── components/         # Modular Dashboard Widgets
│   │   │   ├── CpuWidget.jsx
│   │   │   ├── GpuWidget.jsx
│   │   │   ├── HistoryCharts.jsx
│   │   │   ├── NetworkWidget.jsx
│   │   │   ├── ProcessTable.jsx        # Collapsible process table
│   │   │   ├── RamWidget.jsx
│   │   │   └── ServiceShortcuts.jsx    # JSON-driven application shortcuts
│   │   ├── Dashboard.jsx       # Main dashboard layout & power controls
│   │   ├── App.jsx             # Root container & WebSocket connection
│   │   └── index.css           # Modern dark-theme stylesheet
│   ├── vite.config.js          # Configured to build directly into server/public
│   └── package.json
│
├── server/                     # Node.js + Express 5 Backend
│   ├── src/
│   │   ├── index.js            # Express server & static asset serving (Port 80)
│   │   ├── socket.js           # Multi-tier metric broadcast scheduler
│   │   ├── monitor.js          # Native typeperf & systeminformation engine
│   │   ├── api.js              # REST endpoints (/shortcuts, /process/kill, /system/power)
│   │   └── db.js               # SQLite time-series storage (sentinel.db)
│   ├── public/                 # Production-built client assets
│   ├── shortcuts.json          # Local application shortcuts (git-ignored)
│   ├── template.shortcuts.json # Tracked default shortcuts template
│   ├── start_server.bat        # Windows Administrator launcher script
│   └── package.json
│
├── .gitignore                  # Excludes shortcuts.json, database, and node_modules
├── .node-version               # Targeted Node version (24.11.1)
├── PRD.md                      # Product Requirements Document
└── README.md
```

---

## 🚦 Getting Started

### Prerequisites

- **Node.js**: `v20.0.0` or higher (tested with Node `v24.x`).
- **OS**: Windows 10/11 (utilizes native Windows `typeperf` performance counters; cross-platform fallback for Linux/macOS).
- **Permissions**: Administrative privileges are required to bind to Port 80 and execute power/process actions.

### 1. Installation

Clone the repository and install dependencies for both client and server:

```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Configure Shortcuts (Optional)

Sentinel automatically initializes `server/shortcuts.json` from `server/template.shortcuts.json` on first run. You can customize the shortcuts directly in `server/shortcuts.json`:

```json
[
  {
    "name": "Plex",
    "url": "http://{host}:32400/web",
    "color": "#e5a00d",
    "icon": "plex"
  },
  {
    "name": "Home Assistant",
    "url": "http://{host}:8123",
    "color": "#41bdf5",
    "icon": "server"
  }
]
```

- **`{host}` Placeholder**: Replaces `{host}` with `window.location.hostname` dynamically.
- **Available Icon Presets**: `plex`, `jellyfin`, `netdata`, `server`, `terminal`, `download`, `database`, `cloud`, `dashboard`, `globe`.
- **Image URLs**: External URLs (`https://...`), absolute paths (`/icons/...`), or base64 data URIs.
- **Custom SVG**: Raw SVG markup or SVG path string (`d="..."`).

### 3. Build Frontend

The client Vite configuration is set up to bundle directly into `server/public`:

```bash
cd client
npm run build
```

### 4. Run Sentinel Server

To start the Sentinel backend server:

```bash
cd server
node src/index.js
```

Or run using the provided Windows Administrator batch script:

```bash
server\start_server.bat
```

Once running, open your web browser and navigate to:
- **Local Machine**: [http://localhost](http://localhost)
- **Local Network**: `http://<your-machine-ip>`

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `GET` | `/api/shortcuts` | Returns the parsed `shortcuts.json` array (auto-creates from template if absent). |
| `GET` | `/api/shortcuts/status` | Tests TCP/HTTP connectivity for all configured shortcuts and returns online/offline status and latency. |
| `POST` | `/api/process/kill` | Terminates a process by numeric `pid` (`{ "pid": 1234 }`). |
| `POST` | `/api/system/power` | Executes a system power command (`{ "action": "sleep" \| "hibernate" \| "restart" \| "shutdown" }`). |

---

## 🛠️ Development

### Running Client in Dev Mode

To run Vite with Hot Module Replacement (HMR):

```bash
cd client
npm run dev
```

The Vite dev server proxies `/api` and `/socket.io` requests to the Sentinel backend on `http://localhost:80`.

### Linting

```bash
cd client
npm run lint
```

---

## 📄 License

This project is licensed under the ISC License.
