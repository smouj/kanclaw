'use client';

import { toast } from 'sonner';

// Toast utilities for consistent notifications

export function showToast(message: string, type: 'success' | 'error' | 'info' = 'info') {
  switch (type) {
    case 'success':
      toast.success(message);
      break;
    case 'error':
      toast.error(message);
      break;
    default:
      toast(message);
  }
}

// Predefined toasts for common actions
export const ToastMessages = {
  // Project
  projectCreated: () => toast.success('Project created successfully'),
  projectDeleted: () => toast.success('Project deleted'),
  projectError: (error: string) => toast.error(error || 'Failed to load project'),

  // Chat
  messageSent: () => toast.success('Message sent'),
  messageError: () => toast.error('Failed to send message'),

  // Agents
  agentAdded: (name: string) => toast.success(`Agent ${name} added`),
  agentRemoved: (name: string) => toast.success(`Agent ${name} removed`),

  // Files
  fileUploaded: () => toast.success('File uploaded'),
  fileDeleted: () => toast.success('File deleted'),
  fileError: () => toast.error('File operation failed'),

  // Snapshots
  snapshotCreated: () => toast.success('Snapshot created'),
  snapshotRestored: () => toast.success('Snapshot restored'),

  // Settings
  settingsSaved: () => toast.success('Settings saved'),
  settingsError: () => toast.error('Failed to save settings'),

  // Network
  offline: () => toast.error('You are offline. Please check your connection.'),
  online: () => toast.success('Back online!'),

  // Generic
  loading: (message: string) => toast.loading(message),
  dismiss: () => toast.dismiss(),
} as const;
