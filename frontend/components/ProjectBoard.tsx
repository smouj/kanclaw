'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Line, Sphere, Html, Text } from '@react-three/drei';
import * as THREE from 'three';
import { 
  Bot, CheckCircle2, Zap, MessageSquare, Camera, 
  FileText, GitBranch, Search, Filter, Network,
  ChevronRight, X, ExternalLink, Clock, User
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KanbanBoard } from '@/components/KanbanBoard';
import { useI18n } from '@/components/LanguageProvider';

type ViewMode = 'graph' | 'kanban';

type EntityType = 'task' | 'run' | 'thread' | 'agent' | 'snapshot' | 'import' | 'decision' | 'artifact';

interface GraphNode {
  id: string;
  type: EntityType;
  label: string;
  status?: string;
  position: [number, number, number];
  data: any;
}

interface GraphEdge {
  source: string;
  target: string;
  type: string;
}

interface ProjectBoardProps {
  projectSlug: string;
  tasks: any[];
  runs: any[];
  threads: any[];
  snapshots: any[];
  imports: any[];
  agents: any[];
  delegations: any[];
  decisions: { name: string; path: string }[];
  artifacts: { name: string; path: string }[];
  projectMemory: string;
  knowledge: { name: string; path: string }[];
}

function GraphNode3D({ 
  node, 
  selected, 
  onSelect,
  onHover 
}: { 
  node: GraphNode; 
  selected: boolean;
  onSelect: (id: string) => void;
  onHover: (id: string | null) => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  
  const colors: Record<EntityType, string> = {
    task: '#22c55e',
    run: '#f59e0b',
    thread: '#3b82f6',
    agent: '#a855f7',
    snapshot: '#ec4899',
    import: '#14b8a6',
    decision: '#8b5cf6',
    artifact: '#f97316',
  };
  
  const color = colors[node.type] || '#6b7280';
  const isSelected = selected || hovered;
  
  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.005;
      const scale = isSelected ? 1.2 + Math.sin(state.clock.elapsedTime * 2) * 0.1 : 1;
      meshRef.current.scale.setScalar(scale);
    }
  });
  
  return (
    <group position={node.position}>
      <Sphere
        ref={meshRef}
        args={[isSelected ? 0.35 : 0.25, 16, 16]}
        onClick={() => onSelect(node.id)}
        onPointerOver={() => { setHovered(true); onHover(node.id); }}
        onPointerOut={() => { setHovered(false); onHover(null); }}
      >
        <meshStandardMaterial 
          color={color} 
          emissive={color}
          emissiveIntensity={isSelected ? 0.5 : 0.2}
          roughness={0.3}
          metalness={0.8}
        />
      </Sphere>
      <Html distanceFactor={10} position={[0, -0.5, 0]} center>
        <div className={`text-[10px] px-2 py-1 rounded whitespace-nowrap transition-all ${
          isSelected ? 'bg-surface border border-accent-green text-accent-green' : 'bg-surface/80 border border-border text-text-muted'
        }`}>
          {node.label.slice(0, 15)}
        </div>
      </Html>
    </group>
  );
}

function GraphEdges({ edges, nodes }: { edges: GraphEdge[]; nodes: GraphNode[] }) {
  const nodeMap = useMemo(() => {
    const map = new Map<string, GraphNode>();
    nodes.forEach(n => map.set(n.id, n));
    return map;
  }, [nodes]);
  
  return (
    <>
      {edges.map((edge, i) => {
        const source = nodeMap.get(edge.source);
        const target = nodeMap.get(edge.target);
        if (!source || !target) return null;
        
        return (
          <Line
            key={i}
            points={[source.position, target.position]}
            color="#4b5563"
            lineWidth={1}
            transparent
            opacity={0.4}
          />
        );
      })}
    </>
  );
}

function Scene({ 
  nodes, 
  edges, 
  selectedNodeId, 
  onSelectNode,
  onHoverNode 
}: { 
  nodes: GraphNode[]; 
  edges: GraphEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onHoverNode: (id: string | null) => void;
}) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} color="#4b5563" />
      
      <GraphEdges edges={edges} nodes={nodes} />
      
      {nodes.map((node) => (
        <GraphNode3D
          key={node.id}
          node={node}
          selected={selectedNodeId === node.id}
          onSelect={onSelectNode}
          onHover={onHoverNode}
        />
      ))}
      
      <OrbitControls 
        enablePan 
        enableZoom 
        enableRotate 
        minDistance={3}
        maxDistance={20}
        autoRotate={false}
        autoRotateSpeed={0.5}
      />
    </>
  );
}

