import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { LanguageProvider } from '@/components/LanguageProvider';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';
import { DemoProvider } from '@/components/DemoProvider';
import { ToastProvider } from '@/components/ToastProvider';
import { OfflineIndicator } from '@/components/OfflineIndicator';

export const metadata: Metadata = {
  title: {
    default: 'KanClaw - Workspace OS for AI Agent Teams',
    template: '%s | KanClaw',
  },
  description: 'Living Workspace OS for AI agent teams - manage projects, conversations, and AI workflows',
  keywords: ['AI', 'agents', 'workspace', 'productivity', 'development', 'automation'],
  authors: [{ name: 'KanClaw Team' }],
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'es_ES',
    url: 'https://kanclaw.io',
    siteName: 'KanClaw',
    title: 'KanClaw - Workspace OS for AI Agent Teams',
    description: 'Living Workspace OS for AI agent teams',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'KanClaw',
    description: 'Workspace OS for AI Agent Teams',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KanClaw',
  },
  icons: {
    icon: [
      { url: '/favicon.png', sizes: 'any', type: 'image/png' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <DemoProvider>
          <ToastProvider>
            <LanguageProvider>
              <ServiceWorkerRegistration />
              <OfflineIndicator />
              {children}
              <Toaster theme="system" richColors position="top-right" />
            </LanguageProvider>
          </ToastProvider>
        </DemoProvider>
      </body>
    </html>
  );
}
