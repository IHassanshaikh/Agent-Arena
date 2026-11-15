import { db } from '../db';
import { redactObject } from './redaction';
import {
  BaseTraceEnvelopeSchema,
  TraceEnvelope,
  RunMetrics,
  calculateCost
} from '@agentarena/trace-contract';
import { getSocketServer } from '../socket';

export interface IngestionResult {
  persistedCount: number;
  duplicateCount: number;
  events: TraceEnvelope[];
}

export async function ingestEvents(events: any[]): Promise<IngestionResult> {
  let persistedCount = 0;
  let duplicateCount = 0;
  const persistedEvents: TraceEnvelope[] = [];

  for (const rawEvent of events) {
    const parseResult = BaseTraceEnvelopeSchema.safeParse(rawEvent);
    if (!parseResult.success) {
      console.warn('[Ingest] Invalid event schema rejected:', parseResult.error.format());
      continue;
    }

    const event = parseResult.data;

    // 1. Check if run exists, create if missing (or verify)
    const runCheck = await db.query('SELECT id, status, metrics, started_at FROM runs WHERE id = $1', [event.run_id]);
    if (runCheck.rows.length === 0) {
      // Auto-register run if not pre-created
      await db.query(
        `INSERT INTO runs (id, user_id, task_label, status, created_at, metrics)
         VALUES ($1, $2, $3, $4, NOW(), $5)`,
        [
          event.run_id,
          '00000000-0000-0000-0000-000000000001',
          event.payload?.task_label || 'Agent Execution Run',
          'running',
          JSON.stringify(createInitialMetrics())
        ]
      );
    }

    // 2. Idempotency check by event_id
    const existingById = await db.query('SELECT id FROM trace_events WHERE id = $1', [event.event_id]);
    if (existingById.rows.length > 0) {
      duplicateCount++;
      continue;
    }

    // 3. Sequence conflict check
    const existingBySeq = await db.query(
      'SELECT id FROM trace_events WHERE run_id = $1 AND sequence = $2',
      [event.run_id, event.sequence]
    );
    if (existingBySeq.rows.length > 0) {
      console.warn(`[Ingest] Sequence conflict for run ${event.run_id} at sequence ${event.sequence}`);
      duplicateCount++;
      continue;
    }

    // 4. Redact payload
    const redactedPayload = redactObject(event.payload);

    // 5. Insert event
    await db.query(
      `INSERT INTO trace_events
       (id, run_id, trace_id, span_id, parent_span_id, sequence, event_type, status, occurred_at, duration_ms, source, payload, redaction_version)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`,
      [
        event.event_id,
        event.run_id,
        event.trace_id,
        event.span_id || null,
        event.parent_span_id || null,
        event.sequence,
        event.event_type,
        event.status,
        event.occurred_at,
        event.duration_ms || null,
        event.source,
        JSON.stringify(redactedPayload),
        '1.0'
      ]
    );

    const savedEnvelope: TraceEnvelope = {
      ...event,
      payload: redactedPayload,
      redaction_version: '1.0'
    };

    persistedEvents.push(savedEnvelope);
    persistedCount++;

    // 6. Update aggregate run status & metrics
    await updateRunStateAndMetrics(savedEnvelope);

    // 7. Live broadcast to Socket.IO room
    const io = getSocketServer();
    if (io) {
      io.to(`run:${event.run_id}`).emit('trace:event', savedEnvelope);
    }
  }

  return {
    persistedCount,
    duplicateCount,
    events: persistedEvents
  };
}

function createInitialMetrics(): RunMetrics {
  return {
    total_input_tokens: 0,
    total_output_tokens: 0,
    total_tokens: 0,
    is_token_estimated: false,
    estimated_cost_usd: 0,
    duration_ms: 0,
    tool_time_ms: 0,
    model_calls: 0,
    tool_calls: 0,
    retries: 0,
    failures: 0,
    event_count: 0
  };
}

async function updateRunStateAndMetrics(event: TraceEnvelope): Promise<void> {
  const runRes = await db.query('SELECT status, metrics, started_at, finished_at FROM runs WHERE id = $1', [event.run_id]);
  if (runRes.rows.length === 0) return;

  const run = runRes.rows[0];
  const rawMetrics = run.metrics
    ? (typeof run.metrics === 'string' ? JSON.parse(run.metrics) : run.metrics)
    : {};

  const metrics: RunMetrics = {
    ...createInitialMetrics(),
    ...rawMetrics
  };

  let newStatus = run.status;
  let startedAt = run.started_at;
  let finishedAt = run.finished_at;

  metrics.event_count = (metrics.event_count || 0) + 1;

  if (event.event_type === 'run.started') {
    newStatus = 'running';
    startedAt = event.occurred_at;
  } else if (event.event_type === 'run.completed') {
    newStatus = 'completed';
    finishedAt = event.occurred_at;
  } else if (event.event_type === 'run.failed') {
    newStatus = 'failed';
    finishedAt = event.occurred_at;
    metrics.failures = (metrics.failures || 0) + 1;
  } else if (event.event_type === 'llm.started') {
    metrics.model_calls = (metrics.model_calls || 0) + 1;
  } else if (event.event_type === 'llm.completed') {
    const input = Number(event.payload.input_tokens || 0);
    const output = Number(event.payload.output_tokens || 0);
    const model = event.payload.model || 'default';
    const cost = calculateCost(model, input, output, event.payload.is_usage_reported !== false);

    metrics.total_input_tokens = (metrics.total_input_tokens || 0) + input;
    metrics.total_output_tokens = (metrics.total_output_tokens || 0) + output;
    metrics.total_tokens = (metrics.total_tokens || 0) + input + output;
    metrics.estimated_cost_usd = Number(((metrics.estimated_cost_usd || 0) + cost.estimated_cost_usd).toFixed(6));
  } else if (event.event_type === 'llm.failed') {
    metrics.failures = (metrics.failures || 0) + 1;
  } else if (event.event_type === 'tool.started') {
    metrics.tool_calls = (metrics.tool_calls || 0) + 1;
  } else if (event.event_type === 'tool.completed') {
    if (event.duration_ms) {
      metrics.tool_time_ms = (metrics.tool_time_ms || 0) + Math.round(event.duration_ms);
    }
  } else if (event.event_type === 'tool.failed') {
    metrics.failures = (metrics.failures || 0) + 1;
    if (event.duration_ms) {
      metrics.tool_time_ms = (metrics.tool_time_ms || 0) + Math.round(event.duration_ms);
    }
  } else if (event.event_type === 'retry.scheduled') {
    metrics.retries = (metrics.retries || 0) + 1;
  }

  // Calculate active duration if started_at is known
  if (startedAt) {
    const end = finishedAt ? new Date(finishedAt).getTime() : new Date(event.occurred_at).getTime();
    metrics.duration_ms = Math.max(0, end - new Date(startedAt).getTime());
  }

  await db.query(
    `UPDATE runs
     SET status = $1, started_at = $2, finished_at = $3, metrics = $4
     WHERE id = $5`,
    [newStatus, startedAt, finishedAt, JSON.stringify(metrics), event.run_id]
  );

  const io = getSocketServer();
  if (io) {
    io.to(`run:${event.run_id}`).emit('metrics:update', { runId: event.run_id, metrics, status: newStatus });
  }
}

