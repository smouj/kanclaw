'use client';

import { useState, useEffect } from 'react';
import { GitBranch, MessageSquare, Play, CheckCircle, XCircle, Clock } from 'lucide-react';

interface ProvenanceNode {
  id: string;
  type: 'message' | 'run' | 'task';
  title: string;
  snippet: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface ProvenanceLink {
  sourceId: string;
  targetId: string;
  relationship: string;
}

interface ProvenanceViewerProps {
  projectSlug: string;
}

export function ProvenanceViewer({ projectSlug }: ProvenanceViewerProps) {
  const [graph, setGraph] = useState<{ nodes: ProvenanceNode[]; links: ProvenanceLink[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<ProvenanceNode | null>(null);

  useEffect(() => {
    fetch(`/api/projects/${projectSlug}/provenance`)
      .then(res => res.json())
      .then(data => {
        setGraph(data.graph || { nodes: [], links: [] });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [projectSlug]);

  const getIcon = (type: string) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4" />;
      case 'run': return <Play className="w-4 h-4" />;
      case 'task': return <CheckCircle className="w-4 h-4" />;
      default: return <GitBranch className="w-4 h-4" />;
    }
  };

  const getColor = (type: string) => {
    switch (type) {
      case 'message': return 'bg-blue-100 text-blue-700';
      case 'run': return 'bg-purple-100 text-purple-700';
      case 'task': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!graph || graph.nodes.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <GitBranch className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No hay datos de trazabilidad</p>
        <p className="text-sm">Activa USE_PROVENANCE_V2 para ver el grafo</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <GitBranch className="w-5 h-5" />
          Trazabilidad
        </h2>
        <span className="text-sm text-muted-foreground">
          {graph.nodes.length} nodos
        </span>
      </div>

      {/* Graph View */}
      <div className="border rounded-lg overflow-hidden">
        <div className="bg-muted/30 p-2 border-b flex items-center gap-2 text-sm">
          <span className="font-medium">Vista de Grafo</span>
        </div>
        <div className="p-4 max-h-96 overflow-auto space-y-2">
          {graph.nodes.map((node) => (
            <button
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left hover:bg-accent transition ${
                selectedNode?.id === node.id ? 'ring-2 ring-primary' : ''
              }`}
            >
              <span className={`p-2 rounded ${getColor(node.type)}`}>
                {getIcon(node.type)}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{node.title}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {node.snippet || node.type}
                </p>
              </div>
              <Clock className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Links */}
      {graph.links.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/30 p-2 border-b text-sm">
            <span className="font-medium">Relaciones</span>
          </div>
          <div className="p-4 space-y-1">
            {graph.links.slice(0, 10).map((link, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="font-mono text-xs bg-muted px-1 rounded">
                  {link.sourceId.slice(0, 8)}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="text-xs text-muted-foreground">
                  {link.relationship}
                </span>
                <span className="text-muted-foreground">→</span>
                <span className="font-mono text-xs bg-muted px-1 rounded">
                  {link.targetId.slice(0, 8)}
                </span>
              </div>
            ))}
            {graph.links.length > 10 && (
              <p className="text-sm text-muted-foreground">
                +{graph.links.length - 10} más
              </p>
            )}
          </div>
        </div>
      )}

      {/* Selected Node Detail */}
      {selectedNode && (
        <div className="border rounded-lg p-4 bg-card">
          <h3 className="font-medium mb-2">Detalle</h3>
          <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-40">
            {JSON.stringify(selectedNode, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
