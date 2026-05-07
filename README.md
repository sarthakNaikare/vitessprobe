<div align="center">

# 🔬 VitessProbe

### *Autonomous Vitess Cluster Intelligence Platform*

[![Live Demo](https://img.shields.io/badge/🟢%20LIVE%20DEMO-vitessprobe.vercel.app-00ff88?style=for-the-badge&logoColor=white)](https://vitessprobe.vercel.app)
[![Backend](https://img.shields.io/badge/⚡%20API-Render%20%7C%20Backend-46e3b7?style=for-the-badge)](https://vitessprobe-backend.onrender.com)
[![Database](https://img.shields.io/badge/🐘%20Neon-Serverless%20PostgreSQL-4169E1?style=for-the-badge)](https://neon.tech)
[![Portfolio](https://img.shields.io/badge/🧑‍💻%20Portfolio-sarthaknaikare.github.io-ff6b6b?style=for-the-badge)](https://sarthaknaikare.github.io)

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React%2018-20232A?style=flat-square&logo=react&logoColor=61DAFB)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![D3](https://img.shields.io/badge/D3.js-F9A03C?style=flat-square&logo=d3dotjs&logoColor=white)](https://d3js.org)
[![Tailwind](https://img.shields.io/badge/Tailwind-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vercel](https://img.shields.io/badge/Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![Render](https://img.shields.io/badge/Render-46E3B7?style=flat-square&logo=render&logoColor=black)](https://render.com)

</div>

---

## ⚡ What Is This?

> **Full visibility into your Vitess cluster. In real time. With root cause analysis built in.**

VitessProbe is a production grade autonomous intelligence platform for Vitess database clusters. It gives engineers deep observability into cluster health through live VTTablet monitoring, scatter query detection, incident timelines, and AI assisted root cause analysis reports. When something breaks in your cluster, VitessProbe tells you what happened, why it happened, and shows you the causation chain through interactive D3 force directed graphs.

Built for engineers operating at PlanetScale scale.

---

## 🚀 Live Links

| Service | URL | Status |
|---------|-----|--------|
| 🌐 **Frontend** | [vitessprobe.vercel.app](https://vitessprobe.vercel.app) | 🟢 Live |
| ⚙️ **Backend API** | [vitessprobe-backend.onrender.com](https://vitessprobe-backend.onrender.com) | 🟢 Live |
| 🐘 **Database** | Neon Serverless PostgreSQL | 🟢 Live |
| 📁 **GitHub** | [github.com/sarthakNaikare/vitessprobe](https://github.com/sarthakNaikare/vitessprobe) | ✅ Public |
| 🧑‍💻 **Portfolio** | [sarthaknaikare.github.io](https://sarthaknaikare.github.io) | 🟢 Live |

---

## 🌟 Features

### 📊 Dashboard
- Live cluster health overview with real time VTTablet status
- Incident feed with severity scoring and timeline visualization
- WebSocket powered live data stream for zero latency updates

### 🔍 Query Center
- Scatter query detection across VTGate query logs
- Query pattern analysis with latency distribution charts
- Filter and drill down by tablet, keyspace, or time window

### 🖥️ Tablet Inspector
- Per tablet health monitoring with shard and keyspace context
- Live replication lag, QPS, and error rate tracking
- Historical trend lines for capacity planning

### 📋 Report Generator
- AI assisted Root Cause Analysis report generation
- Export as PDF, Markdown, or JSON
- Client side PDF generation via jsPDF, no server round trip

### 📥 Import Hub
- Import Prometheus metrics dumps and VTGate query logs
- Automatic parsing, normalization, and ingestion into Neon PostgreSQL

### 🕸️ Incident Detail
- Full incident analysis with D3 force directed causation graphs
- Interactive node exploration for tracing failure propagation
- Timeline scrubbing across the incident lifecycle

---

## 🏗️ Architecture

\`\`\`
┌─────────────────────────────────────────────────────────────┐
│                      CLIENT (React 18)                      │
│  Dashboard · QueryCenter · TabletInspector · ReportGen      │
│  ImportHub · IncidentDetail · Simulator · Timeline          │
│                  vitessprobe.vercel.app                     │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS REST + WebSocket
┌───────────────────────────▼─────────────────────────────────┐
│                    BACKEND (FastAPI)                         │
│  /incidents · /cluster · /tablets · /queries · /reports     │
│  /simulator · /import · /websocket · /health               │
│           vitessprobe-backend.onrender.com                  │
└───────────────────────────┬─────────────────────────────────┘
                            │ asyncpg
┌───────────────────────────▼─────────────────────────────────┐
│              DATABASE (Neon Serverless PostgreSQL)           │
│                                                             │
│  incidents   ← Cluster incident records + severity scores   │
│  tablets     ← VTTablet health snapshots                    │
│  queries     ← VTGate query logs + scatter detection        │
│  reports     ← Generated RCA reports                        │
└─────────────────────────────────────────────────────────────┘
\`\`\`

---

## 🛠️ Tech Stack

| Layer | Technology | Why |
|-------|-----------|-----|
| 🗄️ **Database** | Neon Serverless PostgreSQL | Serverless, scales to zero, instant branching |
| ⚙️ **Backend** | FastAPI + Python + structlog | Async, typed, structured logging out of the box |
| 🌐 **Frontend** | React 18 + Vite + TypeScript | Fast builds, type safety, component driven |
| 📊 **Graphs** | D3.js | Force directed causation graphs for incident analysis |
| 🎨 **Styling** | Tailwind CSS + Custom Design System | Warm parchment theme with Playfair Display typography |
| 📄 **Reports** | jsPDF | Client side PDF generation, zero server dependency |
| 🔄 **State** | TanStack Query | Server state management with caching and refetching |
| 🚀 **Deploy** | Render + Vercel | Backend on Render, frontend on Vercel edge CDN |

---

## 🎨 Design System

\`\`\`
Colors:
  Mahogany Sidebar   →  #2C1810
  Parchment Canvas   →  #F7F3ED
  Copper Accents     →  #B87333

Typography:
  Headers            →  Playfair Display
  UI Elements        →  Inter
  Code and Mono      →  JetBrains Mono

Extras:
  Custom SVG arrow cursor (mahogany + copper)
  Page specific background patterns
  Staggered entry animations
  Watermark: VitessProbe ✦ Sarthak Naikare
\`\`\`

---

## 📁 Project Structure

\`\`\`
vitessprobe/
├── frontend/                  ← React 18 + Vite app (Vercel)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.tsx
│   │   │   ├── QueryCenter.tsx       ← Scatter detection
│   │   │   ├── TabletInspector.tsx   ← Live VTTablet health
│   │   │   ├── ReportGenerator.tsx   ← PDF/MD/JSON export
│   │   │   ├── ImportHub.tsx         ← Prometheus/VTGate import
│   │   │   ├── IncidentDetail.tsx    ← D3 causation graphs
│   │   │   ├── Simulator.tsx
│   │   │   ├── Timeline.tsx
│   │   │   ├── About.tsx
│   │   │   └── TechStack.tsx
│   │   └── components/
│   └── .env                   ← VITE_API_URL
└── backend/                   ← FastAPI app (Render)
    ├── main.py                ← 9 API routes + WebSocket
    ├── config.py
    ├── requirements.txt       ← 13 core packages
    └── .env                   ← NEON_DATABASE_URL, DEMO_MODE
\`\`\`

---

## 🚦 API Endpoints

\`\`\`
GET  /health          → Service health check
GET  /incidents       → Cluster incident feed with severity scores
GET  /cluster         → Overall cluster health snapshot
GET  /tablets         → Per tablet health and replication stats
GET  /queries         → VTGate query logs with scatter detection
GET  /reports         → Generated RCA reports
POST /reports         → Generate new RCA report
POST /import          → Import Prometheus or VTGate dump
WS   /websocket       → Live cluster event stream
\`\`\`

---

## 📦 Project Stats

\`\`\`
Total Pages:              11
API Routes:                9
Frontend Lines of Code:  ~4,500
Backend Lines of Code:   ~2,800
Design System Utilities:  30+ custom classes
Git Commits:              11
TypeScript Errors Fixed:  10+
\`\`\`

---

## 🧑‍💻 Author

**Sarthak Naikare**
CS Graduate · MIT ADT University, Pune · 2025

[![Portfolio](https://img.shields.io/badge/Portfolio-sarthaknaikare.github.io-ff6b6b?style=flat-square)](https://sarthaknaikare.github.io)
[![GitHub](https://img.shields.io/badge/GitHub-sarthakNaikare-181717?style=flat-square&logo=github)](https://github.com/sarthakNaikare)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Sarthak%20Naikare-0077B5?style=flat-square&logo=linkedin)](https://linkedin.com/in/sknaikare8500)

---

## 🗺️ Roadmap

- [ ] Fix CORS on Render backend (one redeploy away)
- [ ] Full mobile testing pass across all 11 pages
- [ ] LinkedIn launch post with screenshots
- [ ] Integrate real Vitess cluster via VTAdmin API
- [ ] Add AI query optimization suggestions in QueryCenter

---

<div align="center">

*Built with 🔬 and PostgreSQL in Pune, India*

[![Live Demo](https://img.shields.io/badge/🟢%20Try%20It%20Live-vitessprobe.vercel.app-00ff88?style=for-the-badge)](https://vitessprobe.vercel.app)

</div>
