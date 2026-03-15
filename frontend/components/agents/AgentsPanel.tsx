'use client';

import { useState } from 'react';
import { 
  Bot, Plus, Settings, Trash2, RefreshCw, 
  CheckCircle2, XCircle, Clock, MoreVertical,
  Users, Shield, Sparkles, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useI18n } from '@/components/LanguageProvider';

interface Agent {
  id: string;
  name: string;
  role: string;
  status: string;
  soulPath?: string;
  toolsPath?: string;
  memorySummary?: string;
  isOfficial: boolean;
  officialId?: string;
  gatewayAgentId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AgentsPanelProps {
  agents: Agent[];
  projectSlug: string;
  onAddOfficial?: () => void;
  onCreateCustom?: (name: string, role: string) => void;
  onDelete?: (agentId: string) => void;
}

export function AgentsPanel({ agents, projectSlug, onAddOfficial, onCreateCustom, onDelete }: AgentsPanelProps) {
  const { t } = useI18n();
  const [showCreate, setShowCreate] = useState(false);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentRole, setNewAgentRole] = useState('');
  const [filter, setFilter] = useState<'all' | 'official' | 'custom'>('all');
  
  const filteredAgents = agents.filter(agent => {
    if (filter === 'official') return agent.isOfficial;
    if (filter === 'custom') return !agent.isOfficial;
    return true;
  });
  
  const officialAgents = agents.filter(a => a.isOfficial);
  const customAgents = agents.filter(a => !a.isOfficial);
  
