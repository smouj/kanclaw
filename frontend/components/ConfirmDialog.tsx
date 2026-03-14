'use client';

import { useState } from 'react';
import { AlertTriangle, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
  variant?: 'danger' | 'warning';
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
  variant = 'danger',
}: ConfirmDialogProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onCancel}
      />
      
      {/* Dialog */}
      <div className="relative z-10 kanclaw-panel w-full max-w-md p-6 m-4">
        <button
          onClick={onCancel}
          disabled={loading}
          className="absolute right-4 top-4 rounded-full p-1 transition-colors hover:bg-white/10 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex items-start gap-4">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${variant === 'danger' ? 'bg-red-500/20' : 'bg-amber-500/20'}`}>
            <AlertTriangle className={`h-5 w-5 ${variant === 'danger' ? 'text-red-400' : 'text-amber-400'}`} />
          </div>
          
          <div className="flex-1">
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="mt-2 text-sm text-zinc-400">{message}</p>
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={onCancel}
            disabled={loading}
            className="flex-1"
          >
            {cancelLabel}
          </Button>
          <Button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 ${variant === 'danger' ? 'bg-red-600 hover:bg-red-700' : 'bg-amber-600 hover:bg-amber-700'}`}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              confirmLabel
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
