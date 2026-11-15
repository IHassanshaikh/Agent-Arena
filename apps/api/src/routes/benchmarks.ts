import { Router, Request, Response } from 'express';
import { spawn } from 'child_process';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db';
import { ingestEvents } from '../services/ingestion';

export const benchmarksRouter = Router();

// Launch agent benchmark run via python runner
benchmarksRouter.post('/launch', async (req: Request, res: Response) => {
  try {
    const {
      agent_id = 'alpha',
      task_id = 'seeded-react-login-bug',
      seeded_failure = true,
      prompt
    } = req.body;

    const runId = uuidv4();
    const taskLabel = prompt || (task_id === 'seeded-react-login-bug'
      ? 'Fix Auth Token Expiration Race in Login Component'
      : 'General Benchmark Task');

    // Create run record
    await db.query(
      `INSERT INTO runs (id, user_id, agent_id, benchmark_id, task_label, status, created_at, metadata)
       VALUES ($1, $2, $3, $4, $5, 'queued', NOW(), $6)`,
      [
        runId,
        '00000000-0000-0000-0000-000000000001',
        agent_id,
        task_id,
        taskLabel,
        JSON.stringify({ seeded_failure, user_prompt: prompt, triggered_via: 'web-dashboard' })
      ]
    );

    // Spawn agent runner in background
    const runnerScript = path.resolve(__dirname, '../../../../services/agent-runner/agent_runner.py');
    const pythonExe = process.platform === 'win32' ? 'python' : 'python3';

    const spawnArgs = [
      runnerScript,
      '--run-id', runId,
      '--agent', agent_id,
      '--seeded-failure', seeded_failure ? 'true' : 'false'
    ];
    if (prompt) {
      spawnArgs.push('--prompt', prompt);
    }

    const child = spawn(
      pythonExe,
      spawnArgs,
      {
        cwd: path.resolve(__dirname, '../../../../'),
        detached: true,
        stdio: 'ignore',
        env: { ...process.env }
      }
    );
    child.unref();

    res.status(202).json({
      success: true,
      run_id: runId,
      agent_id,
      task_label: taskLabel,
      status: 'queued'
    });
  } catch (err: any) {
    console.error('[Benchmark] Error launching run:', err);
    res.status(500).json({ error: 'Failed to launch benchmark', details: err.message });
  }
});

