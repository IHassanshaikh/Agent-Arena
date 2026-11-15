import { z } from 'zod';

export const EventTypeEnum = z.enum([
  'run.created',
  'run.started',
  'run.completed',
  'run.failed',
  'llm.started',
  'llm.completed',
  'llm.failed',
  'tool.started',
  'tool.completed',
  'tool.failed',
  'retry.scheduled',
  'decision.summary',
  'context.accessed',
  'approval.requested',
  'approval.resolved',
  'fallback.activated',
  'warning.raised'
]);

export const EventStatusEnum = z.enum([
  'started',
  'success',
  'error',
  'retrying',
  'skipped',
  'informational'
]);

export const EventSourceEnum = z.enum([
  'agent',
  'agent-adapter',
  'gateway',
  'tool-runtime',
  'orchestrator',
  'collector'
]);

export const RunStatusEnum = z.enum([
  'queued',
  'running',
  'completed',
  'failed',
  'cancelled'
]);

export const BaseTraceEnvelopeSchema = z.object({
  event_id: z.string().uuid(),
  run_id: z.string(),
  trace_id: z.string(),
  span_id: z.string().nullable().optional(),
  parent_span_id: z.string().nullable().optional(),
  sequence: z.number().int().nonnegative(),
  event_type: EventTypeEnum,
  status: EventStatusEnum,
  occurred_at: z.string().datetime({ offset: true }).or(z.string()),
  duration_ms: z.number().nullable().optional(),
  source: EventSourceEnum,
  payload: z.record(z.any()).default({}),
  redaction_version: z.string().optional()
});

// Event payload schemas
export const RunCreatedPayloadSchema = z.object({
  task_label: z.string().min(1),
  agent_id: z.string().optional(),
  benchmark_id: z.string().optional(),
  environment: z.record(z.any()).optional()
});

export const RunStartedPayloadSchema = z.object({
  started_at: z.string(),
  environment: z.record(z.any()).optional(),
  agent_config: z.record(z.any()).optional()
});

export const RunCompletedPayloadSchema = z.object({
  outcome: z.string(),
  success: z.boolean(),
  final_artifact_refs: z.array(z.string()).optional(),
  summary: z.string().optional()
});

export const RunFailedPayloadSchema = z.object({
  error_code: z.string(),
  safe_error_message: z.string(),
  stack_trace_snippet: z.string().optional()
});

export const LLMStartedPayloadSchema = z.object({
  provider: z.string(),
  model: z.string(),
  request_id: z.string().optional(),
  purpose: z.string().optional(),
  prompt_summary: z.string().optional()
});

export const LLMCompletedPayloadSchema = z.object({
  provider: z.string(),
  model: z.string(),
  request_id: z.string().optional(),
  input_tokens: z.number().nonnegative(),
  output_tokens: z.number().nonnegative(),
  latency_ms: z.number().nonnegative(),
  estimated_cost: z.number().nonnegative().optional(),
  finish_reason: z.string().optional(),
  response_summary: z.string().optional(),
  is_usage_reported: z.boolean().optional().default(true)
});

export const LLMFailedPayloadSchema = z.object({
  provider: z.string(),
  model: z.string(),
  request_id: z.string().optional(),
  status_code: z.number().optional(),
  retryable: z.boolean().default(false),
  error_code: z.string(),
  safe_error_message: z.string()
});

export const ToolStartedPayloadSchema = z.object({
  tool_name: z.string(),
  safe_arguments: z.record(z.any()),
  approval_id: z.string().optional(),
  operation_id: z.string().optional()
});

export const ToolCompletedPayloadSchema = z.object({
  tool_name: z.string(),
  result_summary: z.string(),
  duration_ms: z.number().nonnegative(),
  operation_id: z.string().optional(),
  resource_ref: z.string().optional()
});

export const ToolFailedPayloadSchema = z.object({
  tool_name: z.string(),
  error_code: z.string(),
  safe_error_message: z.string(),
  duration_ms: z.number().nonnegative().optional(),
  operation_id: z.string().optional()
});

export const RetryScheduledPayloadSchema = z.object({
  operation_id: z.string(),
  attempt: z.number().int().positive(),
  reason: z.string(),
  backoff_ms: z.number().nonnegative()
});

export const DecisionSummaryPayloadSchema = z.object({
  summary: z.string(),
  selected_action: z.string(),
  confidence: z.number().min(0).max(1).optional(),
  evidence_refs: z.array(z.string()).optional()
});

export const ContextAccessedPayloadSchema = z.object({
  resource_type: z.string(),
  resource_ref: z.string(),
  bytes_or_tokens: z.number().optional()
});

export const ApprovalRequestedPayloadSchema = z.object({
  action_type: z.string(),
  description: z.string(),
  approval_id: z.string()
});

export const ApprovalResolvedPayloadSchema = z.object({
  approval_id: z.string(),
  decision: z.enum(['approved', 'rejected']),
  reason: z.string().optional()
});

export const FallbackActivatedPayloadSchema = z.object({
  from_provider: z.string(),
  to_provider: z.string(),
  reason: z.string()
});

export const WarningRaisedPayloadSchema = z.object({
  warning_code: z.string(),
  safe_message: z.string()
});

export const IngestEventBatchSchema = z.object({
  events: z.array(BaseTraceEnvelopeSchema).min(1).max(500)
});

