# Product Requirements Document: Project Sentinel

| Metadata | Details |
| :--- | :--- |
| **Version** | 1.0 |
| **Status** | Draft |
| **Author** | Gemini Enterprise |
| **Date** | 2025-11-28 |

---

## 1. Introduction

**Project Sentinel** is a comprehensive, real-time system monitoring service designed to provide users with a deep and intuitive understanding of their machine's performance and health. Served as a modern, responsive web application, Sentinel will offer a centralized dashboard to monitor everything from high-level resource utilization to detailed hardware metrics and system logs. It will also provide essential system control functionalities, empowering users to manage processes and power states directly from the interface.

The service is built with a **Node.js backend** and a **React frontend**, ensuring a fast, responsive, and scalable solution.

### 1.1. Project Branding

*   **Project Name:** Sentinel
*   **Logo Concept:** A stylized, modern shield icon. Inside the shield, a clean, rhythmic heartbeat or pulse line graph will be depicted, symbolizing health, real-time monitoring, and protection.
*   **Color Palette:** Primary color will be a calming yet alert shade of blue against a dark background.

## 2. Goals and Objectives

**Primary Goal:** To provide a powerful, all-in-one web interface for real-time system monitoring and management that is both feature-rich and exceptionally user-friendly.

**Key Objectives:**
*   To offer a comprehensive, at-a-glance view of all critical system metrics.
*   To empower users with system control capabilities, reducing the need for command-line interfaces.
*   To ensure a seamless and intuitive user experience across all devices (desktop, tablet, mobile).
*   To create a visually appealing and comfortable interface through a polished dark theme.
*   To provide historical context for performance analysis.

## 3. User Experience (UX) & Design

The user experience will be a cornerstone of Project Sentinel. The design will be clean, modern, and data-focused.

*   **Theme:** The interface will exclusively use a **dark theme**. This reduces eye strain, improves readability of charts and text in low-light environments, and gives the application a professional, technical aesthetic.
*   **Responsive Design:** The application will be fully responsive and optimized for a **mobile-first experience**. All components, from charts to control buttons, will be designed to function flawlessly on touchscreens and smaller viewports, ensuring a consistent experience everywhere.
*   **Dashboard Layout:** The main dashboard will be a single-page application featuring modular "widgets" for each metric (CPU, RAM, etc.). Users will eventually be able to customize the layout by dragging, dropping, and resizing these widgets.
*   **Data Visualization:** Charts will be clear, easy to read, and will update in real-time with smooth animations. Tooltips will provide detailed information on hover.

## 4. Functional Requirements

### 4.1. Real-time Monitoring Dashboard
The core of Sentinel is a dashboard that displays real-time system metrics.

| Feature | Description |
| :--- | :--- |
| **Processor (CPU)** | Displays current overall CPU utilization as a percentage. A detailed view will show usage per core, clock speed, and temperature. |
| **Memory (RAM)** | Shows total, used, and free memory. A breakdown will display memory usage by top applications. |
| **GPU Usage** | Displays current GPU utilization percentage, memory usage, and temperature. (Requires compatible hardware/drivers). |
| **Storage** | Lists all connected storage drives, showing total capacity, used space, and free space for each as a visual bar. |
| **Network Activity** | Lists all network interfaces. Displays real-time upload and download speeds for the primary interface. A detailed view shows IP/MAC addresses and latency to a configurable endpoint (e.g., 8.8.8.8). |

### 4.2. System & Process Management
Users will have direct control over system processes and power states.

| Feature | Description |
| :--- | :--- |
| **Top Processes** | A live-updating list of the top 5-10 running processes, sortable by CPU or RAM usage. |
| **Kill Process** | A "kill" button will appear next to each process in the list. Clicking it will require a confirmation pop-up before terminating the process. **This action will require user authentication.** |
| **System Power Controls** | A dedicated control area with buttons for Sleep, Hibernate, and Shutdown. **These actions will also require confirmation and user authentication.** |

### 4.3. Historical Data & Reporting
Sentinel will store and present historical data for trend analysis.

| Feature | Description |
| :--- | :--- |
| **Data Storage** | Performance data (CPU, RAM, GPU, etc.) will be sampled every minute and stored in a local time-series database. |
| **Reporting View** | A separate "Reports" page will allow users to view historical data for any metric over pre-defined time ranges (e.g., "Last 24 Hours," "Last 7 Days") or a custom date range. |
| **Data Retention** | Data will be stored for a default period of 30 days. This will be configurable. |

### 4.4. System Information & Logs
A comprehensive view of the system's hardware, software, and logs.

| Feature | Description |
| :--- | :--- |
| **Hardware Details** | A static page listing detailed information about the system's components: CPU model, motherboard/BIOS version, GPU model, etc. |
| **Software Inventory** | A static page listing key installed applications and their version numbers. |
| **Log Viewer** | A real-time viewer for system and application logs. It will include search and filter capabilities to help diagnose issues. |

## 5. Non-Functional Requirements

| Requirement | Description |
| :--- | :--- |
| **Security** | All API endpoints that perform mutative actions (kill process, shutdown) must be secured and require user authentication. The web server should employ basic security best practices (e.g., use HTTPS). |
| **Performance** | The backend service should have a low performance overhead on the host system. The frontend should load quickly and feel responsive, even with real-time data updates. |
| **Alerting** | Users should be able to configure basic alerts (e.g., "notify me if CPU usage is over 90% for 5 minutes"). Notifications will initially be displayed within the web app. |

## 6. Technology Stack

*   **Backend:** Node.js with Express.js
*   **Frontend:** React
*   **Real-time Communication:** WebSockets
*   **Database:** InfluxDB or SQLite for historical data