// Seed rich historical benchmark runs for immediate hackathon judge demo
benchmarksRouter.post('/seed', async (req: Request, res: Response) => {
  try {
    const runAlphaId = '11111111-aaaa-4000-8000-000000000001';
    const runBetaId = '22222222-bbbb-4000-8000-000000000002';
    const alphaTraceId = 'c4c3e2f2-0000-4000-8000-000000000001';
    const betaTraceId = 'c4c3e2f2-0000-4000-8000-000000000002';

    // 1. Check if already seeded, delete old events and runs for clean re-seed
    await db.query('DELETE FROM trace_events WHERE run_id IN ($1, $2)', [runAlphaId, runBetaId]);
    await db.query('DELETE FROM runs WHERE id IN ($1, $2)', [runAlphaId, runBetaId]);

    const taskLabel = 'Fix Auth Token Expiration Race in Login Component';
    const baseTime = new Date(Date.now() - 3600 * 1000).toISOString();

    // Create Agent Alpha (Resilient - encounters failure, retries, succeeds)
    await db.query(
      `INSERT INTO runs (id, user_id, agent_id, benchmark_id, task_label, status, started_at, finished_at, created_at, metadata)
       VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7, $6, $8)`,
      [
        runAlphaId,
        '00000000-0000-0000-0000-000000000001',
        'agent-alpha-resilient',
        'seeded-react-login-bug',
        taskLabel,
        baseTime,
        new Date(new Date(baseTime).getTime() + 18500).toISOString(),
        JSON.stringify({ agent_name: 'Agent Alpha (Resilient Bug-Fixer)', model: 'gpt-4o' })
      ]
    );

    // Create Agent Beta (Baseline - alternative prompt, no retry recovery)
    await db.query(
      `INSERT INTO runs (id, user_id, agent_id, benchmark_id, task_label, status, started_at, finished_at, created_at, metadata)
       VALUES ($1, $2, $3, $4, $5, 'failed', $6, $7, $6, $8)`,
      [
        runBetaId,
        '00000000-0000-0000-0000-000000000001',
        'agent-beta-baseline',
        'seeded-react-login-bug',
        taskLabel,
        baseTime,
        new Date(new Date(baseTime).getTime() + 14200).toISOString(),
        JSON.stringify({ agent_name: 'Agent Beta (Baseline Fast)', model: 'claude-3-5-haiku' })
      ]
    );

    // Ingest events for Agent Alpha
    const alphaEvents = [
      {
        event_id: 'a1000000-0000-4000-8000-000000000001',
        run_id: runAlphaId,
        trace_id: alphaTraceId,
        sequence: 1,
        event_type: 'run.started',
        status: 'started',
        occurred_at: baseTime,
        source: 'agent',
        payload: { task: taskLabel, agent: 'Agent Alpha' }
      },
      {
        event_id: 'a1000000-0000-4000-8000-000000000002',
        run_id: runAlphaId,
        trace_id: alphaTraceId,
        span_id: 'turn-1',
        sequence: 2,
        event_type: 'decision.summary',
        status: 'informational',
        occurred_at: new Date(new Date(baseTime).getTime() + 500).toISOString(),
        source: 'agent',
        payload: {
          summary: 'Read Login.tsx and AuthContext.tsx to diagnose why auth token refresh fails intermittently.',
          selected_action: 'read_files',
          confidence: 0.95
        }
      },
      {
        event_id: 'a1000000-0000-4000-8000-000000000003',
        run_id: runAlphaId,
        trace_id: alphaTraceId,
        span_id: 'tool-read-1',
        parent_span_id: 'turn-1',
        sequence: 3,
        event_type: 'tool.started',
        status: 'started',
        occurred_at: new Date(new Date(baseTime).getTime() + 1000).toISOString(),
        source: 'tool-runtime',
        payload: { tool_name: 'read_file', safe_arguments: { path: 'src/components/Login.tsx' } }
      },
      {
        event_id: 'a1000000-0000-4000-8000-000000000004',
        run_id: runAlphaId,
        trace_id: alphaTraceId,
        span_id: 'tool-read-1',
        parent_span_id: 'turn-1',
        sequence: 4,
        event_type: 'tool.completed',
        status: 'success',
        occurred_at: new Date(new Date(baseTime).getTime() + 1250).toISOString(),
        duration_ms: 250,
        source: 'tool-runtime',
        payload: { tool_name: 'read_file', result_summary: 'Loaded 94 lines from Login.tsx' }
      },
      {
        event_id: 'a1000000-0000-4000-8000-000000000005',
        run_id: runAlphaId,
        trace_id: alphaTraceId,
        span_id: 'llm-plan-1',
        parent_span_id: 'turn-1',
        sequence: 5,
        event_type: 'llm.started',
        status: 'started',
        occurred_at: new Date(new Date(baseTime).getTime() + 1500).toISOString(),
        source: 'gateway',
        payload: { provider: 'openai', model: 'gpt-4o', purpose: 'Formulate bug fix patch' }
      },
      {
        event_id: 'a1000000-0000-4000-8000-000000000006',
        run_id: runAlphaId,
        trace_id: alphaTraceId,
        span_id: 'llm-plan-1',
        parent_span_id: 'turn-1',
        sequence: 6,
        event_type: 'llm.completed',
        status: 'success',
        occurred_at: new Date(new Date(baseTime).getTime() + 3200).toISOString(),
        duration_ms: 1700,
        source: 'gateway',
        payload: {
          provider: 'openai',
          model: 'gpt-4o',
          input_tokens: 1420,
          output_tokens: 380,
          latency_ms: 1700,
          finish_reason: 'stop',
          response_summary: 'Identified race condition: token refresh promise was not awaited before setting state.'
        }
      },
      {
        event_id: 'a1000000-0000-4000-8000-000000000007',
        run_id: runAlphaId,
        trace_id: alphaTraceId,
        span_id: 'tool-test-1',
        parent_span_id: 'turn-1',
        sequence: 7,
        event_type: 'tool.started',
        status: 'started',
        occurred_at: new Date(new Date(baseTime).getTime() + 3500).toISOString(),
        source: 'tool-runtime',
        payload: { tool_name: 'run_tests', safe_arguments: { suite: 'login.test.tsx' } }
      },
      {
        event_id: 'a1000000-0000-4000-8000-000000000008',
        run_id: runAlphaId,
        trace_id: alphaTraceId,
        span_id: 'tool-test-1',
        parent_span_id: 'turn-1',
        sequence: 8,
        event_type: 'tool.failed',
        status: 'error',
        occurred_at: new Date(new Date(baseTime).getTime() + 5500).toISOString(),
        duration_ms: 2000,
        source: 'tool-runtime',
        payload: {
          tool_name: 'run_tests',
          error_code: 'TEST_TIMEOUT',
          safe_error_message: 'Jest test timed out: async operation exceeded 2000ms threshold'
        }
      },
      {
        event_id: 'a1000000-0000-4000-8000-000000000009',
        run_id: runAlphaId,
        trace_id: alphaTraceId,
        span_id: 'retry-op-1',
        parent_span_id: 'turn-1',
        sequence: 9,
        event_type: 'retry.scheduled',
        status: 'retrying',
        occurred_at: new Date(new Date(baseTime).getTime() + 5800).toISOString(),
        source: 'agent',
        payload: {
          operation_id: 'tool-test-1',
          attempt: 2,
          reason: 'Transient Jest timeout while mock server initialized; backoff 500ms',
          backoff_ms: 500
        }
      },
      {
        event_id: 'a1000000-0000-4000-8000-000000000010',
        run_id: runAlphaId,
        trace_id: alphaTraceId,
        span_id: 'tool-test-retry-1',
        parent_span_id: 'retry-op-1',
        sequence: 10,
        event_type: 'tool.started',
        status: 'started',
        occurred_at: new Date(new Date(baseTime).getTime() + 6400).toISOString(),
        source: 'tool-runtime',
        payload: { tool_name: 'run_tests', safe_arguments: { suite: 'login.test.tsx', attempt: 2 } }
      },
      {
        event_id: 'a1000000-0000-4000-8000-000000000011',
        run_id: runAlphaId,
        trace_id: alphaTraceId,
        span_id: 'tool-test-retry-1',
        parent_span_id: 'retry-op-1',
        sequence: 11,
        event_type: 'tool.completed',
        status: 'success',
        occurred_at: new Date(new Date(baseTime).getTime() + 8200).toISOString(),
        duration_ms: 1800,
        source: 'tool-runtime',
        payload: { tool_name: 'run_tests', result_summary: 'All 6 test suites passed (100% assertions satisfied)' }
      },
      {
        event_id: 'a1000000-0000-4000-8000-000000000012',
        run_id: runAlphaId,
        trace_id: alphaTraceId,
        sequence: 12,
        event_type: 'run.completed',
        status: 'success',
        occurred_at: new Date(new Date(baseTime).getTime() + 8500).toISOString(),
        source: 'agent',
        payload: {
          outcome: 'Fix successfully implemented and verified with automated test suite.',
          success: true
        }
      }
    ];

    // Ingest events for Agent Beta (unhandled error, failure)
    const betaEvents = [
      {
        event_id: 'b2000000-0000-4000-8000-000000000001',
        run_id: runBetaId,
        trace_id: betaTraceId,
        sequence: 1,
        event_type: 'run.started',
        status: 'started',
        occurred_at: baseTime,
        source: 'agent',
        payload: { task: taskLabel, agent: 'Agent Beta' }
      },
      {
        event_id: 'b2000000-0000-4000-8000-000000000002',
        run_id: runBetaId,
        trace_id: betaTraceId,
        span_id: 'llm-direct-1',
        sequence: 2,
        event_type: 'llm.started',
        status: 'started',
        occurred_at: new Date(new Date(baseTime).getTime() + 400).toISOString(),
        source: 'gateway',
        payload: { provider: 'anthropic', model: 'claude-3-5-haiku', purpose: 'Zero-shot patch generation' }
      },
      {
        event_id: 'b2000000-0000-4000-8000-000000000003',
        run_id: runBetaId,
        trace_id: betaTraceId,
        span_id: 'llm-direct-1',
        sequence: 3,
        event_type: 'llm.completed',
        status: 'success',
        occurred_at: new Date(new Date(baseTime).getTime() + 1900).toISOString(),
        duration_ms: 1500,
        source: 'gateway',
        payload: {
          provider: 'anthropic',
          model: 'claude-3-5-haiku',
          input_tokens: 3100,
          output_tokens: 650,
          latency_ms: 1500,
          response_summary: 'Generated speculative patch without reading contextual types.'
        }
      },
      {
        event_id: 'b2000000-0000-4000-8000-000000000004',
        run_id: runBetaId,
        trace_id: betaTraceId,
        span_id: 'tool-test-beta',
        sequence: 4,
        event_type: 'tool.started',
        status: 'started',
        occurred_at: new Date(new Date(baseTime).getTime() + 2200).toISOString(),
        source: 'tool-runtime',
        payload: { tool_name: 'run_tests', safe_arguments: { suite: 'login.test.tsx' } }
      },
      {
        event_id: 'b2000000-0000-4000-8000-000000000005',
        run_id: runBetaId,
        trace_id: betaTraceId,
        span_id: 'tool-test-beta',
        sequence: 5,
        event_type: 'tool.failed',
        status: 'error',
        occurred_at: new Date(new Date(baseTime).getTime() + 4500).toISOString(),
        duration_ms: 2300,
        source: 'tool-runtime',
        payload: {
          tool_name: 'run_tests',
          error_code: 'SYNTAX_ERROR',
          safe_error_message: 'TypeScript compilation failed: Type undefined cannot be assigned to TokenState'
        }
      },
      {
        event_id: 'b2000000-0000-4000-8000-000000000006',
        run_id: runBetaId,
        trace_id: betaTraceId,
        sequence: 6,
        event_type: 'run.failed',
        status: 'error',
        occurred_at: new Date(new Date(baseTime).getTime() + 4800).toISOString(),
        source: 'agent',
        payload: {
          error_code: 'UNHANDLED_BUILD_FAILURE',
          safe_error_message: 'Agent terminated after unrecovered tool failure'
        }
      }
    ];

    await ingestEvents(alphaEvents);
    await ingestEvents(betaEvents);

    res.json({
      success: true,
      message: 'Demo benchmark traces seeded successfully',
      runs: [
        { id: runAlphaId, name: 'Agent Alpha (Resilient)', status: 'completed' },
        { id: runBetaId, name: 'Agent Beta (Baseline)', status: 'failed' }
      ]
    });
  } catch (err: any) {
    console.error('[Benchmark] Error seeding runs:', err);
    res.status(500).json({ error: 'Failed to seed benchmark runs', details: err.message });
  }
});

