'use client';

import { useState } from 'react';
import { Settings, Shield, Zap, Check, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ConfigFormData {
  openclawUrl: string;
  openclawToken: string;
  authToken: string;
  demoMode: boolean;
}

export default function SetupPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  
  const [formData, setFormData] = useState<ConfigFormData>({
    openclawUrl: typeof window !== 'undefined' ? localStorage.getItem('openclaw_url') || '' : '',
    openclawToken: typeof window !== 'undefined' ? localStorage.getItem('openclaw_token') || '' : '',
    authToken: typeof window !== 'undefined' ? localStorage.getItem('kanclaw_auth_token') || '' : '',
    demoMode: typeof window !== 'undefined' ? localStorage.getItem('demo_mode') === 'true' : false,
  });

  const handleSave = async () => {
    setSaving(true);
    localStorage.setItem('openclaw_url', formData.openclawUrl);
    localStorage.setItem('openclaw_token', formData.openclawToken);
    localStorage.setItem('kanclaw_auth_token', formData.authToken);
    localStorage.setItem('demo_mode', formData.demoMode.toString());
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const testConnection = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`${formData.openclawUrl}/api/health`, {
        headers: {
          'Authorization': `Bearer ${formData.openclawToken}`,
        },
      });
      if (response.ok) {
        setTestResult({ success: true, message: 'Connection successful!' });
      } else {
        setTestResult({ success: false, message: `Error: ${response.status}` });
      }
    } catch {
      setTestResult({ success: false, message: 'Could not connect. Check URL.' });
    }
    setTesting(false);
  };

  const enterDemo = () => {
    localStorage.setItem('demo_mode', 'true');
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-background text-foreground p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Settings className="w-8 h-8 text-accent-green" />
          <h1 className="text-3xl font-bold">KanClaw Setup</h1>
        </div>

        {/* Demo Mode */}
        <div className="card mb-6 p-6 border border-border rounded-lg bg-surface">
          <div className="flex items-center gap-3 mb-4">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h2 className="text-xl font-semibold">Try Demo Mode</h2>
          </div>
          <p className="text-text-muted mb-4">
            Explore KanClaw with sample data - no configuration needed!
          </p>
          <button
            onClick={enterDemo}
            className="btn btn-primary"
          >
            Enter Demo Mode
          </button>
        </div>

        {/* OpenClaw Configuration */}
        <div className="card mb-6 p-6 border border-border rounded-lg bg-surface">
          <div className="flex items-center gap-3 mb-4">
            <Shield className="w-6 h-6 text-accent-green" />
            <h2 className="text-xl font-semibold">OpenClaw Configuration</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                OpenClaw URL
              </label>
              <input
                type="url"
                value={formData.openclawUrl}
                onChange={(e) => setFormData({ ...formData, openclawUrl: e.target.value })}
                placeholder="http://localhost:3001"
                className="w-full px-4 py-2 rounded border border-border bg-surface2 text-foreground"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                OpenClaw Token
              </label>
              <input
                type="password"
                value={formData.openclawToken}
                onChange={(e) => setFormData({ ...formData, openclawToken: e.target.value })}
                placeholder="Your OpenClaw API token"
                className="w-full px-4 py-2 rounded border border-border bg-surface2 text-foreground"
              />
            </div>

            <button
              onClick={testConnection}
              disabled={testing || !formData.openclawUrl}
              className="btn btn-secondary"
            >
              {testing ? 'Testing...' : 'Test Connection'}
            </button>

            {testResult && (
              <div className={`flex items-center gap-2 p-3 rounded ${testResult.success ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                {testResult.success ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                {testResult.message}
              </div>
            )}
          </div>
        </div>

        {/* Optional Auth */}
        <div className="card mb-6 p-6 border border-border rounded-lg bg-surface">
          <h2 className="text-xl font-semibold mb-4">Optional: Protect with Auth</h2>
          <p className="text-text-muted mb-4">
            Set a token to require authentication when accessing KanClaw.
          </p>

          <div>
            <label className="block text-sm font-medium mb-2">
              Auth Token (optional)
            </label>
            <input
              type="password"
              value={formData.authToken}
              onChange={(e) => setFormData({ ...formData, authToken: e.target.value })}
              placeholder="Leave empty for public access"
              className="w-full px-4 py-2 rounded border border-border bg-surface2 text-foreground"
            />
          </div>
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary w-full"
        >
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Configuration'}
        </button>
      </div>
    </div>
  );
}
