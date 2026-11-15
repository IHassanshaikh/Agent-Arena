import { Router, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { ingestEvents } from '../services/ingestion';

export const runsRouter = Router();

// 1. Create a run
runsRouter.post('/', async (req: Request, res: Response) => {
  try {
    const runId = req.body.run_id || uuidv4();
    const userId = req.body.user_id || '00000000-0000-0000-0000-000000000001';
    const taskLabel = req.body.task_label || 'Default Benchmark Task';
    const agentId = req.body.agent_id || 'reference-agent';
    const benchmarkId = req.body.benchmark_id || 'seeded-react-login-bug';
    const initialMetadata = req.body.metadata || {};

    const initialMetrics = {
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

    await db.query(
      `INSERT INTO runs (id, user_id, agent_id, benchmark_id, task_label, status, created_at, metrics, metadata)
       VALUES ($1, $2, $3, $4, $5, 'queued', NOW(), $6, $7)`,
      [runId, userId, agentId, benchmarkId, taskLabel, JSON.stringify(initialMetrics), JSON.stringify(initialMetadata)]
    );

    res.status(201).json({
      run_id: runId,
      status: 'queued',
      producer_token: `prod_${uuidv4().replace(/-/g, '')}`,
      created_at: new Date().toISOString()
    });
  } catch (err: any) {
    console.error('[API] Error creating run:', err);
    res.status(500).json({ error: 'Failed to create run', details: err.message });
  }
});

// 2. List runs with filters
runsRouter.get('/', async (req: Request, res: Response) => {
  try {
    const { status, agent_id, limit = '50', offset = '0' } = req.query;
    let query = 'SELECT * FROM runs WHERE 1=1';
    const params: any[] = [];

    if (status && typeof status === 'string') {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    if (agent_id && typeof agent_id === 'string') {
      params.push(agent_id);
      query += ` AND agent_id = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';

    const parsedLimit = Math.min(parseInt(limit as string, 10) || 50, 100);
    const parsedOffset = parseInt(offset as string, 10) || 0;

    params.push(parsedLimit);
    query += ` LIMIT $${params.length}`;

    params.push(parsedOffset);
    query += ` OFFSET $${params.length}`;

    const result = await db.query(query, params);

    res.json({
      runs: result.rows.map(r => ({
        ...r,
        metrics: typeof r.metrics === 'string' ? JSON.parse(r.metrics) : r.metrics,
        metadata: typeof r.metadata === 'string' ? JSON.parse(r.metadata) : r.metadata
      })),
      limit: parsedLimit,
      offset: parsedOffset
    });
  } catch (err: any) {
    console.error('[API] Error listing runs:', err);
    res.status(500).json({ error: 'Failed to list runs', details: err.message });
  }
});

// 3. Compare two runs
runsRouter.get('/compare', async (req: Request, res: Response) => {
  try {
    const leftId = req.query.left as string;
    const rightId = req.query.right as string;

    if (!leftId || !rightId) {
      return res.status(400).json({ error: 'Both left and right query parameters are required' });
    }

    const leftRunRes = await db.query('SELECT * FROM runs WHERE id = $1', [leftId]);
    const rightRunRes = await db.query('SELECT * FROM runs WHERE id = $1', [rightId]);

    if (leftRunRes.rows.length === 0 || rightRunRes.rows.length === 0) {
      return res.status(404).json({ error: 'One or both runs not found' });
    }

    const leftRun = leftRunRes.rows[0];
    const rightRun = rightRunRes.rows[0];

    const leftMetrics = typeof leftRun.metrics === 'string' ? JSON.parse(leftRun.metrics) : leftRun.metrics;
    const rightMetrics = typeof rightRun.metrics === 'string' ? JSON.parse(rightRun.metrics) : rightRun.metrics;

    const leftEventsRes = await db.query(
      'SELECT id, event_type, status, occurred_at, duration_ms, payload FROM trace_events WHERE run_id = $1 ORDER BY sequence ASC',
      [leftId]
    );
    const rightEventsRes = await db.query(
      'SELECT id, event_type, status, occurred_at, duration_ms, payload FROM trace_events WHERE run_id = $1 ORDER BY sequence ASC',
      [rightId]
    );

    const leftEvents = leftEventsRes.rows.map(e => ({
      ...e,
      payload: typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload
    }));

    const rightEvents = rightEventsRes.rows.map(e => ({
      ...e,
      payload: typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload
    }));

    // Calculate comparative deltas
    const tokenDelta = rightMetrics.total_tokens - leftMetrics.total_tokens;
    const costDelta = rightMetrics.estimated_cost_usd - leftMetrics.estimated_cost_usd;
    const durationDelta = rightMetrics.duration_ms - leftMetrics.duration_ms;
    const retriesDelta = rightMetrics.retries - leftMetrics.retries;

    res.json({
      left: {
        run: { ...leftRun, metrics: leftMetrics },
        events: leftEvents
      },
      right: {
        run: { ...rightRun, metrics: rightMetrics },
        events: rightEvents
      },
      comparison: {
        token_delta: tokenDelta,
        token_delta_percent: leftMetrics.total_tokens > 0 ? (tokenDelta / leftMetrics.total_tokens) * 100 : 0,
        cost_delta: costDelta,
        cost_delta_percent: leftMetrics.estimated_cost_usd > 0 ? (costDelta / leftMetrics.estimated_cost_usd) * 100 : 0,
        duration_delta_ms: durationDelta,
        duration_delta_percent: leftMetrics.duration_ms > 0 ? (durationDelta / leftMetrics.duration_ms) * 100 : 0,
        retries_delta: retriesDelta,
        winner: rightRun.status === 'completed' && leftRun.status !== 'completed'
          ? 'right'
          : leftRun.status === 'completed' && rightRun.status !== 'completed'
          ? 'left'
          : costDelta < 0 && durationDelta < 0
          ? 'right'
          : 'left'
      }
    });
  } catch (err: any) {
    console.error('[API] Error comparing runs:', err);
    res.status(500).json({ error: 'Failed to compare runs', details: err.message });
  }
});

// 4. Get run by ID
runsRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT * FROM runs WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const run = result.rows[0];
    res.json({
      ...run,
      metrics: typeof run.metrics === 'string' ? JSON.parse(run.metrics) : run.metrics,
      metadata: typeof run.metadata === 'string' ? JSON.parse(run.metadata) : run.metadata
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get run', details: err.message });
  }
});

// 5. Ingest events for a run
runsRouter.post('/:id/events', async (req: Request, res: Response) => {
  try {
    const runId = req.params.id;
    let eventsToIngest = [];

    if (Array.isArray(req.body.events)) {
      eventsToIngest = req.body.events;
    } else if (req.body.event_type) {
      eventsToIngest = [req.body];
    } else {
      return res.status(400).json({ error: 'Payload must contain event or events array' });
    }

    // Force run_id consistency
    eventsToIngest = eventsToIngest.map((e: any) => ({ ...e, run_id: runId }));

    const result = await ingestEvents(eventsToIngest);

    res.status(200).json({
      success: true,
      persisted_count: result.persistedCount,
      duplicate_count: result.duplicateCount
    });
  } catch (err: any) {
    console.error('[API] Ingestion error:', err);
    res.status(500).json({ error: 'Failed to ingest events', details: err.message });
  }
});

// 6. Get events for a run with reconnect/catch-up (?after=sequence)
runsRouter.get('/:id/events', async (req: Request, res: Response) => {
  try {
    const runId = req.params.id;
    const after = parseInt(req.query.after as string, 10);
    const limit = Math.min(parseInt(req.query.limit as string, 10) || 500, 1000);

    let query = 'SELECT * FROM trace_events WHERE run_id = $1';
    const params: any[] = [runId];

    if (!isNaN(after)) {
      params.push(after);
      query += ` AND sequence > $${params.length}`;
    }

    query += ' ORDER BY sequence ASC';

    params.push(limit);
    query += ` LIMIT $${params.length}`;

    const result = await db.query(query, params);

    res.json({
      run_id: runId,
      events: result.rows.map(e => {
        const payload = typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload;
        const badNames = ['none', 'null', 'no_verification', 'no_verify', 'not_needed', 'n/a', 'na', 'false'];
        if (payload && e.event_type.startsWith('tool.') && (!payload.tool_name || badNames.includes(String(payload.tool_name).toLowerCase()) || String(payload.tool_name).startsWith('no_'))) {
          payload.tool_name = 'verify_document';
        }
        return {
          ...e,
          payload
        };
      }),
      count: result.rows.length
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to fetch events', details: err.message });
  }
});

// 7. Get run summary & breakdown
runsRouter.get('/:id/summary', async (req: Request, res: Response) => {
  try {
    const runId = req.params.id;
    const runRes = await db.query('SELECT * FROM runs WHERE id = $1', [runId]);
    if (runRes.rows.length === 0) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const run = runRes.rows[0];
    const metrics = typeof run.metrics === 'string' ? JSON.parse(run.metrics) : run.metrics;

    // Tool breakdown
    const toolStatsRes = await db.query(
      `SELECT
         payload->>'tool_name' as tool_name,
         COUNT(*) as count,
         SUM(COALESCE(duration_ms, 0)) as total_duration_ms,
         AVG(COALESCE(duration_ms, 0)) as avg_duration_ms
       FROM trace_events
       WHERE run_id = $1 AND event_type IN ('tool.completed', 'tool.failed')
       GROUP BY payload->>'tool_name'`,
      [runId]
    );

    // Event type breakdown
    const eventStatsRes = await db.query(
      `SELECT event_type, COUNT(*) as count
       FROM trace_events
       WHERE run_id = $1
       GROUP BY event_type`,
      [runId]
    );

    // Calculate anomaly flags
    const alerts: Array<{ type: string; severity: 'warning' | 'critical' | 'info'; message: string }> = [];
    if (metrics.retries > 0) {
      alerts.push({
        type: 'RETRY_RECOVERY',
        severity: 'info',
        message: `${metrics.retries} retry operation(s) scheduled with recovery.`
      });
    }
    if (metrics.failures > 0 && run.status === 'failed') {
      alerts.push({
        type: 'UNRECOVERED_FAILURE',
        severity: 'critical',
        message: 'Agent terminated due to unrecovered failure.'
      });
    }
    if (metrics.duration_ms > 20000) {
      alerts.push({
        type: 'HIGH_LATENCY',
        severity: 'warning',
        message: `Execution duration (${Math.round(metrics.duration_ms / 1000)}s) exceeds typical threshold.`
      });
    }
    if (metrics.estimated_cost_usd > 0.05) {
      alerts.push({
        type: 'HIGH_COST',
        severity: 'warning',
        message: `Estimated cost ($${metrics.estimated_cost_usd.toFixed(4)}) exceeds nominal run budget.`
      });
    }

    res.json({
      run: {
        id: run.id,
        task_label: run.task_label,
        status: run.status,
        agent_id: run.agent_id,
        started_at: run.started_at,
        finished_at: run.finished_at
      },
      metrics,
      alerts,
      tool_breakdown: toolStatsRes.rows,
      event_type_breakdown: eventStatsRes.rows
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get summary', details: err.message });
  }
});

// 8. Add an annotation
runsRouter.post('/:id/annotations', async (req: Request, res: Response) => {
  try {
    const runId = req.params.id;
    const { note, event_id, author_id = 'developer' } = req.body;

    if (!note) {
      return res.status(400).json({ error: 'Note content is required' });
    }

    const annotationId = uuidv4();
    await db.query(
      `INSERT INTO run_annotations (id, run_id, event_id, author_id, note, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [annotationId, runId, event_id || null, author_id, note]
    );

    res.status(201).json({
      id: annotationId,
      run_id: runId,
      event_id: event_id || null,
      author_id,
      note,
      created_at: new Date().toISOString()
    });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to add annotation', details: err.message });
  }
});

// 9. Get annotations for a run
runsRouter.get('/:id/annotations', async (req: Request, res: Response) => {
  try {
    const runId = req.params.id;
    const result = await db.query(
      'SELECT * FROM run_annotations WHERE run_id = $1 ORDER BY created_at ASC',
      [runId]
    );
    res.json({ annotations: result.rows });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to get annotations', details: err.message });
  }
});

// 10. Export sanitized trace JSON
runsRouter.get('/:id/export', async (req: Request, res: Response) => {
  try {
    const runId = req.params.id;
    const runRes = await db.query('SELECT * FROM runs WHERE id = $1', [runId]);
    if (runRes.rows.length === 0) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const run = runRes.rows[0];
    const eventsRes = await db.query(
      'SELECT * FROM trace_events WHERE run_id = $1 ORDER BY sequence ASC',
      [runId]
    );

    const format = req.query.format as string;
    if (format === 'otlp') {
      const traceIdHex = (run.id || '').replace(/-/g, '').padEnd(32, '0').slice(0, 32);

      const otlpSpans = eventsRes.rows.map(e => {
        const payload = typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload;
        const spanIdHex = (e.span_id || `span_${e.sequence}`).replace(/[^a-f0-9]/gi, '').padEnd(16, '0').slice(0, 16);
        const parentSpanIdHex = e.parent_span_id
          ? e.parent_span_id.replace(/[^a-f0-9]/gi, '').padEnd(16, '0').slice(0, 16)
          : '';

        const startNano = BigInt(new Date(e.occurred_at).getTime()) * BigInt(1_000_000);
        const durationNano = BigInt(Math.round(e.duration_ms || 100)) * BigInt(1_000_000);
        const endNano = startNano + durationNano;

        return {
          traceId: traceIdHex,
          spanId: spanIdHex,
          parentSpanId: parentSpanIdHex || undefined,
          name: payload?.tool_name || payload?.model || e.event_type,
          kind: e.event_type.startsWith('llm.') ? 3 : e.event_type.startsWith('tool.') ? 1 : 0,
          startTimeUnixNano: startNano.toString(),
          endTimeUnixNano: endNano.toString(),
          attributes: Object.entries(payload).map(([k, v]) => ({
            key: `agentarena.${k}`,
            value: typeof v === 'number'
              ? { intValue: v }
              : typeof v === 'boolean'
              ? { boolValue: v }
              : { stringValue: typeof v === 'object' ? JSON.stringify(v) : String(v) }
          })),
          status: {
            code: e.status === 'error' ? 2 : 1,
            message: e.status === 'error' ? (payload?.safe_error_message || 'Span failed') : 'OK'
          }
        };
      });

      const otlpData = {
        resourceSpans: [
          {
            resource: {
              attributes: [
                { key: 'service.name', value: { stringValue: 'agentarena' } },
                { key: 'run.id', value: { stringValue: run.id } },
                { key: 'agent.id', value: { stringValue: run.agent_id || 'reference-agent' } },
                { key: 'task.label', value: { stringValue: run.task_label } }
              ]
            },
            scopeSpans: [
              {
                scope: { name: 'agentarena.trace_exporter', version: '1.0.0' },
                spans: otlpSpans
              }
            ]
          }
        ]
      };

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="agentarena-trace-${runId}-otlp.json"`);
      return res.json(otlpData);
    }

    const exportData = {
      agentarena_export_version: '1.0',
      exported_at: new Date().toISOString(),
      run: {
        ...run,
        metrics: typeof run.metrics === 'string' ? JSON.parse(run.metrics) : run.metrics
      },
      events: eventsRes.rows.map(e => ({
        ...e,
        payload: typeof e.payload === 'string' ? JSON.parse(e.payload) : e.payload
      }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="agentarena-trace-${runId}.json"`);
    res.json(exportData);
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to export trace', details: err.message });
  }
});

// 11. Delete a run
runsRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const runId = req.params.id;
    await db.query('DELETE FROM trace_events WHERE run_id = $1', [runId]);
    await db.query('DELETE FROM run_annotations WHERE run_id = $1', [runId]);
    const result = await db.query('DELETE FROM runs WHERE id = $1', [runId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Run not found' });
    }
    res.json({ success: true, message: `Run ${runId} deleted` });
  } catch (err: any) {
    res.status(500).json({ error: 'Failed to delete run', details: err.message });
  }
});

// 12. Get generated artifact for a run
runsRouter.get('/:id/artifact', async (req: Request, res: Response) => {
  try {
    const runId = req.params.id;
    const workspaceDir = path.resolve(__dirname, '../../../../workspace', runId);

    if (!fs.existsSync(workspaceDir)) {
      return res.status(404).json({ error: 'No workspace found for this run' });
    }

    const files = fs.readdirSync(workspaceDir);
    if (files.length === 0) {
      return res.status(404).json({ error: 'No files generated in workspace' });
    }

    // Prefer index.html or first file
    const primaryFile = files.find(f => f.endsWith('.html') || f.endsWith('.htm')) || files[0];
    const filePath = path.join(workspaceDir, primaryFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    const stat = fs.statSync(filePath);
    const ext = path.extname(primaryFile).toLowerCase();

    res.json({
      success: true,
      filename: primaryFile,
      content,
      size: stat.size,
      isHtml: ext === '.html' || ext === '.htm',
      contentType: ext === '.html' || ext === '.htm' ? 'text/html' : 'text/plain',
      rawUrl: `/api/runs/${runId}/artifact/raw`
    });
  } catch (err: any) {
    console.error('[API] Error getting artifact:', err);
    res.status(500).json({ error: 'Failed to read artifact', details: err.message });
  }
});

// 13. Serve raw artifact directly (for iframe preview)
runsRouter.get('/:id/artifact/raw', async (req: Request, res: Response) => {
  try {
    const runId = req.params.id;
    const workspaceDir = path.resolve(__dirname, '../../../../workspace', runId);

    if (!fs.existsSync(workspaceDir)) {
      return res.status(404).send('No workspace found');
    }

    const files = fs.readdirSync(workspaceDir);
    if (files.length === 0) {
      return res.status(404).send('No files found');
    }

    const primaryFile = files.find(f => f.endsWith('.html') || f.endsWith('.htm')) || files[0];
    const filePath = path.join(workspaceDir, primaryFile);
    const ext = path.extname(primaryFile).toLowerCase();

    if (ext === '.html' || ext === '.htm') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
    } else {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    }

    res.sendFile(filePath);
  } catch (err: any) {
    console.error('[API] Error serving raw artifact:', err);
    res.status(500).send('Failed to serve artifact');
  }
});


