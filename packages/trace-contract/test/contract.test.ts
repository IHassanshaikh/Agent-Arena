import test from 'node:test';
import assert from 'node:assert/strict';
import {
  BaseTraceEnvelopeSchema,
  LLMCompletedPayloadSchema,
  ToolCompletedPayloadSchema,
  RetryScheduledPayloadSchema,
  calculateCost
} from '../src/index';

test('validates correct BaseTraceEnvelope', () => {
  const sampleEvent = {
    event_id: 'a2a1d0f0-0000-4000-8000-000000000001',
    run_id: 'b3b2d1f1-0000-4000-8000-000000000001',
    trace_id: 'c4c3e2f2-0000-4000-8000-000000000001',
    span_id: 'tool-17',
    parent_span_id: 'turn-3',
    sequence: 17,
    event_type: 'tool.completed',
    status: 'success',
    occurred_at: '2026-11-11T17:30:00.000Z',
    duration_ms: 342,
    source: 'agent-adapter',
    payload: {
      tool_name: 'read_file',
      result_summary: 'Read 86 lines'
    }
  };

  const parsed = BaseTraceEnvelopeSchema.safeParse(sampleEvent);
  assert.equal(parsed.success, true);
});

test('rejects negative sequence numbers', () => {
  const invalidEvent = {
    event_id: 'a2a1d0f0-0000-4000-8000-000000000001',
    run_id: 'b3b2d1f1-0000-4000-8000-000000000001',
    trace_id: 'c4c3e2f2-0000-4000-8000-000000000001',
    sequence: -1,
    event_type: 'tool.completed',
    status: 'success',
    occurred_at: '2026-11-11T17:30:00.000Z',
    source: 'agent-adapter',
    payload: {}
  };

  const parsed = BaseTraceEnvelopeSchema.safeParse(invalidEvent);
  assert.equal(parsed.success, false);
});

test('validates LLM completed payload and calculates cost', () => {
  const llmPayload = {
    provider: 'openai',
    model: 'gpt-4o',
    input_tokens: 1500,
    output_tokens: 300,
    latency_ms: 850
  };

  const parsed = LLMCompletedPayloadSchema.safeParse(llmPayload);
  assert.equal(parsed.success, true);

  const cost = calculateCost('gpt-4o', 1500, 300, true);
  assert.equal(cost.is_reported, true);
  assert.ok(cost.estimated_cost_usd > 0);
  assert.equal(cost.pricing_version, '2026.11.1');
});

test('validates retry scheduled payload', () => {
  const retryPayload = {
    operation_id: 'op-42',
    attempt: 2,
    reason: 'Connection reset by peer',
    backoff_ms: 500
  };

  const parsed = RetryScheduledPayloadSchema.safeParse(retryPayload);
  assert.equal(parsed.success, true);
});