  const handleCreate = () => {
    if (newAgentName.trim() && newAgentRole.trim()) {
      onCreateCustom?.(newAgentName.trim(), newAgentRole.trim());
      setNewAgentName('');
      setNewAgentRole('');
      setShowCreate(false);
    }
  };
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 text-emerald-400" />;
      case 'idle': return <Clock className="w-4 h-4 text-zinc-400" />;
      case 'error': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-zinc-500" />;
    }
  };
  
  const getRoleBadge = (role: string) => {
    const badges: Record<string, { icon: typeof Sparkles; color: string; label: string }> = {
      'strategist': { icon: Sparkles, color: 'bg-purple-500/20 text-purple-400', label: 'Strategist' },
      'builder': { icon: Bot, color: 'bg-blue-500/20 text-blue-400', label: 'Builder' },
      'researcher': { icon: Users, color: 'bg-cyan-500/20 text-cyan-400', label: 'Researcher' },
      'qa': { icon: Shield, color: 'bg-amber-500/20 text-amber-400', label: 'QA' },
      'repoops': { icon: Settings, color: 'bg-emerald-500/20 text-emerald-400', label: 'RepoOps' },
      'memory': { icon: Users, color: 'bg-pink-500/20 text-pink-400', label: 'Memory' },
    };
    const badge = badges[role.toLowerCase()] || { icon: Bot, color: 'bg-zinc-500/20 text-zinc-400', label: role };
    const Icon = badge.icon;
    return (
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] ${badge.color}`}>
        <Icon className="w-3 h-3" />
        {badge.label}
      </span>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border">
        <div className="flex items-center gap-3">
          <Bot className="w-5 h-5 text-zinc-400" />
          <h2 className="text-lg font-semibold">{t('nav.agents', 'Agentes')}</h2>
          <span className="text-xs text-zinc-500 bg-surface2 px-2 py-0.5 rounded">
            {agents.length} {agents.length === 1 ? 'agente' : 'agentes'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {onAddOfficial && (
            <Button variant="outline" size="sm" onClick={onAddOfficial}>
              <Plus className="w-4 h-4 mr-1" />
              Añadir oficial
            </Button>
          )}
          <Button size="sm" onClick={() => setShowCreate(true)}>
            <Plus className="w-4 h-4 mr-1" />
            Crear agente
          </Button>
        </div>
      </div>
      
      {/* Filters */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-surface2/50">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1.5 text-xs rounded-lg transition ${
            filter === 'all' ? 'bg-surface text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Todos ({agents.length})
        </button>
        <button
          onClick={() => setFilter('official')}
          className={`px-3 py-1.5 text-xs rounded-lg transition ${
            filter === 'official' ? 'bg-surface text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Shield className="w-3 h-3 inline mr-1" />
          Oficiales ({officialAgents.length})
        </button>
        <button
          onClick={() => setFilter('custom')}
          className={`px-3 py-1.5 text-xs rounded-lg transition ${
            filter === 'custom' ? 'bg-surface text-white' : 'text-zinc-400 hover:text-white'
          }`}
        >
          <Bot className="w-3 h-3 inline mr-1" />
          Personalizados ({customAgents.length})
        </button>
      </div>
      
      {/* Agents Grid */}
      <div className="flex-1 overflow-auto p-4">
        {filteredAgents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-zinc-500">
            <Bot className="w-12 h-12 mb-4 opacity-30" />
            <p className="text-sm">No hay agentes</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setShowCreate(true)}>
              Crear primer agente
            </Button>
          </div>
        ) : (
          <div className="grid gap-3">
            {filteredAgents.map((agent) => (
              <div
                key={agent.id}
                className="group relative p-4 rounded-xl border border-border bg-surface hover:border-border-hover transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      agent.isOfficial 
                        ? 'bg-gradient-to-br from-purple-500/30 to-blue-500/30 border border-purple-500/30' 
                        : 'bg-surface2 border border-border'
                    }`}>
                      {agent.isOfficial ? (
                        <Sparkles className="w-5 h-5 text-purple-400" />
                      ) : (
                        <Bot className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{agent.name}</h3>
                        {getStatusIcon(agent.status)}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5">
                        {agent.role}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1">
                    {getRoleBadge(agent.role)}
                    <button className="p-1.5 rounded hover:bg-surface2 opacity-0 group-hover:opacity-100 transition">
                      <MoreVertical className="w-4 h-4 text-zinc-400" />
                    </button>
                  </div>
                </div>
                
                {/* Agent Details */}
                <div className="mt-3 pt-3 border-t border-border/50 grid grid-cols-2 gap-2 text-xs">
                  {agent.soulPath && (
                    <div>
                      <span className="text-zinc-500">Soul:</span>
                      <span className="text-zinc-300 ml-1 font-mono truncate">{agent.soulPath}</span>
                    </div>
                  )}
                  {agent.toolsPath && (
                    <div>
                      <span className="text-zinc-500">Tools:</span>
                      <span className="text-zinc-300 ml-1 font-mono truncate">{agent.toolsPath}</span>
                    </div>
                  )}
                  {agent.memorySummary && (
                    <div className="col-span-2">
                      <span className="text-zinc-500">Memory:</span>
                      <span className="text-zinc-400 ml-1 line-clamp-1">{agent.memorySummary}</span>
                    </div>
                  )}
                </div>
                
                {/* Actions */}
                <div className="mt-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition">
                  <Button variant="ghost" size="sm">
                    <Settings className="w-3 h-3 mr-1" />
                    Configurar
                  </Button>
                  {!agent.isOfficial && onDelete && (
                    <Button variant="ghost" size="sm" className="text-red-400 hover:text-red-300">
                      <Trash2 className="w-3 h-3 mr-1" />
                      Eliminar
                    </Button>
                  )}
                </div>
                
                {/* Official Badge */}
                {agent.isOfficial && (
                  <div className="absolute top-2 right-2">
                    <span className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded">
                      OFICIAL
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Create Agent Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="w-96 bg-surface border border-border rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-semibold mb-4">Crear agente personalizado</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Nombre</label>
                <Input
                  value={newAgentName}
                  onChange={(e) => setNewAgentName(e.target.value)}
                  placeholder="MiAgente"
                  className="bg-surface2 border-border"
                />
              </div>
              
              <div>
                <label className="text-xs text-zinc-400 mb-1 block">Rol</label>
                <Input
                  value={newAgentRole}
                  onChange={(e) => setNewAgentRole(e.target.value)}
                  placeholder="assistant"
                  className="bg-surface2 border-border"
                />
              </div>
              
              <div className="p-3 bg-surface2 rounded-lg text-xs text-zinc-400">
                <AlertCircle className="w-4 h-4 inline mr-1 mb-0.5" />
                Los agentes personalizados heredan configuración del proyecto.
              </div>
            </div>
            
            <div className="flex gap-2 mt-6">
              <Button variant="outline" className="flex-1" onClick={() => setShowCreate(false)}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={!newAgentName.trim() || !newAgentRole.trim()}>
                Crear
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
