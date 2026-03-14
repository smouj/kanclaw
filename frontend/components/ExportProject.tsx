'use client';

import { useState } from 'react';
import { Download, Loader2, FileArchive } from 'lucide-react';
import { useToast } from '@/components/ToastProvider';

interface Project {
  id: string;
  slug: string;
  name: string;
  description: string | null;
}

interface ExportProjectProps {
  project: Project;
}

export function ExportProject({ project }: ExportProjectProps) {
  const [exporting, setExporting] = useState(false);
  const { addToast } = useToast();

  async function handleExport() {
    setExporting(true);
    try {
      // Fetch project data
      const response = await fetch(`/api/projects?slug=${project.slug}`);
      if (!response.ok) throw new Error('Failed to fetch project');
      
      const data = await response.json();
      
      // Create export object
      const exportData = {
        project: {
          name: project.name,
          slug: project.slug,
          description: project.description,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        },
        agents: data.agents || [],
        tasks: data.tasks || [],
        runs: data.runs || [],
      };
      
      // Convert to JSON
      const jsonStr = JSON.stringify(exportData, null, 2);
      
      // Create blob and download
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.slug}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      addToast(`Proyecto ${project.name} exportado correctamente`, 'success');
    } catch (error) {
      console.error('Export failed:', error);
      addToast('Error al exportar el proyecto', 'error');
    }
    setExporting(false);
  }

  return (
    <button
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-zinc-300 transition hover:bg-white/10 disabled:opacity-50"
      title="Export project as JSON"
    >
      {exporting ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : (
        <Download className="h-4 w-4" />
      )}
      <span className="hidden sm:inline">Export</span>
    </button>
  );
}
