import os
import time
import uuid
import json
import urllib.request
import urllib.error
from datetime import datetime, timezone
from typing import Any, Dict, Optional, Callable
from functools import wraps

SENSITIVE_KEYS = {"api_key", "apikey", "secret", "password", "access_token", "refresh_token", "authorization", "bearer", "cookie"}
METRIC_KEYS = {"input_tokens", "output_tokens", "total_tokens", "tokens", "bytes_or_tokens"}

def sanitize_payload(obj: Any) -> Any:
    if isinstance(obj, dict):
        cleaned = {}
        for k, v in obj.items():
            k_lower = k.lower()
            if k_lower not in METRIC_KEYS and (any(s in k_lower for s in SENSITIVE_KEYS) or k_lower == "token"):
                cleaned[k] = "[REDACTED_SDK]"
            else:
                cleaned[k] = sanitize_payload(v)
        return cleaned
    elif isinstance(obj, list):
        return [sanitize_payload(item) for item in obj]
    return obj

class TraceEmitter:
    def __init__(
        self,
        run_id: str,
        trace_id: Optional[str] = None,
        api_base_url: str = "http://localhost:4000",
        producer_token: str = "dev-producer-token",
        source: str = "agent-adapter"
    ):
        self.run_id = run_id
        self.trace_id = trace_id or str(uuid.uuid4())
        self.api_base_url = api_base_url.rstrip("/")
        self.producer_token = producer_token
        self.source = source
        self.sequence = 0
        self.current_span_id: Optional[str] = None
        self.current_parent_span_id: Optional[str] = None
        self.buffer = []

    def set_span(self, span_id: Optional[str], parent_span_id: Optional[str] = None):
        self.current_span_id = span_id
        self.current_parent_span_id = parent_span_id

    def emit(
        self,
        event_type: str,
        status: str,
        payload: Optional[Dict[str, Any]] = None,
        span_id: Optional[str] = None,
        parent_span_id: Optional[str] = None,
        duration_ms: Optional[float] = None,
        source: Optional[str] = None,
        flush_immediately: bool = True
    ) -> Dict[str, Any]:
        self.sequence += 1
        now_iso = datetime.now(timezone.utc).isoformat()

        envelope = {
            "event_id": str(uuid.uuid4()),
            "run_id": self.run_id,
            "trace_id": self.trace_id,
            "span_id": span_id if span_id is not None else self.current_span_id,
            "parent_span_id": parent_span_id if parent_span_id is not None else self.current_parent_span_id,
            "sequence": self.sequence,
            "event_type": event_type,
            "status": status,
            "occurred_at": now_iso,
            "duration_ms": duration_ms,
            "source": source or self.source,
            "payload": sanitize_payload(payload or {}),
            "redaction_version": "1.0"
        }

        self.buffer.append(envelope)
        if flush_immediately:
            self.flush()

        return envelope

    def flush(self):
        if not self.buffer:
            return

        batch = list(self.buffer)
        self.buffer.clear()

        url = f"{self.api_base_url}/api/runs/{self.run_id}/events"
        data = json.dumps({"events": batch}).encode("utf-8")
        req = urllib.request.Request(
            url,
            data=data,
            headers={
                "Content-Type": "application/json",
                "Authorization": f"Bearer {self.producer_token}"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                pass
        except Exception as e:
            # Re-queue on failure for resilience
            self.buffer = batch + self.buffer
            print(f"[TraceEmitter-PY] Warning: failed to flush events ({e}), re-queued {len(batch)} items.")


def traced_tool(emitter: TraceEmitter, tool_name: Optional[str] = None):
    """Decorator for tracing synchronous tool executions."""
    def decorator(fn: Callable):
        name = tool_name or fn.__name__

        @wraps(fn)
        def wrapper(*args, **kwargs):
            span_id = f"tool-{uuid.uuid4().hex[:8]}"
            safe_args = sanitize_payload({"args": list(args), "kwargs": kwargs})

            emitter.emit(
                event_type="tool.started",
                status="started",
                payload={"tool_name": name, "safe_arguments": safe_args, "operation_id": span_id},
                span_id=span_id
            )

            start = time.perf_counter()
            try:
                res = fn(*args, **kwargs)
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                summary = str(res)[:300] if res is not None else "Completed with no return"
                emitter.emit(
                    event_type="tool.completed",
                    status="success",
                    payload={"tool_name": name, "result_summary": summary, "duration_ms": elapsed_ms, "operation_id": span_id},
                    span_id=span_id,
                    duration_ms=elapsed_ms
                )
                return res
            except Exception as exc:
                elapsed_ms = round((time.perf_counter() - start) * 1000, 2)
                emitter.emit(
                    event_type="tool.failed",
                    status="error",
                    payload={
                        "tool_name": name,
                        "error_code": exc.__class__.__name__,
                        "safe_error_message": str(exc)[:300],
                        "duration_ms": elapsed_ms,
                        "operation_id": span_id
                    },
                    span_id=span_id,
                    duration_ms=elapsed_ms
                )
                raise exc

        return wrapper
    return decorator

