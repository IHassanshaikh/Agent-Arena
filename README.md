# AGENTARENA — Live Execution Traces

> Observability & Trace-Inspection Flight Recorder for Autonomous AI Agents.  
> Built for the Geek Room AI Global Hackathon.  
> **Live Production Dashboard**: [https://agent-arena-benchmark.vercel.app/](https://agent-arena-benchmark.vercel.app/)

---

## Overview

AgentArena Live Execution Traces acts as a **flight recorder** for AI agents. While an agent executes tasks, the system captures structured, normalized events—model requests, tool invocations, retries, errors, decision summaries, and state changes—and streams them in real time to an interactive dashboard.

### Core Capabilities
- **Live Flight Recorder**: Chronological timeline of all execution events delivered in real-time over Socket.IO without page refreshes.
- **Span Waterfall View**: Visual Gantt-style tree showing nested operations (Run → Turn → LLM/Tools → Retries) and latency bottlenecks.
- **Resilience & Controlled Failure Demo**: Automatic capture of tool crashes, `retry.scheduled` attempts with backoff, and recovery verification.
- **Historical Replay Mode**: Step-by-step or automated playback with VCR controls (Play, Pause, Speed 0.5x–5x, Scrubber).
- **Side-by-Side Run Comparison**: Compare two agent runs on the same benchmark task with comparative delta cards and difference charts.
- **Zero-Data-Loss Ingestion**: Persist-first architecture using PostgreSQL (with embedded PGlite for instant local dev) and reconnect sequence catch-up.
- **Multi-Stage Security & Redaction**: Client and server-side recursive redaction of credentials, API keys, and bearer tokens.

---

## Monorepo Architecture

```
agentarena/
├── apps/
│   ├── api/                    # Express + Socket.IO + Ingestion Engine + PGlite DB
│   └── web/                    # Next.js 14 App Router + Tailwind CSS + Recharts
├── packages/
│   ├── trace-contract/         # Event schemas, Zod validation, model pricing catalog
│   ├── trace-sdk-js/           # TypeScript TraceEmitter SDK
│   └── trace-sdk-py/           # Python TraceEmitter & @traced_tool decorators
├── services/
│   └── agent-runner/           # Python benchmark runner with failure injection
├── examples/
│   └── seeded-react-login-bug/ # Seeded React benchmark task
└── docs/                       # Architecture, event schema, and security documentation
```

---

## Quickstart Guide

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (Optional)
AgentArena works out of the box with embedded PostgreSQL (PGlite). To customize or enable live Gemini LLM agent runs:
```bash
cp .env.example .env
```
*(Add your `GEMINI_API_KEY` from [Google AI Studio](https://aistudio.google.com/) if executing live LLM prompts).*

### 3. Run Automated Test Suites
```bash
# Test event schemas, Zod validation, and pricing calculations
npm run test:contract

# Test redaction engine and sequence monotonicity
npm run test:api
```

### 4. Seed Demo Benchmark Data
```bash
npm run seed
```

### 5. Start Development Servers
In terminal 1 (API & Socket.IO server on port 4000):
```bash
npm run dev:api
```

In terminal 2 (Next.js Dashboard on port 3000):
```bash
npm run dev:web
```

Open `http://localhost:3000` in your browser.

### 6. Launch a Live Agent Run
- Click **"Launch Benchmark"** in the dashboard header.
- Select **Agent Alpha** (Resilient with Retry Recovery) or **Agent Beta** (Baseline).
- Check **"Seed Controlled Tool Failure"** to observe live failure interception and recovery!
- Or run directly from terminal:
```bash
python services/agent-runner/agent_runner.py --agent alpha --seeded-failure true
```

