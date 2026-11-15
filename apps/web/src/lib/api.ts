const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export async function fetchRuns(filters?: { status?: string; agent_id?: string }) {
  const params = new URLSearchParams();
  if (filters?.status) params.append('status', filters.status);
  if (filters?.agent_id) params.append('agent_id', filters.agent_id);

  const res = await fetch(`${API_BASE}/api/runs?${params.toString()}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch runs');
  return res.json();
}

export async function fetchRun(runId: string) {
  const res = await fetch(`${API_BASE}/api/runs/${runId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch run ${runId}`);
  return res.json();
}

export async function fetchRunEvents(runId: string, after?: number) {
  const url = after !== undefined
    ? `${API_BASE}/api/runs/${runId}/events?after=${after}`
    : `${API_BASE}/api/runs/${runId}/events`;
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Failed to fetch events for run ${runId}`);
  return res.json();
}

export async function compareRuns(leftId: string, rightId: string) {
  const res = await fetch(`${API_BASE}/api/runs/compare?left=${leftId}&right=${rightId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch comparison');
  return res.json();
}

export async function launchBenchmark(options: { agent_id: string; task_id?: string; seeded_failure: boolean; prompt?: string }) {
  const res = await fetch(`${API_BASE}/api/benchmarks/launch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      task_id: 'seeded-react-login-bug',
      ...options
    })
  });
  if (!res.ok) throw new Error('Failed to launch benchmark');
  return res.json();
}

export async function seedDemoRuns() {
  const res = await fetch(`${API_BASE}/api/benchmarks/seed`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  });
  if (!res.ok) throw new Error('Failed to seed demo runs');
  return res.json();
}

export async function addAnnotation(runId: string, note: string, eventId?: string | null) {
  const res = await fetch(`${API_BASE}/api/runs/${runId}/annotations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ note, event_id: eventId })
  });
  if (!res.ok) throw new Error('Failed to add annotation');
  return res.json();
}

export async function fetchAnnotations(runId: string) {
  const res = await fetch(`${API_BASE}/api/runs/${runId}/annotations`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to fetch annotations');
  return res.json();
}

export async function deleteRun(runId: string) {
  const res = await fetch(`${API_BASE}/api/runs/${runId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to delete run');
  return res.json();
}

export async function exportRun(runId: string, format: 'json' | 'otlp' = 'json') {
  const res = await fetch(`${API_BASE}/api/runs/${runId}/export?format=${format}`, { cache: 'no-store' });
  if (!res.ok) throw new Error('Failed to export run');
  return res.json();
}

export async function fetchRunArtifact(runId: string) {
  const res = await fetch(`${API_BASE}/api/runs/${runId}/artifact`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}



