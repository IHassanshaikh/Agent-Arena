# AgentArena: System Architecture

AgentArena Live Execution Traces is an observability flight recorder designed to record, persist, stream, and inspect autonomous AI agent behavior.

## Core Architectural Components

```
┌─────────────────────────────────────────────────────────────┐
│                       NEXT.JS DASHBOARD                     │
│  - Runs Overview Table   - Replay Mode   - Waterfall Gantt  │
│  - Live Timeline Stream  - Run Inspector - Comparison Diff  │
└──────────────────────────────▲──────────────────────────────┘
                               │ HTTP / WebSocket (Socket.IO)
┌──────────────────────────────┴──────────────────────────────┐
│                    NODE.JS API & INGESTION                  │
│  - Express REST Endpoints    - Zod Event Validator          │
│  - Socket.IO Rooms           - Recursive Redaction Engine   │
│  - Reconnect Sequence Sync   - Idempotency & Order Guard    │
└──────────────────────────────┬──────────────────────────────┘
                               │ Persist-First SQL
┌──────────────────────────────▼──────────────────────────────┐
│                      POSTGRESQL DATABASE                    │
│  - runs table                - JSONB payload storage        │
│  - trace_events table        - PGlite embedded / pg pool    │
└──────────────────────────────▲──────────────────────────────┘
                               │ Event Emissions
┌──────────────────────────────┴──────────────────────────────┐
│                INSTRUMENTED AGENT RUNNER (PYTHON)           │
│  - TraceEmitter Client       - Bifrost Gateway Wrapper      │
│  - Tool Tracing Decorator    - Controlled Failure Injector  │
└─────────────────────────────────────────────────────────────┘
```

## Data Ingestion & Streaming Flow

1. **Run Initialization**: Web app or benchmark harness requests `POST /api/runs`. API creates run with `queued` status and returns a producer execution token.
2. **Event Production**: As the agent executes (or model gateway responds), the `TraceEmitter` packages events with unique `event_id`, run-scoped monotonic `sequence`, UTC timestamp, and sanitized payload.
3. **Ingestion & Validation**:
   - Ingestion validates event against strict Zod schema.
   - Enforces unique `(run_id, sequence)` and `event_id` idempotency.
   - Applies deep server-side recursive redaction.
4. **Persist First**: Event is written to PostgreSQL `trace_events` table before broadcasting. If a client drops connection, no events are lost.
5. **Real-time Delivery**: Collector publishes persisted event to Socket.IO room `run:${run_id}`.
6. **Reconnect Catch-up**: Clients track highest received sequence number. On reconnect, client requests `GET /api/runs/:id/events?after={seq}` to guarantee zero gap.

