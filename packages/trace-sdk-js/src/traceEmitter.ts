import { v4 as uuidv4 } from 'uuid';
import {
  TraceEnvelope,
  EventType,
  EventStatus,
  EventSource
} from '@agentarena/trace-contract';

export interface TraceEmitterOptions {
  runId: string;
  traceId?: string;
  apiBaseUrl?: string;
  producerToken?: string;
  source?: EventSource;
  onEvent?: (event: TraceEnvelope<any>) => void | Promise<void>;
}

export class TraceEmitter {
  public readonly runId: string;
  public readonly traceId: string;
  private sequence: number = 0;
  private apiBaseUrl: string;
  private producerToken: string;
  private source: EventSource;
  private currentSpanId: string | null = null;
  private currentParentSpanId: string | null = null;
  private onEvent?: (event: TraceEnvelope<any>) => void | Promise<void>;
  private buffer: TraceEnvelope<any>[] = [];
  private isFlushing: boolean = false;

  constructor(options: TraceEmitterOptions) {
    this.runId = options.runId;
    this.traceId = options.traceId || uuidv4();
    this.apiBaseUrl = (options.apiBaseUrl || 'http://localhost:4000').replace(/\/$/, '');
    this.producerToken = options.producerToken || 'dev-producer-token';
    this.source = options.source || 'agent';
    this.onEvent = options.onEvent;
  }

  public getSequence(): number {
    return this.sequence;
  }

  public setSpan(spanId: string | null, parentSpanId: string | null = null): void {
    this.currentSpanId = spanId;
    this.currentParentSpanId = parentSpanId;
  }

  public async emit<T = Record<string, any>>(
    eventType: EventType,
    status: EventStatus,
    payload: T,
    options?: {
      spanId?: string | null;
      parentSpanId?: string | null;
      durationMs?: number | null;
      occurredAt?: string;
      source?: EventSource;
    }
  ): Promise<TraceEnvelope<T>> {
    this.sequence += 1;

    const envelope: TraceEnvelope<T> = {
      event_id: uuidv4(),
      run_id: this.runId,
      trace_id: this.traceId,
      span_id: options?.spanId !== undefined ? options.spanId : this.currentSpanId,
      parent_span_id: options?.parentSpanId !== undefined ? options.parentSpanId : this.currentParentSpanId,
      sequence: this.sequence,
      event_type: eventType,
      status: status,
      occurred_at: options?.occurredAt || new Date().toISOString(),
      duration_ms: options?.durationMs ?? null,
      source: options?.source || this.source,
      payload: this.sanitizePayload(payload),
      redaction_version: '1.0'
    };

    if (this.onEvent) {
      try {
        await this.onEvent(envelope);
      } catch (err) {
        console.error('[TraceEmitter] onEvent callback error:', err);
      }
    }

    this.buffer.push(envelope);
    this.scheduleFlush();

    return envelope;
  }

  private sanitizePayload<T>(payload: T): T {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }
    const sensitiveKeys = ['api_key', 'apikey', 'secret', 'password', 'access_token', 'refresh_token', 'authorization', 'bearer'];
    const metricKeys = ['input_tokens', 'output_tokens', 'total_tokens', 'tokens'];
    const copy: any = Array.isArray(payload) ? [...payload] : { ...payload };

    for (const key of Object.keys(copy)) {
      const lowerKey = key.toLowerCase();
      if (!metricKeys.includes(lowerKey) && (sensitiveKeys.some(sk => lowerKey.includes(sk)) || lowerKey === 'token')) {
        copy[key] = '[REDACTED_SDK]';
      } else if (typeof copy[key] === 'object' && copy[key] !== null) {
        copy[key] = this.sanitizePayload(copy[key]);
      }
    }
    return copy;
  }

  private scheduleFlush(): void {
    if (this.isFlushing) return;
    this.isFlushing = true;
    setTimeout(() => {
      this.flush().finally(() => {
        this.isFlushing = false;
      });
    }, 50);
  }

  public async flush(): Promise<void> {
    if (this.buffer.length === 0) return;
    const batch = [...this.buffer];
    this.buffer = [];

    try {
      const response = await fetch(`${this.apiBaseUrl}/api/runs/${this.runId}/events`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.producerToken}`
        },
        body: JSON.stringify({ events: batch })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.warn(`[TraceEmitter] Failed to send ${batch.length} events: HTTP ${response.status} - ${errorText}`);
      }
    } catch (err) {
      // Best effort buffer retention on temporary transport disconnect
      this.buffer.unshift(...batch);
      console.warn('[TraceEmitter] Transport error during flush, re-queuing events:', (err as Error).message);
    }
  }
}

