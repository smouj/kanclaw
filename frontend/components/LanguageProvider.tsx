'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

export type Lang = 'es' | 'en' | 'fr';

type Dict = Record<string, Record<Lang, string>>;

const dictionary: Dict = {
  'nav.overview': { es: 'Overview', en: 'Overview', fr: 'Vue d\'ensemble' },
  'nav.chat': { es: 'Chat', en: 'Chat', fr: 'Chat' },
  'nav.board': { es: 'Board', en: 'Board', fr: 'Tableau' },
  'nav.memory': { es: 'Memoria', en: 'Memory', fr: 'Mémoire' },
  'nav.files': { es: 'Archivos', en: 'Files', fr: 'Fichiers' },
  'nav.connectors': { es: 'Connectores', en: 'Connectors', fr: 'Connecteurs' },

  'chat.connected': { es: 'Conectado', en: 'Connected', fr: 'Connecté' },
  'chat.disconnected': { es: 'Desconectado', en: 'Disconnected', fr: 'Déconnecté' },
  'chat.thinking': { es: 'Procesando respuesta...', en: 'Thinking…', fr: 'Réflexion…' },
  'chat.send': { es: 'Enviar', en: 'Send', fr: 'Envoyer' },
  'chat.selectThread': { es: 'Selecciona un hilo', en: 'Select a thread', fr: 'Sélectionnez un fil' },
  'chat.noMessages': { es: 'Sin conversación aún', en: 'No conversation yet', fr: 'Pas encore de conversation' },
  'chat.startConversation': { es: 'Envía un mensaje para empezar', en: 'Send a message to start', fr: 'Envoyez un message pour commencer' },
  'chat.selectAgent': { es: 'Selecciona un agente:', en: 'Select an agent:', fr: 'Sélectionnez un agent :' },
  'chat.context': { es: 'Contexto:', en: 'Context:', fr: 'Contexte :' },

  'overview.conversations': { es: 'Conversaciones', en: 'Conversations', fr: 'Conversations' },
  'overview.tasks': { es: 'Tareas', en: 'Tasks', fr: 'Tâches' },
  'overview.runs': { es: 'Ejecuciones', en: 'Runs', fr: 'Exécutions' },
  'overview.snapshots': { es: 'Snapshots', en: 'Snapshots', fr: 'Captures' },
  'overview.agents': { es: 'Agentes del proyecto', en: 'Project agents', fr: 'Agents du projet' },
  'overview.activity': { es: 'Actividad reciente', en: 'Recent activity', fr: 'Activité récente' },
  'overview.noActivity': { es: 'Sin actividad registrada', en: 'No activity recorded', fr: 'Aucune activité enregistrée' },

  'common.refresh': { es: 'Refresh', en: 'Refresh', fr: 'Rafraîchir' },
  'common.snapshot': { es: 'Snapshot', en: 'Snapshot', fr: 'Capture' },
  'common.quickActions': { es: 'Acciones rápidas', en: 'Quick actions', fr: 'Actions rapides' },
  'common.save': { es: 'Guardar', en: 'Save', fr: 'Enregistrer' },
};

interface LanguageContextValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>('es');

  useEffect(() => {
    const saved = localStorage.getItem('kanclaw-lang') as Lang | null;
    if (saved && ['es', 'en', 'fr'].includes(saved)) {
      setLangState(saved);
      document.documentElement.lang = saved;
    }
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem('kanclaw-lang', next);
    document.documentElement.lang = next;
  };

  const t = useCallback((key: string, fallback?: string) => {
    const item = dictionary[key];
    if (!item) return fallback || key;
    return item[lang] || fallback || key;
  }, [lang]);

  const value = useMemo(() => ({ lang, setLang, t }), [lang, t]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LanguageContext);
  if (!ctx) {
    throw new Error('useI18n must be used inside LanguageProvider');
  }
  return ctx;
}
