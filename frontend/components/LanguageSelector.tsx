'use client';

import { Languages } from 'lucide-react';
import { useI18n, type Lang } from '@/components/LanguageProvider';

const labels: Record<Lang, string> = {
  es: 'ES',
  en: 'EN',
  fr: 'FR',
};

export function LanguageSelector() {
  const { lang, setLang } = useI18n();

  return (
    <div className="flex items-center gap-1 rounded border border-border bg-surface2 px-2 py-1" role="group" aria-label="Language selector">
      <Languages className="h-4 w-4 text-text-muted" aria-hidden="true" />
      {(['es', 'en', 'fr'] as Lang[]).map((code) => (
        <button
          key={code}
          onClick={() => setLang(code)}
          className={`px-2 py-0.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-text-primary/50 ${
            lang === code
              ? 'text-text-primary bg-surface border border-border'
              : 'text-text-muted hover:text-text-primary'
          }`}
          aria-label={`Set language ${code}`}
          aria-pressed={lang === code}
          type="button"
        >
          {labels[code]}
        </button>
      ))}
    </div>
  );
}
