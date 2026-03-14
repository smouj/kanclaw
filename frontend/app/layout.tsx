import './globals.css';
import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { Toaster } from 'sonner';
import { LanguageProvider } from '@/components/LanguageProvider';

export const metadata: Metadata = {
  title: 'KanClaw',
  description: 'Living Workspace OS for AI agent teams',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body>
        <LanguageProvider>
          {children}
          <Toaster theme="system" richColors position="top-right" />
        </LanguageProvider>
      </body>
    </html>
  );
}
