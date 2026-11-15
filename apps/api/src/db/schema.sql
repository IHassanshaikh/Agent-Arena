-- Core schema for AgentArena Live Execution Traces

CREATE TABLE IF NOT EXISTS runs (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL,
  agent_id TEXT,
  benchmark_id TEXT,
  task_label TEXT NOT NULL,
  status TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  finished_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS trace_events (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  trace_id TEXT NOT NULL,
  span_id TEXT,
  parent_span_id TEXT,
  sequence BIGINT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT,
  occurred_at TIMESTAMPTZ NOT NULL,
  duration_ms DOUBLE PRECISION,
  source TEXT NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  redaction_version TEXT DEFAULT '1.0',
  UNIQUE (run_id, sequence)
);

CREATE INDEX IF NOT EXISTS idx_trace_events_run_sequence
  ON trace_events (run_id, sequence);

CREATE INDEX IF NOT EXISTS idx_trace_events_run_type
  ON trace_events (run_id, event_type);

CREATE INDEX IF NOT EXISTS idx_trace_events_span
  ON trace_events (run_id, span_id);

CREATE TABLE IF NOT EXISTS run_annotations (
  id UUID PRIMARY KEY,
  run_id UUID NOT NULL REFERENCES runs(id) ON DELETE CASCADE,
  event_id UUID,
  author_id TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS agents (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  adapter_type TEXT NOT NULL,
  configuration JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS benchmarks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  task_suite TEXT NOT NULL,
  task_version TEXT NOT NULL,
  configuration JSONB DEFAULT '{}'::jsonb
);

