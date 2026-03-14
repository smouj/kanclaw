'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface DemoProject {
  id: string;
  slug: string;
  name: string;
  description: string;
  agents: DemoAgent[];
  threads: DemoThread[];
}

interface DemoAgent {
  id: string;
  name: string;
  identity: {
    name: string;
    emoji: string;
    theme: string;
  };
}

interface DemoThread {
  id: string;
  title: string;
  scope: 'TEAM' | 'AGENT';
  messages: DemoMessage[];
}

interface DemoMessage {
  id: string;
  role: 'human' | 'agent';
  actor: string;
  content: string;
  createdAt: string;
}

interface DemoContextType {
  isDemo: boolean;
  demoProject: DemoProject | null;
  setDemoProject: (project: DemoProject | null) => void;
}

const DemoContext = createContext<DemoContextType>({
  isDemo: false,
  demoProject: null,
  setDemoProject: () => {},
});

export function useDemo() {
  return useContext(DemoContext);
}

// Demo data
const DEMO_AGENTS: DemoAgent[] = [
  {
    id: '1',
    name: 'QuestAgent',
    identity: { name: 'Quest Master', emoji: '🏰', theme: 'fantasy' },
  },
  {
    id: '2',
    name: 'CodeAgent',
    identity: { name: 'Developer', emoji: '💻', theme: 'tech' },
  },
  {
    id: '3',
    name: 'StoryAgent',
    identity: { name: 'Storyteller', emoji: '📖', theme: 'narrative' },
  },
];

const DEMO_THREADS: DemoThread[] = [
  {
    id: 't1',
    title: 'Welcome Chat',
    scope: 'TEAM',
    messages: [
      {
        id: 'm1',
        role: 'agent',
        actor: 'QuestAgent',
        content: 'Welcome to KanClaw! This is demo mode. Configure your OpenClaw in /setup',
        createdAt: new Date().toISOString(),
      },
    ],
  },
];

const DEMO_PROJECT: DemoProject = {
  id: 'demo-1',
  slug: 'demo',
  name: 'Demo Project',
  description: 'Sample project for demo mode',
  agents: DEMO_AGENTS,
  threads: DEMO_THREADS,
};

export function DemoProvider({ children }: { children: ReactNode }) {
  const [isDemo, setIsDemo] = useState(false);
  const [demoProject, setDemoProject] = useState<DemoProject | null>(null);

  useEffect(() => {
    const demo = localStorage.getItem('demo_mode') === 'true';
    setIsDemo(demo);
    if (demo) {
      setDemoProject(DEMO_PROJECT);
    }
  }, []);

  return (
    <DemoContext.Provider value={{ isDemo, demoProject, setDemoProject }}>
      {children}
    </DemoContext.Provider>
  );
}