function NodeInspector({ 
  node, 
  onClose,
  onNavigate 
}: { 
  node: GraphNode | null; 
  onClose: () => void;
  onNavigate: (type: string, id: string) => void;
}) {
  if (!node) return null;
  
  const typeLabels: Record<EntityType, string> = {
    task: 'Tarea',
    run: 'Ejecución',
    thread: 'Conversación',
    agent: 'Agente',
    snapshot: 'Snapshot',
    import: 'Importación',
    decision: 'Decisión',
    artifact: 'Artifact',
  };
  
  return (
    <div className="absolute right-4 top-4 w-72 bg-surface/95 backdrop-blur border border-border rounded-xl p-4 shadow-2xl">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-text-muted uppercase tracking-wider">{typeLabels[node.type]}</span>
        <button onClick={onClose} className="text-text-muted hover:text-text-primary">
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <h3 className="text-sm font-semibold mb-2">{node.label}</h3>
      
      {node.status && (
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-[10px] px-2 py-0.5 rounded ${
            node.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
            node.status === 'running' ? 'bg-amber-500/20 text-amber-400' :
            'bg-surface2 text-text-muted'
          }`}>
            {node.status}
          </span>
        </div>
      )}
      
      <div className="space-y-2 text-xs text-text-muted">
        {node.data?.agentName && (
          <div className="flex items-center gap-2">
            <Bot className="h-3 w-3" />
            <span>{node.data.agentName}</span>
          </div>
        )}
        
        {node.data?.createdAt && (
          <div className="flex items-center gap-2">
            <Clock className="h-3 w-3" />
            <span>{new Date(node.data.createdAt).toLocaleString()}</span>
          </div>
        )}
      </div>
      
      <div className="mt-4 pt-3 border-t border-border space-y-2">
        {node.type === 'task' && (
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onNavigate('task', node.id)}>
            Ver tarea
          </Button>
        )}
        {node.type === 'run' && (
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onNavigate('run', node.id)}>
            Ver ejecución
          </Button>
        )}
        {node.type === 'thread' && (
          <Button size="sm" variant="outline" className="w-full text-xs" onClick={() => onNavigate('thread', node.id)}>
            Abrir chat
          </Button>
        )}
      </div>
    </div>
  );
}

export function ProjectBoard({
  projectSlug,
  tasks,
  runs,
  threads,
  snapshots,
  imports,
  agents,
  delegations,
  decisions,
  artifacts,
  projectMemory,
  knowledge,
}: ProjectBoardProps) {
  const { t } = useI18n();
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('graph');
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [webglSupported, setWebglSupported] = useState(true);
  
  // Check WebGL support
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      if (!gl) setWebglSupported(false);
    } catch {
      setWebglSupported(false);
    }
  }, []);
  
  // Build graph data
  const { nodes, edges } = useMemo(() => {
    const nodeList: GraphNode[] = [];
    const edgeList: GraphEdge[] = [];
    const nodeMap = new Map<string, number>();
    
    let idx = 0;
    
    // Add agents (center nodes)
    agents.forEach((agent, i) => {
      const angle = (i / agents.length) * Math.PI * 2;
      const radius = 2;
      nodeList.push({
        id: `agent-${agent.id}`,
        type: 'agent',
        label: agent.name,
        status: agent.status || 'idle',
        position: [Math.cos(angle) * radius, 1, Math.sin(angle) * radius],
        data: { role: agent.role },
      });
      nodeMap.set(agent.id, idx++);
    });
    
    // Add tasks
    tasks.forEach((task, i) => {
      const agentIdx = task.assigneeAgentId ? nodeMap.get(task.assigneeAgentId) : undefined;
      const basePos = agentIdx !== undefined ? nodeList[agentIdx]?.position : [0, 0, 0];
      nodeList.push({
        id: `task-${task.id}`,
        type: 'task',
        label: task.title,
        status: task.status?.toLowerCase(),
        position: [
          (basePos[0] || 0) + (Math.random() - 0.5) * 3,
          (basePos[1] || 0) - 1 - (i * 0.3),
          (basePos[2] || 0) + (Math.random() - 0.5) * 3,
        ],
        data: task,
      });
      
      if (task.assigneeAgentId) {
        edgeList.push({
          source: `agent-${task.assigneeAgentId}`,
          target: `task-${task.id}`,
          type: 'assigned',
        });
      }
    });
    
    // Add runs
    runs.forEach((run, i) => {
      const taskIdx = run.taskId ? nodeMap.get(`task-${run.taskId}`) : undefined;
      const agentIdx = run.agentId ? nodeMap.get(run.agentId) : undefined;
      const basePos = taskIdx !== undefined ? nodeList[taskIdx]?.position : agentIdx !== undefined ? nodeList[agentIdx]?.position : [0, 0, 0];
      
      nodeList.push({
        id: `run-${run.id}`,
        type: 'run',
        label: run.title || `Run ${run.id.slice(0, 6)}`,
        status: run.status,
        position: [
          (basePos[0] || 0) + (Math.random() - 0.5) * 2,
          (basePos[1] || 0) - 0.5,
          (basePos[2] || 0) + (Math.random() - 0.5) * 2,
        ],
        data: run,
      });
      
      if (run.taskId) {
        edgeList.push({
          source: `task-${run.taskId}`,
          target: `run-${run.id}`,
          type: 'executed',
        });
      }
      if (run.agentId) {
        edgeList.push({
          source: `agent-${run.agentId}`,
          target: `run-${run.id}`,
          type: 'executed_by',
        });
      }
    });
    
    // Add threads
    threads.forEach((thread) => {
      nodeList.push({
        id: `thread-${thread.id}`,
        type: 'thread',
        label: thread.title,
        position: [
          (Math.random() - 0.5) * 6,
          2 + Math.random(),
          (Math.random() - 0.5) * 6,
        ],
        data: thread,
      });
    });
    
    // Add snapshots
    snapshots.slice(0, 5).forEach((snapshot) => {
      nodeList.push({
        id: `snapshot-${snapshot.id}`,
        type: 'snapshot',
        label: snapshot.title || 'Snapshot',
        position: [
          (Math.random() - 0.5) * 4,
          -2 - Math.random() * 2,
          (Math.random() - 0.5) * 4,
        ],
        data: snapshot,
      });
    });
    
    // Add decisions
    decisions.slice(0, 5).forEach((decision) => {
      nodeList.push({
        id: `decision-${decision.path}`,
        type: 'decision',
        label: decision.name,
        position: [
          (Math.random() - 0.5) * 5,
          -3 - Math.random(),
          (Math.random() - 0.5) * 5,
        ],
        data: decision,
      });
    });
    
    // Add imports
    imports.slice(0, 3).forEach((imp) => {
      nodeList.push({
        id: `import-${imp.id}`,
        type: 'import',
        label: imp.provider || 'Import',
        position: [
          4 + Math.random() * 2,
          Math.random() * 3,
          (Math.random() - 0.5) * 4,
        ],
        data: imp,
      });
    });
    
    // Filter nodes
    const filteredNodes = filter === 'all' 
      ? nodeList 
      : nodeList.filter(n => n.type === filter);
    
    // Filter edges to only include filtered nodes
    const filteredNodeIds = new Set(filteredNodes.map(n => n.id));
    const filteredEdges = edgeList.filter(
      e => filteredNodeIds.has(e.source) && filteredNodeIds.has(e.target)
    );
    
    return { nodes: filteredNodes, edges: filteredEdges };
  }, [tasks, runs, threads, snapshots, imports, agents, decisions, filter]);
  
  const selectedNode = useMemo(() => 
    nodes.find(n => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );
  
  const handleNavigate = useCallback((type: string, id: string) => {
    if (type === 'thread') {
      router.push(`/project/${projectSlug}?view=chat&thread=${id}`);
    } else if (type === 'task') {
      router.push(`/project/${projectSlug}?view=board`);
    }
  }, [router, projectSlug]);
  
  const filterOptions = [
    { value: 'all', label: 'All', icon: Network },
    { value: 'agent', label: 'Agentes', icon: Bot },
    { value: 'task', label: 'Tareas', icon: CheckCircle2 },
    { value: 'run', label: 'Ejecuciones', icon: Zap },
    { value: 'thread', label: 'Conversaciones', icon: MessageSquare },
    { value: 'snapshot', label: 'Snapshots', icon: Camera },
    { value: 'decision', label: 'Decisiones', icon: FileText },
  ];
  
  const stats = useMemo(() => ({
    agents: agents.length,
    tasks: tasks.length,
    runs: runs.length,
    threads: threads.length,
    snapshots: snapshots.length,
    decisions: decisions.length,
    artifacts: artifacts.length,
  }), [agents, tasks, runs, threads, snapshots, decisions, artifacts]);
  
  // Empty state
  const isEmpty = nodes.length === 0;
  
  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-6 py-4">
        <div>
          <h2 className="text-xl font-semibold">Project Board</h2>
          <p className="text-xs text-text-muted mt-1">
            {stats.tasks} tareas · {stats.runs} ejecuciones · {stats.threads} conversaciones
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="flex items-center border border-border rounded-lg p-1">
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded ${
                viewMode === 'graph' 
                  ? 'bg-surface text-text-primary' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <Network className="h-4 w-4" />
              Graph
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-2 px-3 py-1.5 text-sm rounded ${
                viewMode === 'kanban' 
                  ? 'bg-surface text-text-primary' 
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              <CheckCircle2 className="h-4 w-4" />
              Kanban
            </button>
          </div>
          
          {/* Filter */}
          {viewMode === 'graph' && (
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-text-muted" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="bg-surface border border-border rounded px-2 py-1.5 text-sm text-text-primary"
              >
                {filterOptions.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>
      
      {/* Main Content */}
      <div className="flex-1 relative overflow-hidden">
        {viewMode === 'graph' ? (
          <>
            {isEmpty ? (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center max-w-md">
                  <Network className="h-16 w-16 mx-auto text-text-muted opacity-30" />
                  <h3 className="mt-4 text-lg font-medium">Mapa operativo vacío</h3>
                  <p className="mt-2 text-sm text-text-muted">
                    Habla con los agentes, crea tareas y ejecuta acciones para ver el flujo operativo de tu proyecto.
                  </p>
                  <Button 
                    onClick={() => router.push(`/project/${projectSlug}?view=chat`)}
                    className="mt-4"
                  >
                    Ir al chat
                  </Button>
                </div>
              </div>
            ) : webglSupported ? (
              <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
                <Scene
                  nodes={nodes}
                  edges={edges}
                  selectedNodeId={selectedNodeId}
                  onSelectNode={setSelectedNodeId}
                  onHoverNode={setHoveredNodeId}
                />
              </Canvas>
            ) : (
              // Fallback 2D
              <div className="absolute inset-0 overflow-auto p-6">
                <div className="grid grid-cols-4 gap-4">
                  {nodes.map(node => (
                    <div
                      key={node.id}
                      onClick={() => setSelectedNodeId(node.id)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all ${
                        selectedNodeId === node.id 
                          ? 'border-accent-green bg-accent-green/10' 
                          : 'border-border hover:border-text-muted'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`w-2 h-2 rounded-full ${
                          node.type === 'agent' ? 'bg-purple-500' :
                          node.type === 'task' ? 'bg-green-500' :
                          node.type === 'run' ? 'bg-amber-500' :
                          node.type === 'thread' ? 'bg-blue-500' :
                          'bg-gray-500'
                        }`} />
                        <span className="text-xs text-text-muted uppercase">{node.type}</span>
                      </div>
                      <p className="text-sm font-medium truncate">{node.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* Node Inspector */}
            <NodeInspector 
              node={selectedNode} 
              onClose={() => setSelectedNodeId(null)}
              onNavigate={handleNavigate}
            />
            
            {/* Legend */}
            {!isEmpty && (
              <div className="absolute bottom-4 left-4 bg-surface/90 backdrop-blur border border-border rounded-lg p-3">
                <p className="text-[10px] text-text-muted uppercase tracking-wider mb-2">Leyenda</p>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
                  {filterOptions.slice(1).map(opt => (
                    <div key={opt.value} className="flex items-center gap-1.5">
                      <span className={`w-2 h-2 rounded-full ${
                        opt.value === 'agent' ? 'bg-purple-500' :
                        opt.value === 'task' ? 'bg-green-500' :
                        opt.value === 'run' ? 'bg-amber-500' :
                        opt.value === 'thread' ? 'bg-blue-500' :
                        opt.value === 'snapshot' ? 'bg-pink-500' :
                        opt.value === 'decision' ? 'bg-violet-500' :
                        'bg-gray-500'
                      }`} />
                      <span className="text-text-muted">{opt.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          // Kanban View
          <div className="h-full overflow-auto p-6">
            <KanbanBoard 
              projectSlug={projectSlug} 
              initialTasks={tasks} 
              agents={agents} 
            />
          </div>
        )}
      </div>
    </div>
  );
}
