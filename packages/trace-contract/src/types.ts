export type EventType =
  | 'run.created'
  | 'run.started'
  | 'run.completed'
  | 'run.failed'
  | 'llm.started'
  | 'llm.completed'
  | 'llm.failed'
  | 'tool.started'
  | 'tool.completed'
  | 'tool.failed'
  | 'retry.scheduled'
  | 'decision.summary'
  | 'context.accessed'
  | 'approval.requested'
  | 'approval.resolved'
  | 'fallback.activated'
  | 'warning.raised';

export type EventStatus =
  | 'started'
  | 'success'
  | 'error'
  | 'retrying'
  | 'skipped'
  | 'informational';

export type EventSource =
  | 'agent'
  | 'agent-adapter'
  | 'gateway'
  | 'tool-runtime'
  | 'orchestrator'
  | 'collector';

export type RunStatus =
  | 'queued'
  | 'running'
  | 'completed'
  | 'failed'
  | 'cancelled';

export interface TraceEnvelope<T = Record<string, any>> {
  event_id: string;
  run_id: string;
  trace_id: string;
  span_id?: string | null;
  parent_span_id?: string | null;
  sequence: number;
  event_type: EventType;
  status: EventStatus;
  occurred_at: string;
  duration_ms?: number | null;
  source: EventSource;
  payload: T;
  redaction_version?: string;
}

export interface RunMetrics {
  total_input_tokens: number;
  total_output_tokens: number;
  total_tokens: number;
  is_token_estimated: boolean;
  estimated_cost_usd: number;
  duration_ms: number;
  tool_time_ms: number;
  model_calls: number;
  tool_calls: number;
  retries: number;
  failures: number;
  event_count: number;
}

export interface RunRecord {
  id: string;
  user_id: string;
  agent_id?: string | null;
  benchmark_id?: string | null;
  task_label: string;
  status: RunStatus;
  started_at?: string | null;
  finished_at?: string | null;
  created_at: string;
  metrics?: RunMetrics;
  metadata?: Record<string, any>;
}

export interface RunAnnotation {
  id: string;
  run_id: string;
  event_id?: string | null;
  author_id: string;
  note: string;
  created_at: string;
}

// Event Specific Payload Interfaces
export interface RunCreatedPayload {
  task_label: string;
  agent_id?: string;
  benchmark_id?: string;
  environment?: Record<string, any>;
}

export interface RunStartedPayload {
  started_at: string;
  environment?: Record<string, any>;
  agent_config?: Record<string, any>;
}

export interface RunCompletedPayload {
  outcome: string;
  success: boolean;
  final_artifact_refs?: string[];
  summary?: string;
}

export interface RunFailedPayload {
  error_code: string;
  safe_error_message: string;
  stack_trace_snippet?: string;
}

export interface LLMStartedPayload {
  provider: string;
  model: string;
  request_id?: string;
  purpose?: string;
  prompt_summary?: string;
}

export interface LLMCompletedPayload {
  provider: string;
  model: string;
  request_id?: string;
  input_tokens: number;
  output_tokens: number;
  latency_ms: number;
  estimated_cost?: number;
  finish_reason?: string;
  response_summary?: string;
  is_usage_reported?: boolean;
}

export interface LLMFailedPayload {
  provider: string;
  model: string;
  request_id?: string;
  status_code?: number;
  retryable: boolean;
  error_code: string;
  safe_error_message: string;
}

export interface ToolStartedPayload {
  tool_name: string;
  safe_arguments: Record<string, any>;
  approval_id?: string;
  operation_id?: string;
}

export interface ToolCompletedPayload {
  tool_name: string;
  result_summary: string;
  duration_ms: number;
  operation_id?: string;
  resource_ref?: string;
}

export interface ToolFailedPayload {
  tool_name: string;
  error_code: string;
  safe_error_message: string;
  duration_ms?: number;
  operation_id?: string;
}

export interface RetryScheduledPayload {
  operation_id: string;
  attempt: number;
  reason: string;
  backoff_ms: number;
}

export interface DecisionSummaryPayload {
  summary: string;
  selected_action: string;
  confidence?: number;
  evidence_refs?: string[];
}

export interface ContextAccessedPayload {
  resource_type: string;
  resource_ref: string;
  bytes_or_tokens?: number;
}

export interface ApprovalRequestedPayload {
  action_type: string;
  description: string;
  approval_id: string;
}

export interface ApprovalResolvedPayload {
  approval_id: string;
  decision: 'approved' | 'rejected';
  reason?: string;
}

export interface FallbackActivatedPayload {
  from_provider: string;
  to_provider: string;
  reason: string;
}

export interface WarningRaisedPayload {
  warning_code: string;
  safe_message: string;
}

export interface ModelPricing {
  inputPerMillion: number;
  outputPerMillion: number;
}

