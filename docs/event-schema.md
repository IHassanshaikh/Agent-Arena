# AgentArena: Event Schema & Taxonomy

Every trace event conforms to a normalized envelope with extensible JSONB payloads.

## Normalized Envelope

| Field | Type | Description |
| :--- | :--- | :--- |
| `event_id` | UUID | Globally unique event identity and idempotency key |
| `run_id` | UUID | Identifier of the benchmark run |
| `trace_id` | UUID | Groups the entire execution trace |
| `span_id` | String \| null | Current span identity |
| `parent_span_id` | String \| null | Parent span identity for nested operations |
| `sequence` | Integer | Monotonically increasing per-run sequence number |
| `event_type` | String | Event classification (e.g. `llm.completed`, `tool.failed`) |
| `status` | String | `started`, `success`, `error`, `retrying`, `skipped`, `informational` |
| `occurred_at` | Timestamp | ISO 8601 UTC timestamp |
| `duration_ms` | Number \| null | Execution latency for completed operations |
| `source` | String | `agent`, `gateway`, `tool-runtime`, `orchestrator`, `collector` |
| `payload` | JSONB | Sanitized and redacted event payload |
| `redaction_version` | String | Active redaction policy version (e.g. `1.0`) |

## Standard Event Types

- **Lifecycle**: `run.created`, `run.started`, `run.completed`, `run.failed`
- **Model Gateway**: `llm.started`, `llm.completed`, `llm.failed`
- **Tool Runtime**: `tool.started`, `tool.completed`, `tool.failed`
- **Resilience**: `retry.scheduled`, `fallback.activated`
- **Orchestration**: `decision.summary`, `context.accessed`
- **Governance**: `approval.requested`, `approval.resolved`, `warning.raised`

