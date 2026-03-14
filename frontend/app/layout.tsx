import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { LanguageProvider } from '@/components/LanguageProvider';
import { ServiceWorkerRegistration } from '@/components/ServiceWorkerRegistration';

export const metadata: Metadata = {
  title: 'KanClaw',
  description: 'Living Workspace OS for AI agent teams',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'KanClaw',
  },
  icons: {
    icon: [
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
        <LanguageProvider>
          <ServiceWorkerRegistration />
          {children}
          <Toaster theme="system" richColors position="top-right" />
        </LanguageProvider>
      </body>
    </html>
  );
}
