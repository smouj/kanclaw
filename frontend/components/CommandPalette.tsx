'use client';

import { useEffect } from 'react';
import { Command } from 'cmdk';

export interface CommandItem {
  id: string;
  label: string;
  hint?: string;
  onSelect: () => void;
}

export function CommandPalette({ open, setOpen, items }: { open: boolean; setOpen: (open: boolean) => void; items: CommandItem[] }) {
  useEffect(() => {
    const listener = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen(!open);
      }
    };
    window.addEventListener('keydown', listener);
    return () => window.removeEventListener('keydown', listener);
  }, [open, setOpen]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/65 px-4 pt-[14vh] backdrop-blur-md" onClick={() => setOpen(false)} data-testid="command-palette-overlay">
      <div className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-[#070707] shadow-[0_30px_120px_rgba(0,0,0,0.65)]" onClick={(event) => event.stopPropagation()}>
        <Command label="KanClaw Command Palette" className="w-full" loop>
          <div className="border-b border-white/6 px-5 py-4">
            <Command.Input autoFocus placeholder="Buscar acciones, agentes, memoria, conectores..." className="w-full border-0 bg-transparent text-base text-white outline-none placeholder:text-zinc-600" data-testid="command-palette-input" />
          </div>
          <Command.List className="max-h-[440px] overflow-y-auto p-3">
            <Command.Empty className="px-4 py-6 text-sm text-zinc-500">No hay resultados.</Command.Empty>
            <Command.Group heading="Acciones de KanClaw" className="text-xs text-zinc-500">
              {items.map((item) => (
                <Command.Item
                  key={item.id}
                  value={`${item.label} ${item.hint || ''}`}
                  className="group flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 text-sm text-zinc-200 outline-none data-[selected=true]:bg-white/[0.06]"
                  onSelect={() => {
                    item.onSelect();
                    setOpen(false);
                  }}
                  data-testid={`command-item-${item.id}`}
                >
                  <span>{item.label}</span>
                  <span className="text-xs text-zinc-500 group-data-[selected=true]:text-zinc-300">{item.hint}</span>
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </div>
    </div>
  );
}