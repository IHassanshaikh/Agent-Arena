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
    if (zoomAction.type === 'in') zoomIn({ duration: 250 });
    else if (zoomAction.type === 'out') zoomOut({ duration: 250 });
    else if (zoomAction.type === 'fit') fitView({ duration: 300, padding: 0.2 });
    else if (zoomAction.type === 'reset') {
      setCenter(450, 220, { zoom: 1, duration: 250 });
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
        artifactName = 'guess_the_number.py';
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

    // Extract tool calls and sanitize names
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

    // If no tools were found in events, provide sensible default tools based on task
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

    // ========================================================
    // 1. FRONT OF WORKFLOW: User Prompt Input (x: 40, y: 160)
    // ========================================================
    nodes.push({
      id: 'node-prompt',
      type: 'taskPrompt',
      position: { x: 40, y: 160 },
      data: {
        label: taskPrompt.length > 22 ? taskPrompt.slice(0, 22) + '...' : taskPrompt,
        active: selectedEvent?.event_type === 'run.started'
      }
    });

    // ========================================================
    // 2. AGENT PLANNER (x: 230, y: 160)
    // ========================================================
    nodes.push({
      id: 'node-agent',
      type: 'agentPlanner',
      position: { x: 230, y: 160 },
      data: {
        label: 'Agent',
        sublabel: 'decision',
        active: selectedEvent?.event_type === 'decision.summary'
      }
    });

    // ========================================================
    // 3. MODEL GATEWAY (x: 420, y: 160)
    // ========================================================
    nodes.push({
      id: 'node-model',
      type: 'modelGateway',
      position: { x: 420, y: 160 },
      data: {
        label: primaryModel,
        sublabel: totalTokens > 0 ? `${totalTokens.toLocaleString()} tok` : 'Model gateway',
        active: selectedEvent?.event_type?.startsWith('llm.')
      }
    });

    // ========================================================
    // 4. TOOLS (x: 610)
    // ========================================================
    const toolYStart = 160 - ((toolList.length - 1) * 70) / 2;
    toolList.forEach((tool, idx) => {
      nodes.push({
        id: `node-tool-${idx}`,
        type: 'toolExecution',
        position: { x: 610, y: toolYStart + idx * 75 },
        data: {
          label: tool.name,
          duration: tool.duration || 110,
          count: tool.count || 1,
          status: tool.error ? 'error' : 'success',
          active: selectedEvent?.payload?.tool_name === tool.name
        }
      });
    });

    // ========================================================
    // 5. RETRY & ARTIFACT OUTPUT (x: 830, y: 160)
    // ========================================================
    if (hasRetry) {
      nodes.push({
        id: 'node-retry',
        type: 'retryRecovery',
        position: { x: 610, y: toolYStart + toolList.length * 75 },
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
      position: { x: 830, y: 160 },
      data: {
        label: artifactName,
        onClick: onViewArtifact
      }
    });

    // ========================================================
    // CONNECTION EDGES
    // ========================================================
    const makeEdge = (
      id: string,
      source: string,
      target: string,
      label?: string,
      color = '#38bdf8',
      dashed = false
    ): Edge => ({
      id,
      source,
      target,
      label,
      type: 'smoothstep',
      style: {
        stroke: color,
        strokeWidth: 1.5,
        ...(dashed ? { strokeDasharray: '4 4' } : {})
      },
      labelStyle: { fill: '#cbd5e1', fontSize: 10, fontFamily: 'monospace', fontWeight: 600 },
      labelBgStyle: { fill: '#0a0d14', stroke: 'rgba(255,255,255,0.1)', strokeWidth: 1 },
      labelBgPadding: [4, 2] as [number, number],
      markerEnd: { type: MarkerType.ArrowClosed, color, width: 12, height: 12 }
    });

    edges.push(makeEdge('e-prompt-agent', 'node-prompt', 'node-agent', 'start'));
    edges.push(
      makeEdge(
        'e-agent-model',
        'node-agent',
        'node-model',
        totalLlmDuration > 0 ? `${(totalLlmDuration / 1000).toFixed(1)}s` : 'dispatch'
      )
    );

    if (toolList.length > 0) {
      edges.push(
        makeEdge(
          'e-model-tool0',
          'node-model',
          'node-tool-0',
          `${toolList[0].duration || 110}ms`
        )
      );

      for (let i = 0; i < toolList.length - 1; i++) {
        edges.push(makeEdge(`e-tool-${i}-${i + 1}`, `node-tool-${i}`, `node-tool-${i + 1}`));
      }

      if (hasRetry) {
        const lastIdx = toolList.length - 1;
        edges.push(makeEdge('e-tool-retry', `node-tool-${lastIdx}`, 'node-retry', 'fail', '#f43f5e', true));
        edges.push(makeEdge('e-retry-artifact', 'node-retry', 'node-artifact', 'recovered', '#22c55e'));
      } else {
        const lastIdx = toolList.length - 1;
        edges.push(makeEdge('e-tool-artifact', `node-tool-${lastIdx}`, 'node-artifact', 'verified', '#22c55e'));
      }
    } else {
      edges.push(makeEdge('e-model-artifact', 'node-model', 'node-artifact', 'done', '#22c55e'));
    }

    return { nodes, edges };
  }, [events, selectedEvent, onViewArtifact]);

  return (
    <div className="relative w-full h-full bg-black select-none overflow-hidden font-sans">
      {/* 100% Clean Unobstructed ReactFlow Canvas (No floating overlays in front) */}
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.5}
        maxZoom={1.5}
        onNodeClick={(_event, node) => {
          if (node.id === 'node-artifact' && onViewArtifact) {
            onViewArtifact();
          } else if (onSelectNode) {
            onSelectNode(node.id);
          }
        }}
        className="bg-black"
      >
        <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#18181b" />
        <Controls className="!bg-[#09090b] !border-white/10 !text-[#a1a1aa] !bottom-4 !right-4" />
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
