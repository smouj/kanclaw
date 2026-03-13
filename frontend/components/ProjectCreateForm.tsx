'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function ProjectCreateForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    const agents = String(formData.get('agents') || '')
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean)
      .map((name) => ({ name, role: '' }));

    const response = await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        description: formData.get('description'),
        agents,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      toast.error('No se pudo crear el proyecto.');
      return;
    }

    const project = await response.json();
    toast.success('Proyecto creado correctamente.');
    router.push(`/project/${project.slug}`);
    router.refresh();
  }

  return (
    <form action={handleSubmit} className="panel-muted flex flex-col gap-4 p-5 lg:p-6" data-testid="project-create-form">
      <div>
        <p className="text-xs uppercase tracking-[0.3em] text-muted">Crear workspace</p>
        <h2 className="mt-2 text-2xl font-semibold">Nuevo proyecto aislado</h2>
      </div>

      <div className="space-y-2">
        <label htmlFor="project-name" className="text-sm text-zinc-300">Nombre</label>
        <Input id="project-name" name="name" required placeholder="KanClaw Studio" data-testid="project-name-input" />
      </div>

      <div className="space-y-2">
        <label htmlFor="project-description" className="text-sm text-zinc-300">Descripción</label>
        <Textarea id="project-description" name="description" rows={4} placeholder="Objetivo, alcance y tono del proyecto." data-testid="project-description-input" />
      </div>

      <div className="space-y-2">
        <label htmlFor="project-agents" className="text-sm text-zinc-300">Agentes iniciales</label>
        <Input id="project-agents" name="agents" placeholder="PlannerAgent, BuilderAgent, QAAgent" data-testid="project-agents-input" />
      </div>

      <Button type="submit" disabled={loading} className="mt-2 gap-2" data-testid="project-create-submit-button">
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        Crear proyecto
      </Button>
    </form>
  );
}