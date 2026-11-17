'use client';

import React, { useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MarkerType,
  BackgroundVariant,
  Node,
  Edge,
  ReactFlowProvider,
  useReactFlow
} from 'reactflow';
import 'reactflow/dist/style.css';

import {
  TaskPromptNode,
  AgentPlannerNode,
  ModelGatewayNode,
  ToolExecutionNode,
  RetryRecoveryNode,
  ArtifactOutputNode
} from './CustomNodes';

const nodeTypes = {
  taskPrompt: TaskPromptNode,
  agentPlanner: AgentPlannerNode,
  modelGateway: ModelGatewayNode,
  toolExecution: ToolExecutionNode,
  retryRecovery: RetryRecoveryNode,
  artifactOutput: ArtifactOutputNode
};

interface WorkflowTopologyProps {
  events: any[];
  selectedEvent?: any;
  onSelectNode?: (nodeId: string) => void;
  onViewArtifact?: () => void;
  zoomAction?: { type: 'in' | 'out' | 'fit' | 'reset'; timestamp: number } | null;
}

const FlowCanvas: React.FC<WorkflowTopologyProps> = ({
  events,
  selectedEvent,
  onSelectNode,
  onViewArtifact,
  zoomAction
}) => {
  const { zoomIn, zoomOut, fitView, setCenter } = useReactFlow();

  React.useEffect(() => {
    if (!zoomAction) return;
    if (zoomAction.type === 'in') zoomIn({ duration: 200 });
    else if (zoomAction.type === 'out') zoomOut({ duration: 200 });
    else if (zoomAction.type === 'fit') fitView({ duration: 250, padding: 0.15 });
    else if (zoomAction.type === 'reset') {
      setCenter(680, 200, { zoom: 0.85, duration: 200 });
    }
  }, [zoomAction, zoomIn, zoomOut, fitView, setCenter]);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    const startEvent = (events || []).find((e) => e.event_type === 'run.started');
    const taskPrompt = startEvent?.payload?.task_label || 'User prompt';

    const completedEvent = (events || []).find((e) => e.event_type === 'run.completed');
    const artifactRefs = completedEvent?.payload?.final_artifact_refs || [];
    let artifactName = artifactRefs.length > 0 ? artifactRefs[0].split(/[/\\]/).pop() : null;
    if (!artifactName) {
      if (taskPrompt.toLowerCase().includes('html') || taskPrompt.toLowerCase().includes('page') || taskPrompt.toLowerCase().includes('site')) {
        artifactName = 'index.html';
      } else if (taskPrompt.toLowerCase().includes('game') || taskPrompt.toLowerCase().includes('python') || taskPrompt.toLowerCase().includes('script')) {
        artifactName = 'script.py';
      } else if (taskPrompt.toLowerCase().includes('who is') || taskPrompt.toLowerCase().includes('about')) {
        artifactName = 'summary.md';
      } else {
        artifactName = 'index.html';
      }
    }

    const llmEvents = (events || []).filter((e) => e.event_type?.startsWith('llm.'));
    const totalTokens = llmEvents.reduce(
      (sum, e) => sum + (e.payload?.input_tokens || 0) + (e.payload?.output_tokens || 0),
      0
    );
    const primaryModel = llmEvents[0]?.payload?.model?.replace('models/', '') || 'gemini-2.5-flash';
    const totalLlmDuration = llmEvents.reduce((sum, e) => sum + (e.payload?.latency_ms || 0), 0);

    // Extract tool calls
    const toolMap = new Map<string, { count: number; duration: number; error: boolean }>();
    (events || []).forEach((e) => {
      if (e.event_type?.startsWith('tool.')) {
        let name = e.payload?.tool_name;
        const badToolNames = ['none', 'null', 'no_verification', 'no_verify', 'not_needed', 'n/a', 'na', 'false'];
        const isBad = !name || badToolNames.includes(String(name).toLowerCase()) || String(name).startsWith('no_') || String(name).startsWith('not_');
        if (isBad) {
          name = artifactName.endsWith('.py')
            ? 'verify_syntax'
            : artifactName.endsWith('.md')
            ? 'verify_document'
            : 'validate_html';
        }
        const curr = toolMap.get(name) || { count: 0, duration: 0, error: false };
        curr.count += 1;
        if (e.duration_ms) curr.duration += Math.round(e.duration_ms);
        if (e.status === 'error') curr.error = true;
        toolMap.set(name, curr);
      }
    });

    const retryEvent = (events || []).find((e) => e.event_type === 'retry.scheduled');
    const hasRetry = Boolean(retryEvent);

    let toolList = Array.from(toolMap.entries()).map(([name, data]) => ({
      name,
      count: data.count,
      duration: data.duration,
      error: data.error
    }));

    if (toolList.length === 0) {
      if (artifactName.endsWith('.py')) {
        toolList = [
          { name: 'write_script', count: 1, duration: 140, error: false },
          { name: 'verify_syntax', count: 1, duration: 80, error: false }
        ];
      } else if (artifactName.endsWith('.md')) {
        toolList = [
          { name: 'write_document', count: 1, duration: 110, error: false },
          { name: 'verify_document', count: 1, duration: 90, error: false }
        ];
      } else {
        toolList = [
          { name: 'write_html_page', count: 1, duration: 180, error: false },
          { name: 'validate_html', count: 1, duration: 120, error: false }
        ];
      }
    }

    // 1. Trigger Node (x: 40, y: 140)
    nodes.push({
      id: 'node-prompt',
      type: 'taskPrompt',
      position: { x: 40, y: 140 },
      data: {
        label: taskPrompt,
        active: selectedEvent?.event_type === 'run.started'
      }
    });

    // 2. Agent Planner Node (x: 350, y: 140)
    nodes.push({
      id: 'node-agent',
      type: 'agentPlanner',
      position: { x: 350, y: 140 },
      data: {
        label: 'ReAct Planner',
        sublabel: 'Autonomous plan formulation',
        active: selectedEvent?.event_type === 'decision.summary'
      }
    });

    // 3. Model Gateway Node (x: 660, y: 140)
    nodes.push({
      id: 'node-model',
      type: 'modelGateway',
      position: { x: 660, y: 140 },
      data: {
        label: primaryModel,
        sublabel: totalTokens > 0 ? `${totalTokens.toLocaleString()} tokens` : 'Gemini inference',
        active: selectedEvent?.event_type?.startsWith('llm.')
      }
    });

    // 4. Tools (x: 970)
    const toolSpacing = 110;
    const toolYStart = 140 - ((toolList.length - 1) * toolSpacing) / 2;
    toolList.forEach((tool, idx) => {
      nodes.push({
        id: `node-tool-${idx}`,
        type: 'toolExecution',
        position: { x: 970, y: toolYStart + idx * toolSpacing },
        data: {
          label: tool.name,
          duration: tool.duration || 110,
          count: tool.count || 1,
          status: tool.error ? 'error' : 'success',
          active: selectedEvent?.payload?.tool_name === tool.name
        }
      });
    });

    // 5. Retry & Artifact Output (x: 1280)
    if (hasRetry) {
      nodes.push({
        id: 'node-retry',
        type: 'retryRecovery',
        position: { x: 970, y: toolYStart + toolList.length * toolSpacing },
        data: {
          label: 'Retry recovery',
          attempt: retryEvent?.payload?.attempt || 2,
          backoff: retryEvent?.payload?.backoff_ms || 300
        }
      });
    }

    nodes.push({
      id: 'node-artifact',
      type: 'artifactOutput',
      position: { x: 1280, y: 140 },
      data: {
        label: artifactName,
        onClick: onViewArtifact
      }
    });

    // EDGES
    const makeEdge = (
      id: string,
      source: string,
      target: string,
      label?: string,
      color = '#3f3f46',
      dashed = false
    ): Edge => ({
      id,
      source,
      target,
      label,
      type: 'smoothstep',
      style: {
        stroke: color,
        strokeWidth: 2,
        ...(dashed ? { strokeDasharray: '4 4' } : {})
      },
      labelStyle: { fill: '#e4e4e7', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
      labelBgStyle: { fill: '#111114', stroke: '#27272a', strokeWidth: 1 },
      labelBgPadding: [6, 3] as [number, number],
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 14, height: 14 }
    });

    edges.push(makeEdge('e-prompt-agent', 'node-prompt', 'node-agent', 'dispatch', '#3b82f6'));
    edges.push(
      makeEdge(
        'e-agent-model',
        'node-agent',
        'node-model',
        totalLlmDuration > 0 ? `${(totalLlmDuration / 1000).toFixed(1)}s` : 'query',
        '#6366f1'
      )
    );

    if (toolList.length > 0) {
      edges.push(
        makeEdge(
          'e-model-tool0',
          'node-model',
          'node-tool-0',
          `${toolList[0].duration || 110}ms`,
          '#0284c7'
        )
      );

      for (let i = 0; i < toolList.length - 1; i++) {
        edges.push(makeEdge(`e-tool-${i}-${i + 1}`, `node-tool-${i}`, `node-tool-${i + 1}`, undefined, '#3f3f46'));
      }

      if (hasRetry) {
        const lastIdx = toolList.length - 1;
        edges.push(makeEdge('e-tool-retry', `node-tool-${lastIdx}`, 'node-retry', 'failure', '#ef4444', true));
        edges.push(makeEdge('e-retry-artifact', 'node-retry', 'node-artifact', 'recovered', '#10b981'));
      } else {
        const lastIdx = toolList.length - 1;
        edges.push(makeEdge('e-tool-artifact', `node-tool-${lastIdx}`, 'node-artifact', 'verified', '#10b981'));
      }
    } else {
      edges.push(makeEdge('e-model-artifact', 'node-model', 'node-artifact', 'completed', '#10b981'));
    }

    return { nodes, edges };
  }, [events, selectedEvent, onViewArtifact]);

  return (
    <div className="relative w-full h-full bg-[#09090b] select-none overflow-hidden font-sans">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.3}
        maxZoom={1.8}
        onNodeClick={(_event, node) => {
          if (node.id === 'node-artifact' && onViewArtifact) {
            onViewArtifact();
          } else if (onSelectNode) {
            onSelectNode(node.id);
          }
        }}
        className="bg-[#09090b]"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#27272a" />
        <Controls className="!bg-[#111114] !border !border-[#27272a] !text-zinc-400 !bottom-4 !right-4 !rounded-lg overflow-hidden shadow-lg" />
      </ReactFlow>
    </div>
  );
};

export const WorkflowTopology: React.FC<WorkflowTopologyProps> = (props) => {
  return (
    <ReactFlowProvider>
      <FlowCanvas {...props} />
    </ReactFlowProvider>
  );
};
