import test from 'node:test';
import assert from 'node:assert/strict';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../src/db';
import { ingestEvents } from '../src/services/ingestion';

test('ingestion handles sequence ordering, idempotency and metric rollups', async () => {
  await db.init();

  const runId = uuidv4();
  const traceId = uuidv4();
  const baseTime = new Date().toISOString();

  // 1. Ingest run.started
  const res1 = await ingestEvents([
    {
      event_id: uuidv4(),
      run_id: runId,
      trace_id: traceId,
      sequence: 1,
      event_type: 'run.started',
      status: 'started',
      occurred_at: baseTime,
      source: 'agent',
      payload: { task_label: 'Integration Test Run' }
    }
  ]);
  assert.equal(res1.persistedCount, 1);
  assert.equal(res1.duplicateCount, 0);

  // 2. Ingest duplicate event_id (idempotency check)
  const duplicateEventId = uuidv4();
  await ingestEvents([
    {
      event_id: duplicateEventId,
      run_id: runId,
      trace_id: traceId,
      sequence: 2,
      event_type: 'llm.started',
      status: 'started',
      occurred_at: baseTime,
      source: 'gateway',
      payload: { provider: 'openai', model: 'gpt-4o' }
    }
  ]);

  const resDuplicate = await ingestEvents([
    {
      event_id: duplicateEventId,
      run_id: runId,
      trace_id: traceId,
      sequence: 2,
      event_type: 'llm.started',
      status: 'started',
      occurred_at: baseTime,
      source: 'gateway',
      payload: { provider: 'openai', model: 'gpt-4o' }
    }
  ]);
  assert.equal(resDuplicate.duplicateCount, 1);
  assert.equal(resDuplicate.persistedCount, 0);

  // 3. Ingest tool failure and retry
  await ingestEvents([
    {
      event_id: uuidv4(),
      run_id: runId,
      trace_id: traceId,
      span_id: 'tool-fail-1',
      sequence: 3,
      event_type: 'tool.failed',
      status: 'error',
      occurred_at: baseTime,
      duration_ms: 150,
      source: 'tool-runtime',
      payload: { tool_name: 'test_runner', error_code: 'TIMEOUT', safe_error_message: 'Timed out' }
    },
    {
      event_id: uuidv4(),
      run_id: runId,
      trace_id: traceId,
      span_id: 'retry-1',
      sequence: 4,
      event_type: 'retry.scheduled',
      status: 'retrying',
      occurred_at: baseTime,
      source: 'agent',
      payload: { operation_id: 'tool-fail-1', attempt: 2, reason: 'Timeout recovery', backoff_ms: 200 }
    }
  ]);

  // 4. Verify aggregated metrics in runs table
  const runRes = await db.query('SELECT status, metrics FROM runs WHERE id = $1', [runId]);
  assert.equal(runRes.rows.length, 1);
  const metrics = typeof runRes.rows[0].metrics === 'string'
    ? JSON.parse(runRes.rows[0].metrics)
    : runRes.rows[0].metrics;

  assert.equal(metrics.failures, 1);
  assert.equal(metrics.retries, 1);
  assert.equal(metrics.model_calls, 1);
  assert.equal(metrics.event_count, 4);

  await db.close();
});

